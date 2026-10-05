import { describe, expect, it } from 'vitest';
import { evaluate, type Facts } from './overview';

const fine: Facts = {
	https: true,
	connection: { forwarded: '203.0.113.7', via: 'key', hidden: true },
	failedTasks: 0,
	blockedAddresses: 0
};
const levels = (facts: Partial<Facts>) =>
	Object.fromEntries(evaluate({ ...fine, ...facts }).map((check) => [check.key, check.level]));

describe('server overview', () => {
	it('is fine when everything is', () => {
		expect(levels({})).toEqual({ https: 'ok', proxy: 'ok', tasks: 'ok', logins: 'ok' });
	});
	it('only notes a missing HTTPS', () => {
		expect(levels({ https: false }).https).toBe('hint');
	});
	it('asks to confirm a reverse proxy that is not confirmed yet', () => {
		const proxy = (connection: Facts['connection']) => levels({ connection }).proxy;
		expect(proxy({ forwarded: '203.0.113.7', via: null, hidden: false })).toBe('action');
		expect(proxy({ forwarded: '203.0.113.7', via: 'address', hidden: false })).toBe('ok');
		// no proxy at all: fine, unless Docker gives every visitor the same address
		expect(proxy({ forwarded: null, via: null, hidden: false })).toBe('ok');
		expect(proxy({ forwarded: null, via: null, hidden: true })).toBe('hint');
	});
	it('asks for a look when a background task failed', () => {
		expect(levels({ failedTasks: 0 }).tasks).toBe('ok');
		const tasks = evaluate({ ...fine, failedTasks: 1 }).find((c) => c.key === 'tasks');
		expect(tasks).toEqual({ key: 'tasks', level: 'action', count: 1 });
	});
	it('mentions blocked addresses with their number', () => {
		const logins = evaluate({ ...fine, blockedAddresses: 2 }).find((c) => c.key === 'logins');
		expect(logins).toEqual({ key: 'logins', level: 'hint', count: 2 });
	});
});
