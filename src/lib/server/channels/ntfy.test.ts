import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listChannels, publicChannel, saveChannel, type Outgoing } from '../channels';
import { getDb } from '../db';
import { notificationChannels, users } from '../db/schema';
import { deliver } from '../targets';
import { cleanServer, isNtfyTopic, sendNtfy, type NtfyConfig } from './ntfy';

const config = (extra: Partial<NtfyConfig> = {}): NtfyConfig => ({
	server: 'https://ntfy.example',
	topic: 'pantry',
	token: '',
	icon: '',
	...extra
});
const outgoing = (extra: Partial<Outgoing> = {}): Outgoing => ({
	title: 'Käse – „Provolone“',
	body: 'läuft heute ab\n„Kühlschrank“',
	link: 'https://pantry.example/containers/1',
	linkTitle: 'Open in hdpantry',
	count: 1,
	test: false,
	icon: 'https://pantry.example/icons/notify.png',
	...extra
});
// What ntfy was sent, one entry per request
const sent = () =>
	vi.mocked(fetch).mock.calls.map(([url, init]) => ({
		url: String(url),
		init: init!,
		headers: init!.headers as Record<string, string>
	}));
const answer = (...answers: [number, string?][]) => {
	const queue = [...answers];
	vi.mocked(fetch).mockReset();
	vi.mocked(fetch).mockImplementation(async () => {
		const [status, body = '{}'] = queue.shift() ?? [200];
		return new Response(body, { status });
	});
};
// A header as ntfy reads it
const decoded = (header: string) =>
	Buffer.from(/^=\?UTF-8\?B\?(.*)\?=$/.exec(header)![1], 'base64').toString('utf8');

beforeEach(() => answer([200]));

describe('ntfy: what may be entered', () => {
	it('takes topics as ntfy names them', () => {
		expect(isNtfyTopic('hdpantry_Couch-2')).toBe(true);
		expect(isNtfyTopic('')).toBe(false);
		expect(isNtfyTopic('two words')).toBe(false);
		expect(isNtfyTopic('a/b')).toBe(false);
		expect(isNtfyTopic('x'.repeat(65))).toBe(false);
	});
	it('takes a server address without the slash at the end, and nothing else', () => {
		expect(cleanServer(' https://ntfy.sh/ ')).toBe('https://ntfy.sh');
		expect(cleanServer('http://192.168.1.5:8080')).toBe('http://192.168.1.5:8080');
		expect(cleanServer('ntfy.sh')).toBeNull();
		expect(cleanServer('ftp://ntfy.sh')).toBeNull();
		expect(cleanServer('https://ntfy.sh/?a=b')).toBeNull();
	});
});

describe('ntfy: sending', () => {
	it('publishes to the topic: text as content, title, link and icon as headers', async () => {
		expect(await sendNtfy(config(), outgoing())).toMatchObject({ ok: true });
		const [{ url, init, headers }] = sent();
		expect(url).toBe('https://ntfy.example/pantry');
		expect(init.method).toBe('PUT');
		expect(init.redirect).toBe('manual');
		expect(init.body).toBe('läuft heute ab\n„Kühlschrank“');
		// Umlauts and dashes cannot travel in a header as they are
		expect(decoded(headers.Title)).toBe('Käse – „Provolone“');
		expect(headers.Click).toBe('https://pantry.example/containers/1');
		expect(headers.Icon).toBe('https://pantry.example/icons/notify.png');
		expect(headers.Authorization).toBeUndefined();
	});
	it('sends the access token and an icon address of one’s own if there are any', async () => {
		await sendNtfy(config({ token: 'tk_abc', icon: 'https://cdn.example/i.png' }), outgoing());
		const [{ headers }] = sent();
		expect(headers.Authorization).toBe('Bearer tk_abc');
		expect(headers.Icon).toBe('https://cdn.example/i.png');
	});
	it('leaves out link and icon it does not know', async () => {
		await sendNtfy(config(), outgoing({ link: null, icon: null }));
		const [{ headers }] = sent();
		expect(headers.Click).toBeUndefined();
		expect(headers.Icon).toBeUndefined();
	});
	it('reports the status if the answer is not from ntfy, and "unreachable"', async () => {
		answer([502, '<html>Bad Gateway</html>']);
		expect(await sendNtfy(config(), outgoing())).toMatchObject({ ok: false, error: 'HTTP 502' });
		vi.mocked(fetch).mockRejectedValue(new Error('down'));
		expect(await sendNtfy(config(), outgoing())).toEqual({ ok: false, error: 'unreachable' });
	});
});

describe('ntfy as a target', () => {
	let me: number;
	const fields = (extra: Record<string, string> = {}) => ({
		server: 'https://ntfy.example/',
		topic: 'pantry',
		token: '',
		icon: '',
		...extra
	});
	const save = (extra: Record<string, string> = {}, id: number | null = null) =>
		saveChannel(me, { id, kind: 'ntfy', name: 'ntfy', fields: fields(extra) });
	beforeEach(() => {
		const db = getDb();
		db.delete(notificationChannels).run();
		db.delete(users).run();
		me = db.insert(users).values({ username: 'me', passwordHash: 'x' }).returning().get().id;
	});

	it('is saved without asking ntfy, and refuses what cannot work', async () => {
		expect(await save()).toMatchObject({ ok: true });
		expect(fetch).not.toHaveBeenCalled();
		expect(listChannels(me)[0].config).toEqual({
			server: 'https://ntfy.example',
			topic: 'pantry',
			token: '',
			icon: ''
		});
		expect(await save({ server: 'ntfy.example' })).toEqual({ ok: false, error: 'url' });
		expect(await save({ topic: 'my topic' })).toEqual({ ok: false, error: 'topic' });
		expect(await save({ token: 'tk abc' })).toEqual({ ok: false, error: 'ntfyToken' });
		expect(await save({ icon: 'icon.png' })).toEqual({ ok: false, error: 'icon' });
	});
	it('never shows the token again, keeps it when left empty, and can remove it', async () => {
		const made = await save({ token: 'tk_secret' });
		const id = made.ok ? made.id : 0;
		const shown = publicChannel(listChannels(me)[0]);
		expect(JSON.stringify(shown)).not.toContain('tk_secret');
		expect(shown.fields).toMatchObject({ hasToken: true, topic: 'pantry' });

		await save({ topic: 'sofa' }, id);
		expect(listChannels(me)[0].config).toMatchObject({ topic: 'sofa', token: 'tk_secret' });
		await save({ clearToken: '1' }, id);
		expect(listChannels(me)[0].config).toMatchObject({ token: '' });
		expect(publicChannel(listChannels(me)[0]).fields.hasToken).toBe(false);
	});
	it('gets the messages of the user and remembers how it went', async () => {
		await save();
		const notice = { title: 'Movie', body: 'In cinemas', url: '/movies/1', source: null, count: 1 };
		expect(await deliver(me, notice)).toMatchObject([{ name: 'ntfy', ok: true }]);
		expect(sent()[0].url).toBe('https://ntfy.example/pantry');
		expect(listChannels(me)[0].lastOkAt).toBeInstanceOf(Date);

		answer([403, '{"error":"forbidden"}']);
		expect(await deliver(me, notice)).toMatchObject([{ ok: false }]);
		expect(listChannels(me)[0].lastError).toBe('HTTP 403 – forbidden');
	});
});
