import { createECDH, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDb } from './db';
import {
	containers,
	items,
	notificationChannels,
	notificationsSent,
	pushSubscriptions,
	users
} from './db/schema';
import {
	buildMessages,
	dueReminders,
	notifyUser,
	prefsFor,
	sampleMessage,
	savePrefs
} from './notifications';
import { saveChannel } from './channels';
import { addDevice, listDevices, setDeviceEnabled } from './push';
import { setSettings } from './settings';

// The day everything happens on, and days counted from it
const DAY = '2031-03-10';
const plus = (days: number) => {
	const date = new Date(`${DAY}T12:00:00`);
	date.setDate(date.getDate() + days);
	return date.toLocaleDateString('sv-SE');
};
const at = (day: string, hour = 10) => new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`);

let me: number;
let n = 0;
// Puts something into a fresh container: best before on `bestBefore`, stored `storedDaysAgo`
function store(name: string, bestBefore: string | null, storedDaysAgo = 30) {
	const db = getDb();
	const code = `C${n++}`;
	const container = db
		.insert(containers)
		.values({ code, rawContent: code, source: 'camera', manual: false })
		.returning()
		.get();
	return db
		.insert(items)
		.values({
			containerId: container.id,
			name,
			vacuumed: true,
			location: 'fridge',
			bestBefore,
			fill: 'full',
			createdAt: at(plus(-storedDaysAgo))
		})
		.returning()
		.get();
}
function device() {
	const ecdh = createECDH('prime256v1');
	ecdh.generateKeys();
	addDevice(
		me,
		{
			endpoint: `https://fcm.googleapis.com/fcm/send/${randomBytes(6).toString('hex')}`,
			keys: {
				p256dh: ecdh.getPublicKey().toString('base64url'),
				auth: randomBytes(16).toString('base64url')
			}
		},
		'Mozilla/5.0 (Linux; Android 14) Chrome/126.0 Mobile Safari/537.36'
	);
}
const what = (day = DAY) => dueReminders(me, day).map((d) => `${d.name}:${d.kind}`);

beforeAll(() => {
	me = getDb().insert(users).values({ username: 'demo', passwordHash: 'x' }).returning().get().id;
	vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.spyOn(console, 'log').mockImplementation(() => {});
});
// Every test starts with an empty stock, reminders on (one by one) since long ago, 3 days
beforeEach(() => {
	const db = getDb();
	db.delete(containers).run();
	db.delete(notificationsSent).run();
	db.delete(pushSubscriptions).run();
	db.delete(notificationChannels).run();
	setSettings({
		uiLanguage: 'en',
		soonDays: '3',
		notifyMode: 'single',
		notifyHour: '9',
		notifyFrom: '2031-01-01',
		notifySoon: 'on',
		notifyToday: 'on',
		notifyExpired: 'on'
	});
	vi.mocked(fetch).mockImplementation(async () => new Response(null, { status: 201 }));
});

describe('what is due', () => {
	it('announces every occasion on its day', () => {
		store('Cheese', plus(3)); // reaches the threshold today
		store('Fish', plus(0)); // best before today
		store('Soup', plus(-1)); // expired yesterday
		store('Rice', plus(40)); // far away
		store('Salt', null); // no date
		expect(what()).toEqual(['Soup:expired', 'Fish:today', 'Cheese:soon']);
	});

	it('does not announce "soon" for what was stored inside the threshold', () => {
		store('Fresh soup', plus(2), 0); // put away today, good for two days
		store('Old cheese', plus(2), 30); // reached the threshold yesterday: caught up
		expect(what()).toEqual(['Old cheese:soon']);
		// ... but its date itself is announced
		expect(what(plus(2))).toContain('Fresh soup:today');
	});

	it('follows the threshold chosen in the settings', () => {
		store('Cheese', plus(7));
		expect(what()).toEqual([]);
		setSettings({ soonDays: '7' });
		expect(what()).toEqual(['Cheese:soon']);
	});

	it('only announces the occasions that are switched on', () => {
		store('Cheese', plus(3));
		store('Fish', plus(0));
		store('Soup', plus(-1));
		expect(what()).toEqual(['Soup:expired', 'Fish:today', 'Cheese:soon']);
		// (the soup's own day was yesterday and is caught up as long as it is fresh)
		savePrefs(me, { kind: 'today', on: false });
		expect(what()).toEqual(['Soup:expired', 'Cheese:soon']);
		savePrefs(me, { kind: 'today', on: true });
		savePrefs(me, { kind: 'soon', on: false });
		savePrefs(me, { kind: 'expired', on: false });
		expect(what()).toEqual(['Soup:today', 'Fish:today']);
	});

	it('catches up two days, and one message settles the older occasions', () => {
		store('Cheese', plus(-1)); // soon 4 days ago, today yesterday, expired today
		const [due] = dueReminders(me, DAY);
		expect(due.kind).toBe('expired');
		expect(due.covers).toEqual(['today', 'expired']);
		store('Bread', plus(-4)); // everything about it is too long ago
		expect(what()).toEqual(['Cheese:expired']);
	});

	it('starts on the day the reminders were switched on', () => {
		store('Fish', plus(-1));
		setSettings({ notifyMode: 'off' });
		savePrefs(me, { mode: 'single' }, at(DAY));
		expect(prefsFor(me).from).toBe(DAY);
		// expired "today" still counts, the date of yesterday does not
		expect(dueReminders(me, DAY).map((d) => d.covers)).toEqual([['expired']]);
	});

	it('never mentions what was eaten', () => {
		const fish = store('Fish', plus(0));
		getDb().update(items).set({ removedAt: new Date() }).where(eq(items.id, fish.id)).run();
		expect(what()).toEqual([]);
	});
});

