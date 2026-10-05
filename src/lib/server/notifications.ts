import { and, eq, isNull, lt } from 'drizzle-orm';
import { isLocale, type Locale } from '$lib/i18n/index.svelte';
import type { Location } from '$lib/items';
import { REMINDER_KINDS, isNotifyMode, type NotifyMode, type ReminderKind } from '$lib/reminders';
import { daysUntil } from '$lib/stock';
import { getDb } from './db';
import { items, notificationsSent, pushSubscriptions, users } from './db/schema';
import { serverMessages } from './i18n';
import { sendPush, type PushMessage } from './push';
import { getSetting, setSettings, soonDays } from './settings';

// Reminds of what is about to expire: the day a content reaches the "expires soon" threshold,
// the day of its best-before date, and the day after. Only the day is known, not a time, so
// the messages of a day are sent from an hour the user chooses.

const today = (now = new Date()) => now.toLocaleDateString('sv-SE');
const addDays = (day: string, days: number) => {
	const date = new Date(`${day}T12:00:00`);
	date.setDate(date.getDate() + days);
	return date.toLocaleDateString('sv-SE');
};

// ---- What the user wants ----

// Read in one place. Today there is one account; with several users this is where the
// settings would be read per user (`userId` is not needed until then).
export function prefsFor(userId: number) {
	void userId;
	const mode = getSetting('notifyMode');
	const hour = Number(getSetting('notifyHour'));
	return {
		mode: (isNotifyMode(mode) ? mode : 'off') as NotifyMode,
		hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 9,
		from: getSetting('notifyFrom'),
		kinds: {
			soon: getSetting('notifySoon') === 'on',
			today: getSetting('notifyToday') === 'on',
			expired: getSetting('notifyExpired') === 'on'
		} satisfies Record<ReminderKind, boolean>
	};
}

// Saves what was chosen (only what is given). Switching the reminders on starts today:
// nothing that was due before is announced.
export function savePrefs(
	userId: number,
	values: { mode?: NotifyMode; hour?: number; kind?: ReminderKind; on?: boolean },
	now = new Date()
) {
	const before = prefsFor(userId);
	const switchedOn = before.mode === 'off' && values.mode !== undefined && values.mode !== 'off';
	const kindKey = { soon: 'notifySoon', today: 'notifyToday', expired: 'notifyExpired' } as const;
	setSettings({
		...(values.mode !== undefined && { notifyMode: values.mode }),
		...(values.hour !== undefined && { notifyHour: String(values.hour) }),
		...(values.kind !== undefined &&
			values.on !== undefined && { [kindKey[values.kind]]: values.on ? 'on' : 'off' }),
		...(switchedOn && { notifyFrom: today(now) })
	});
}

// ---- What is due ----

// A reminder that was missed (server off, device unreachable) is still sent for this long.
const CATCH_UP_DAYS = 2;

export type Due = {
	itemId: number;
	containerId: number;
	name: string;
	location: Location;
	// What the message is about; `covers` are all occasions it settles (an older one that was
	// missed is not sent on top of a newer one)
	kind: ReminderKind;
	covers: ReminderKind[];
	// Best-before date, and how many days it is away on the day of the message (negative = past)
	date: string;
	days: number;
};

// The day an occasion falls on for a content. `soon` has none if the content was only stored
// on or after that day: something with a short shelf life would otherwise report itself the
// moment it is put away.
function occasionDay(kind: ReminderKind, bestBefore: string, storedOn: string, threshold: number) {
	if (kind === 'today') return bestBefore;
	if (kind === 'expired') return addDays(bestBefore, 1);
	const day = addDays(bestBefore, -threshold);
	return storedOn >= day ? null : day;
}

// What is to be announced now: per content the latest occasion of the last days that is
// switched on and was not announced yet. Sorted like the stock list: what expires first.
export function dueReminders(userId: number, day = today()): Due[] {
	const { from, kinds } = prefsFor(userId);
	const since = [addDays(day, -CATCH_UP_DAYS), from].sort().at(-1)!;
	const threshold = soonDays();
	const db = getDb();
	const sent = new Set(
		db
			.select()
			.from(notificationsSent)
			.where(eq(notificationsSent.userId, userId))
			.all()
			.map((row) => `${row.itemId}:${row.kind}:${row.date}`)
	);
	const stock = db
		.select()
		.from(items)
		.where(isNull(items.removedAt))
		.orderBy(items.bestBefore, items.name)
		.all();

	const due: Due[] = [];
	for (const item of stock) {
		if (!item.bestBefore) continue;
		const bestBefore = item.bestBefore;
		const storedOn = today(item.createdAt);
		const fresh = REMINDER_KINDS.filter((kind) => {
			if (!kinds[kind] || sent.has(`${item.id}:${kind}:${bestBefore}`)) return false;
			const on = occasionDay(kind, bestBefore, storedOn, threshold);
			return on !== null && on >= since && on <= day;
		});
		if (fresh.length === 0) continue;
		due.push({
			itemId: item.id,
			containerId: item.containerId,
			name: item.name,
			location: item.location,
			kind: fresh.at(-1)!, // REMINDER_KINDS is in the order of time
			covers: fresh,
			date: bestBefore,
			days: daysUntil(bestBefore, day)
		});
	}
	return due;
}

