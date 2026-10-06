import type { RequestEvent } from '@sveltejs/kit';
import { count, isNull } from 'drizzle-orm';
import { blockedAddresses, connectionOf } from './auth';
import { databaseSize, listBackups } from './backups';
import { getDb } from './db';
import { items } from './db/schema';
import { isHttps } from './origins';
import { listTasks } from './scheduler';

// The overview on Settings → Server: a few checks that tell whether everything is fine.
// 'ok' = fine, 'hint' = worth knowing, 'action' = something should be done.
export type Level = 'ok' | 'hint' | 'action';
export type CheckKey = 'https' | 'proxy' | 'tasks' | 'logins';
// `count` fills in the text of a check (how many tasks failed, how many addresses are blocked)
export type Check = { key: CheckKey; level: Level; count?: number };

export type Facts = {
	https: boolean;
	connection: { forwarded: string | null; via: 'address' | 'key' | null; hidden: boolean };
	failedTasks: number;
	blockedAddresses: number;
};

// The rules, separate from where the facts come from (so they can be tested).
export function evaluate(facts: Facts): Check[] {
	const { connection: c } = facts;
	const viaProxy = c.forwarded !== null;
	return [
		{ key: 'https', level: facts.https ? 'ok' : 'hint' },
		{
			key: 'proxy',
			// Unconfirmed proxy: can be fixed. Direct visitors sharing one address: just a note.
			level: viaProxy ? (c.via ? 'ok' : 'action') : c.hidden ? 'hint' : 'ok'
		},
		// Background tasks that are switched off are fine: that is a choice
		{ key: 'tasks', level: facts.failedTasks ? 'action' : 'ok', count: facts.failedTasks },
		{
			key: 'logins',
			level: facts.blockedAddresses ? 'hint' : 'ok',
			count: facts.blockedAddresses
		}
	];
}

export function serverOverview(event: RequestEvent) {
	const [filled] = getDb().select({ n: count() }).from(items).where(isNull(items.removedAt)).all();
	return {
		checks: evaluate({
			https: isHttps(event.request, event.url),
			connection: connectionOf(event),
			// Tasks under Settings → Maintenance whose last run went wrong
			failedTasks: listTasks().filter((task) => task.enabled && task.lastError).length,
			blockedAddresses: blockedAddresses()
		}),
		info: {
			startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
			items: filled.n,
			bytes: databaseSize() + listBackups().reduce((sum, file) => sum + file.size, 0)
		}
	};
}
