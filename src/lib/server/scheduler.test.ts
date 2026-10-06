import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';
import { listBackups } from './backups';
import { getDb } from './db';
import { tasks } from './db/schema';
import { evaluate } from './overview';
import { TASKS, isDue, isRequired, listTasks, runTask, updateTask } from './scheduler';

const task = (key: string) => listTasks().find((row) => row.key === key)!;
const at = (text: string) => new Date(text);

describe('background tasks', () => {
	it('exist with their defaults: reminders always on, backup off and last', () => {
		expect(listTasks().map((row) => row.key)).toEqual([
			'notifications',
			'optimize',
			'sessions',
			'backup'
		]);
		expect(task('notifications')).toMatchObject({ enabled: true, frequency: 'hourly' });
		expect(task('backup')).toMatchObject({ enabled: false, frequency: 'daily', time: '03:00' });
		expect(isRequired('notifications')).toBe(true);
		expect(isRequired('backup')).toBe(false);
	});

	it('the reminders cannot be switched off', () => {
		updateTask('notifications', { ...TASKS.notifications.defaults, enabled: false });
		expect(task('notifications').enabled).toBe(true);
	});

	it('are due at the next planned time after a change, not for earlier ones', () => {
		updateTask('backup', { ...TASKS.backup.defaults, enabled: true }, at('2031-03-12T10:00'));
		expect(isDue(task('backup'), at('2031-03-12T10:01'))).toBe(false);
		expect(isDue(task('backup'), at('2031-03-13T03:00'))).toBe(true);
		// several missed times are one run
		expect(isDue(task('backup'), at('2031-03-20T12:00'))).toBe(true);
		updateTask('backup', { ...TASKS.backup.defaults, enabled: false }, at('2031-03-12T10:00'));
		expect(isDue(task('backup'), at('2031-03-13T03:00'))).toBe(false);
		// switched-off tasks stand below the others
		expect(listTasks().at(-1)!.key).toBe('backup');
	});

	it('note how a run went', async () => {
		expect(task('optimize').lastRunAt).toBeNull();
		expect(await runTask('optimize')).toBeNull();
		expect(task('optimize')).toMatchObject({ lastError: null });
		expect(task('optimize').lastRunAt).not.toBeNull();
		expect(task('optimize').lastDurationMs).not.toBeNull();
		expect(task('optimize').lastFreedBytes).not.toBeNull();

		expect(await runTask('backup')).toBeNull();
		expect(listBackups()).toHaveLength(1);
		expect(await runTask('sessions')).toBeNull();
		expect(await runTask('notifications')).toBeNull();
	});

	it('a failed run is kept, shown in the overview, and cleared by the next good one', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const run = vi.spyOn(TASKS.sessions, 'run').mockImplementation(() => {
			throw new Error('disk is full');
		});
		expect(await runTask('sessions')).toBe('disk is full');
		expect(task('sessions').lastError).toBe('disk is full');
		const failed = () => listTasks().filter((row) => row.enabled && row.lastError).length;
		expect(failed()).toBe(1);
		const facts = {
			https: true,
			connection: { forwarded: null, via: null, hidden: false },
			blockedAddresses: 0
		};
		expect(evaluate({ ...facts, failedTasks: failed() })).toContainEqual({
			key: 'tasks',
			level: 'action',
			count: 1
		});
		// A task that is switched off is no point in the overview
		getDb().update(tasks).set({ lastError: 'old' }).where(eq(tasks.key, 'backup')).run();
		expect(failed()).toBe(1);
		run.mockRestore();
		expect(await runTask('sessions')).toBeNull();
		expect(failed()).toBe(0);
	});
});