// ---- The messages ----

function locale(): Locale {
	const stored = getSetting('uiLanguage');
	return isLocale(stored) ? stored : 'en';
}

// The picture of every reminder: a calendar with a clock in the colours of the logo (the phone
// shows the app icon next to it anyway, so this is deliberately another one)
const ICON = '/icons/notify.png';

// So many contents are listed in a summary; the rest is counted.
const DIGEST_LINES = 6;

// "expires in 3 days" / "expired yesterday" – the same words as in the stock list
function phrase(due: Due, m: ReturnType<typeof serverMessages>) {
	return due.days < 0
		? m.home.relative(due.days)
		: m.notifications.expires(m.home.relative(due.days));
}

// One message per content (opens it), or one for all of them (opens the stock list).
// Messages with the same tag replace each other on the device.
export function buildMessages(due: Due[], mode: NotifyMode, day = today()): PushMessage[] {
	if (due.length === 0 || mode === 'off') return [];
	const m = serverMessages(locale());

	if (mode === 'digest') {
		const count = (kind: ReminderKind) => due.filter((d) => d.kind === kind).length;
		const lines = due.slice(0, DIGEST_LINES).map((d) => `${d.name} – ${phrase(d, m)}`);
		if (due.length > DIGEST_LINES) lines.push(m.notifications.more(due.length - DIGEST_LINES));
		return [
			{
				title: m.notifications.digestTitle(count('soon'), count('today'), count('expired')),
				body: lines.join('\n'),
				url: '/',
				tag: `digest-${day}`,
				icon: ICON
			}
		];
	}
	return due.map((d) => ({
		title: d.name,
		body: `${phrase(d, m)} · ${m.locations[d.location]}`,
		url: `/containers/${d.containerId}`,
		tag: `item-${d.itemId}`,
		icon: ICON
	}));
}

// For the test button: a message that looks like a real one – made from what expires first in
// the stock, in the form the user chose (marked as a test). Null if nothing has a date.
export function sampleMessage(userId: number, day = today()): PushMessage | null {
	const { mode } = prefsFor(userId);
	const stock = getDb()
		.select()
		.from(items)
		.where(isNull(items.removedAt))
		.orderBy(items.bestBefore, items.name)
		.all()
		.filter((item) => item.bestBefore !== null)
		.slice(0, 3);
	const due: Due[] = stock.map((item) => {
		const days = daysUntil(item.bestBefore!, day);
		const kind: ReminderKind = days < 0 ? 'expired' : days === 0 ? 'today' : 'soon';
		return {
			itemId: item.id,
			containerId: item.containerId,
			name: item.name,
			location: item.location,
			kind,
			covers: [kind],
			date: item.bestBefore!,
			days
		};
	});
	const digest = mode === 'digest';
	const [message] = buildMessages(
		digest ? due : due.slice(0, 1),
		digest ? 'digest' : 'single',
		day
	);
	if (!message) return null;
	const mark = serverMessages(locale()).notifications.testMark;
	return { ...message, title: `${mark} · ${message.title}`, tag: 'test' };
}

// ---- Sending ----

function markSent(userId: number, due: Due[]) {
	const values = due.flatMap((d) =>
		d.covers.map((kind) => ({ userId, itemId: d.itemId, kind, date: d.date }))
	);
	for (let i = 0; i < values.length; i += 200) {
		getDb()
			.insert(notificationsSent)
			.values(values.slice(i, i + 200))
			.onConflictDoNothing()
			.run();
	}
}

// Sends what is due to one user. Returns how many messages went out.
export async function notifyUser(userId: number, now = new Date()) {
	const { mode, hour } = prefsFor(userId);
	if (mode === 'off' || now.getHours() < hour) return 0;
	const day = today(now);
	const due = dueReminders(userId, day);
	if (due.length === 0) return 0;

	const devices = getDb()
		.select({ id: pushSubscriptions.id })
		.from(pushSubscriptions)
		.where(eq(pushSubscriptions.userId, userId))
		.all();
	// Nobody to tell: do not save it up for the day a device is switched on.
	if (devices.length === 0) {
		markSent(userId, due);
		return 0;
	}

	let sentMessages = 0;
	for (const message of buildMessages(due, mode, day)) {
		const results = await sendPush(userId, message);
		// Reached no device at all: try again with the next run (for as long as it is fresh).
		if (!results.some((r) => r.ok)) continue;
		sentMessages++;
		markSent(
			userId,
			mode === 'digest' ? due : due.filter((d) => `item-${d.itemId}` === message.tag)
		);
	}
	return sentMessages;
}

// Called by the scheduler once an hour: everyone who switched the reminders on.
export async function sendDueNotifications(now = new Date()) {
	const everyone = getDb().select({ id: users.id }).from(users).all();
	for (const { id } of everyone) {
		try {
			await notifyUser(id, now);
		} catch (err) {
			console.error(`Reminders for user ${id} failed`, err);
		}
	}
	// What was announced long ago can be forgotten (it is far outside the days looked at)
	getDb()
		.delete(notificationsSent)
		.where(and(lt(notificationsSent.date, addDays(today(now), -30))))
		.run();
}
