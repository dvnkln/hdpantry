import { and, eq, isNull, lt } from 'drizzle-orm';
import { isLocale, type Locale } from '$lib/i18n/index.svelte';
import type { Location } from '$lib/items';
import {
	REMINDER_KINDS,
	isNotifyMode,
	isSoonRepeat,
	type NotifyMode,
	type ReminderKind,
	type SoonRepeat
} from '$lib/reminders';
import { daysUntil } from '$lib/stock';
import { getDb } from './db';
import { items, notificationsSent, users } from './db/schema';
import { serverMessages } from './i18n';
import { deliver, hasEnabledTarget, type Notice } from './targets';
import { getSetting, setSettings, soonDays } from './settings';

// Reminds of what is about to expire: the day a content reaches the "expires soon" threshold
// (or every day from then on), the day of its best-before date, and the day after. Only the day is known, not a time, so
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
	const repeat = getSetting('notifySoonRepeat');
	return {
		mode: (isNotifyMode(mode) ? mode : 'off') as NotifyMode,
		hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 9,
		from: getSetting('notifyFrom'),
		soonRepeat: (isSoonRepeat(repeat) ? repeat : 'once') as SoonRepeat,
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
	values: {
		mode?: NotifyMode;
		hour?: number;
		kind?: ReminderKind;
		on?: boolean;
		// all three occasions at once (the settings form)
		kinds?: Record<ReminderKind, boolean>;
		soonRepeat?: SoonRepeat;
	},
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
		...(values.kinds && {
			notifySoon: values.kinds.soon ? 'on' : 'off',
			notifyToday: values.kinds.today ? 'on' : 'off',
			notifyExpired: values.kinds.expired ? 'on' : 'off'
		}),
		...(values.soonRepeat !== undefined && { notifySoonRepeat: values.soonRepeat }),
		...(switchedOn && { notifyFrom: today(now) })
	});
}

// ---- What is due ----

function pageOf(item: { containerId: number | null; productId: number | null }) {
	return item.containerId ? `/containers/${item.containerId}` : `/products/${item.productId}`;
}

// A reminder that was missed (server off, device unreachable) is still sent for this long.
const CATCH_UP_DAYS = 2;

export type Due = {
	// The content or pack the message is about (its id makes the tag of the message) – and all
	// packs it stands for: packs of one product with the same date at the same place make one
	// message, not one each
	itemId: number;
	itemIds: number[];
	// How many packs (0: a container)
	packs: number;
	// The page a single message opens: the container, or the product the pack belongs to
	url: string;
	name: string;
	location: Location;
	// What the message is about; `covers` are all occasions it settles (an older one that was
	// missed is not sent on top of a newer one)
	kind: ReminderKind;
	covers: ReminderKind[];
	// Best-before date, and how many days it is away on the day of the message (negative = past)
	date: string;
	// The date "soon" is noted as told under: the best-before date, or – told daily – the day
	soonDate: string;
	days: number;
};

// The day an occasion falls on for a content. `soon` is never told on the day something is
// stored (a soup that keeps for two days would report itself the moment it is put away): what
// is stored inside the threshold is told the morning after. On the best-before date itself
// `today` takes over.
function occasionDay(kind: ReminderKind, bestBefore: string, storedOn: string, threshold: number) {
	if (kind === 'today') return bestBefore;
	if (kind === 'expired') return addDays(bestBefore, 1);
	const day = [addDays(bestBefore, -threshold), addDays(storedOn, 1)].sort().at(-1)!;
	return day < bestBefore ? day : null;
}

// What is to be announced now: per content the latest occasion of the last days that is
// switched on and was not announced yet. Sorted like the stock list: what expires first.
export function dueReminders(userId: number, day = today()): Due[] {
	const { from, kinds, soonRepeat } = prefsFor(userId);
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
		const daily = soonRepeat === 'daily';
		const fresh = REMINDER_KINDS.filter((kind) => {
			if (!kinds[kind]) return false;
			const on = occasionDay(kind, bestBefore, storedOn, threshold);
			if (on === null) return false;
			// Told daily: every day from its first one on counts anew (a missed day is not
			// caught up – the message of today says it all)
			if (kind === 'soon' && daily) {
				return on <= day && day < bestBefore && !sent.has(`${item.id}:soon:${day}`);
			}
			return on >= since && on <= day && !sent.has(`${item.id}:${kind}:${bestBefore}`);
		});
		if (fresh.length === 0) continue;
		due.push({
			itemId: item.id,
			itemIds: [item.id],
			packs: item.productId ? 1 : 0,
			url: pageOf(item),
			name: item.name,
			location: item.location,
			kind: fresh.at(-1)!, // REMINDER_KINDS is in the order of time
			covers: fresh,
			date: bestBefore,
			soonDate: daily ? day : bestBefore,
			days: daysUntil(bestBefore, day)
		});
	}
	return together(due);
}