describe('the messages', () => {
	it('one by one: the content, when and where; opens the container', () => {
		const cheese = store('Cheese', plus(3));
		store('Soup', plus(-1));
		expect(buildMessages(dueReminders(me, DAY), 'single', DAY)).toEqual([
			{
				title: 'Soup',
				body: 'expired yesterday · Fridge',
				url: expect.stringMatching(/^\/containers\/\d+$/),
				tag: expect.stringMatching(/^item-\d+$/),
				icon: '/icons/notify.png',
				count: 1
			},
			{
				title: 'Cheese',
				body: 'expires in 3 days · Fridge',
				url: `/containers/${cheese.containerId}`,
				tag: `item-${cheese.id}`,
				icon: '/icons/notify.png',
				count: 1
			}
		]);
	});

	it('together: one message that counts and lists, in the language of the app', () => {
		store('Käse', plus(3));
		store('Fisch', plus(0));
		for (let i = 0; i < 7; i++) store(`Rest ${i}`, plus(3));
		setSettings({ uiLanguage: 'de' });
		const [message, ...more] = buildMessages(dueReminders(me, DAY), 'digest', DAY);
		expect(more).toEqual([]);
		expect(message.title).toBe('Vorrat: 8 laufen bald ab, 1 läuft heute ab');
		expect(message.url).toBe('/');
		expect(message.tag).toBe(`digest-${DAY}`);
		const lines = message.body.split('\n');
		expect(lines[0]).toBe('Fisch – läuft heute ab');
		expect(lines).toHaveLength(7);
		expect(lines.at(-1)).toBe('… und 3 weitere');
	});

	it('the test message looks like a real one; without dated stock it is a plain sentence', () => {
		expect(sampleMessage(me, DAY)).toMatchObject({ title: 'hdpantry', tag: 'test', test: true });
		store('Cheese', plus(5));
		expect(sampleMessage(me, DAY)).toMatchObject({
			title: 'Test · Cheese',
			body: 'expires in 5 days · Fridge',
			tag: 'test',
			test: true
		});
	});
});

describe('sending', () => {
	it('waits for the chosen hour and tells nothing twice', async () => {
		device();
		store('Cheese', plus(3));
		store('Fish', plus(0));
		expect(await notifyUser(me, at(DAY, 8))).toBe(0);
		expect(await notifyUser(me, at(DAY, 9))).toBe(2);
		expect(await notifyUser(me, at(DAY, 10))).toBe(0);
		// the next occasions come on their days: the fish has expired, then the cheese is due
		expect(await notifyUser(me, at(plus(1), 9))).toBe(1);
		expect(await notifyUser(me, at(plus(3), 9))).toBe(1);
		expect(await notifyUser(me, at(plus(3), 20))).toBe(0);
	});

	it('announces a content again when its date was changed', async () => {
		device();
		const fish = store('Fish', plus(0));
		expect(await notifyUser(me, at(DAY))).toBe(1);
		getDb()
			.update(items)
			.set({ bestBefore: plus(1) })
			.where(eq(items.id, fish.id))
			.run();
		expect(await notifyUser(me, at(plus(1)))).toBe(1);
	});

	it('sends one message a day in the summary form', async () => {
		device();
		setSettings({ notifyMode: 'digest' });
		store('Cheese', plus(3));
		store('Fish', plus(0));
		expect(await notifyUser(me, at(DAY))).toBe(1);
		expect(vi.mocked(fetch).mock.calls).toHaveLength(1);
		expect(await notifyUser(me, at(DAY, 15))).toBe(0);
	});

	it('does nothing while reminders are off', async () => {
		device();
		store('Fish', plus(0));
		setSettings({ notifyMode: 'off' });
		expect(await notifyUser(me, at(DAY))).toBe(0);
		expect(vi.mocked(fetch)).not.toHaveBeenCalled();
	});

	it('does not save things up for the day a device is switched on', async () => {
		store('Fish', plus(0));
		expect(await notifyUser(me, at(DAY))).toBe(0);
		device();
		expect(await notifyUser(me, at(DAY, 12))).toBe(0);
		expect(vi.mocked(fetch)).not.toHaveBeenCalled();
	});

	it('leaves out a device that is switched off – with none switched on, nothing is saved up', async () => {
		device();
		const [only] = listDevices(me);
		setDeviceEnabled(me, only.id, false);
		store('Fish', plus(0));
		expect(await notifyUser(me, at(DAY))).toBe(0);
		expect(vi.mocked(fetch)).not.toHaveBeenCalled();
		setDeviceEnabled(me, only.id, true);
		expect(await notifyUser(me, at(DAY, 12))).toBe(0);
	});

	it('reaches a webhook like a device', async () => {
		await saveChannel(me, {
			id: null,
			kind: 'webhook',
			name: 'Hook',
			fields: { url: 'https://hook.example/x', body: '{{title}} – {{message}}' }
		});
		store('Fish', plus(0));
		expect(await notifyUser(me, at(DAY))).toBe(1);
		const [url, init] = vi.mocked(fetch).mock.calls[0];
		expect(String(url)).toBe('https://hook.example/x');
		expect(init!.body).toBe('Fish – expires today · Fridge');
	});

	it('tries again when no device could be reached', async () => {
		device();
		store('Fish', plus(0));
		vi.mocked(fetch).mockImplementation(async () => new Response('later', { status: 503 }));
		expect(await notifyUser(me, at(DAY))).toBe(0);
		vi.mocked(fetch).mockImplementation(async () => new Response(null, { status: 201 }));
		expect(await notifyUser(me, at(DAY, 11))).toBe(1);
	});
});