// Packs of one product with the same date at the same place, due for the same occasion, as one
// message: three packs of peas do not ring three times. The occasions settled are those of all.
function together(due: Due[]): Due[] {
	const merged: Due[] = [];
	const byKey = new Map<string, Due>();
	for (const d of due) {
		if (!d.packs) {
			merged.push(d);
			continue;
		}
		const key = `${d.url}|${d.location}|${d.date}|${d.kind}`;
		const first = byKey.get(key);
		if (!first) {
			const copy = { ...d, itemIds: [...d.itemIds], covers: [...d.covers] };
			byKey.set(key, copy);
			merged.push(copy);
			continue;
		}
		first.itemIds.push(...d.itemIds);
		first.packs += d.packs;
		for (const kind of d.covers) if (!first.covers.includes(kind)) first.covers.push(kind);
	}
	return merged;
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

// The name, with the number of packs where there are several: "Peas (3 packs)"
function title(due: Due, m: ReturnType<typeof serverMessages>) {
	return due.packs > 1 ? `${due.name} (${m.home.packs(due.packs)})` : due.name;
}

// One message per content (opens it), or one for all of them (opens the stock list).
// Messages with the same tag replace each other on the device.
export function buildMessages(due: Due[], mode: NotifyMode, day = today()): Notice[] {
	if (due.length === 0 || mode === 'off') return [];
	const m = serverMessages(locale());

	if (mode === 'digest') {
		const count = (kind: ReminderKind) => due.filter((d) => d.kind === kind).length;
		const lines = due.slice(0, DIGEST_LINES).map((d) => `${title(d, m)} – ${phrase(d, m)}`);
		if (due.length > DIGEST_LINES) lines.push(m.notifications.more(due.length - DIGEST_LINES));
		return [
			{
				title: m.notifications.digestTitle(count('soon'), count('today'), count('expired')),
				body: lines.join('\n'),
				url: '/',
				tag: `digest-${day}`,
				icon: ICON,
				count: due.length
			}
		];
	}
	return due.map((d) => ({
		title: title(d, m),
		body: `${phrase(d, m)} · ${m.locations[d.location]}`,
		url: d.url,
		tag: `item-${d.itemId}`,
		icon: ICON,
		count: 1
	}));
}

// For the test of a target: a message that looks like a real one – made from what expires
// first in the stock, in the form the user chose, marked as a test. Without anything dated in
// stock a plain sentence.
export function sampleMessage(userId: number, day = today()): Notice {
	const { mode } = prefsFor(userId);
	const m = serverMessages(locale()).notifications;
	const stock = getDb()
		.select()
		.from(items)
		.where(isNull(items.removedAt))
		.orderBy(items.bestBefore, items.name)
		.all()
		.filter((item) => item.bestBefore !== null)
		.slice(0, 20);
	const due: Due[] = stock.map((item) => {
		const days = daysUntil(item.bestBefore!, day);
		const kind: ReminderKind = days < 0 ? 'expired' : days === 0 ? 'today' : 'soon';
		return {
			itemId: item.id,
			itemIds: [item.id],
			packs: item.productId ? 1 : 0,
			url: pageOf(item),
			name: item.name,
			location: item.location,
			kind,
			covers: [kind],
			date: item.bestBefore!,
			soonDate: item.bestBefore!,
			days
		};
	});
	const digest = mode === 'digest';
	const shown = together(due).slice(0, 3);
	const [message] = buildMessages(
		digest ? shown : shown.slice(0, 1),
		digest ? 'digest' : 'single',
		day
	);
	if (!message) {
		return {
			title: m.testTitle,
			body: m.testBody,
			url: '/settings/notifications',
			tag: 'test',
			icon: ICON,
			count: 0,
			test: true
		};
	}
	return { ...message, title: `${m.testMark} · ${message.title}`, tag: 'test', test: true };
}

// ---- Sending ----

function markSent(userId: number, due: Due[]) {
	const values = due.flatMap((d) =>
		d.itemIds.flatMap((itemId) =>
			d.covers.map((kind) => ({
				userId,
				itemId,
				kind,
				date: kind === 'soon' ? d.soonDate : d.date
			}))
		)
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

	// Nobody to tell: do not save it up for the day a target is switched on.
	if (!hasEnabledTarget(userId)) {
		markSent(userId, due);
		return 0;
	}

	let sentMessages = 0;
	for (const message of buildMessages(due, mode, day)) {
		const results = await deliver(userId, message);
		// Reached no target at all: try again with the next run (for as long as it is fresh).
		if (!results.some((r) => r.ok)) continue;
		sentMessages++;
		markSent(
			userId,
			mode === 'digest' ? due : due.filter((d) => `item-${d.itemId}` === message.tag)
		);
	}
	return sentMessages;
}

// The task "notifications" of the scheduler, once an hour: everyone who switched the reminders
// on. Throws if it went wrong for somebody, so the task is shown as failed. (A single target
// that cannot be reached is not a failure: that is noted at the target.)
export async function sendDueNotifications(now = new Date()) {
	const everyone = getDb().select({ id: users.id }).from(users).all();
	let failure: unknown = null;
	for (const { id } of everyone) {
		try {
			await notifyUser(id, now);
		} catch (err) {
			console.error(`Reminders for user ${id} failed`, err);
			failure ??= err;
		}
	}

	// What was announced long ago can be forgotten (it is far outside the days looked at)
	getDb()
		.delete(notificationsSent)
		.where(and(lt(notificationsSent.date, addDays(today(now), -30))))
		.run();
	if (failure) throw failure;
}
