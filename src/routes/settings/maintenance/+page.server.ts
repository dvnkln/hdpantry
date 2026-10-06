import { fail } from '@sveltejs/kit';
import { FREQUENCIES, MAX_KEEP, isFrequency, isKeep, isTime, nextSlot } from '$lib/schedule';
import {
	backupKeep,
	databaseSize,
	deleteAllBackups,
	deleteBackup,
	listBackups,
	saveBackupKeep
} from '$lib/server/backups';
import { serverMessages } from '$lib/server/i18n';
import {
	TASKS,
	isRequired,
	isRunning,
	isTaskKey,
	listTasks,
	runTask,
	updateTask,
	type TaskKey
} from '$lib/server/scheduler';
import type { Actions, PageServerLoad } from './$types';

// So long a click on "Run now" waits; a task that takes longer keeps running in the background
const RUN_WAIT_MS = 10_000;

// Only what takes effect counts: hourly tasks have no time, the weekday only matters weekly
type Plan = { frequency: string; time: string; weekday: number };
function sameSchedule(a: Plan, b: Plan) {
	return (
		a.frequency === b.frequency &&
		(a.frequency === 'hourly' || a.time === b.time) &&
		(a.frequency !== 'weekly' || a.weekday === b.weekday)
	);
}

export const load: PageServerLoad = () => {
	const files = listBackups();
	// Disk space of what a task looks after: the database file, all backups
	const used: Partial<Record<TaskKey, number>> = { optimize: databaseSize() };
	if (files.length) used.backup = files.reduce((sum, file) => sum + file.size, 0);
	return {
		tasks: listTasks().map((task) => {
			const key = task.key as TaskKey;
			return {
				key,
				enabled: task.enabled,
				required: isRequired(key),
				usedBytes: used[key] ?? null,
				frequency: task.frequency,
				time: task.time,
				weekday: task.weekday,
				running: isRunning(key),
				lastRunAt: task.lastRunAt?.toISOString() ?? null,
				lastDurationMs: task.lastDurationMs,
				lastFreedBytes: task.lastFreedBytes,
				lastError: task.lastError,
				nextRunAt: task.enabled ? nextSlot(task, new Date()).toISOString() : null,
				// The schedule differs from that of a new installation (then it can be reset)
				customSchedule: !sameSchedule(task, TASKS[key].defaults)
			};
		}),
		frequencies: FREQUENCIES,
		files,
		keep: backupKeep(),
		maxKeep: MAX_KEEP,
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};
};

function readKey(data: FormData) {
	const key = String(data.get('key') ?? '');
	return isTaskKey(key) ? key : null;
}

export const actions: Actions = {
	// Switch and schedule of one task belong together: saved with one button.
	save: async ({ request, locals }) => {
		const t = serverMessages(locals.locale);
		const data = await request.formData();
		const key = readKey(data);
		const frequency = data.get('frequency');
		// Hourly tasks have no time field; a valid value is kept anyway
		const time = String(data.get('time') ?? '00:00');
		const weekday = Number(data.get('weekday') ?? 0);
		const invalid = () => fail(400, { key, error: t.common.invalid });
		if (
			!key ||
			!isFrequency(frequency) ||
			!isTime(time) ||
			!(Number.isInteger(weekday) && weekday >= 0 && weekday <= 6)
		) {
			return invalid();
		}
		if (key === 'backup') {
			const keep = Number(data.get('keep'));
			if (!isKeep(keep)) return invalid();
			saveBackupKeep(keep);
		}
		updateTask(key, { enabled: data.get('enabled') === 'on', frequency, time, weekday });
		return { key, message: t.settings.saved };
	},

	// Back to the schedule of a new installation; whether the task is on stays as it is.
	resetSchedule: async ({ request, locals }) => {
		const t = serverMessages(locals.locale);
		const key = readKey(await request.formData());
		const current = listTasks().find((task) => task.key === key);
		if (!key || !current) return fail(400, { key, error: t.common.invalid });
		const { frequency, time, weekday } = TASKS[key].defaults;
		updateTask(key, { enabled: current.enabled, frequency, time, weekday });
		return { key, message: t.settings.saved };
	},

	run: async ({ request, locals }) => {
		const t = serverMessages(locals.locale);
		const key = readKey(await request.formData());
		if (!key) return fail(400, { key, error: t.common.invalid });
		const slow = Symbol('slow');
		const error = await Promise.race([
			runTask(key),
			new Promise<typeof slow>((resolve) => setTimeout(() => resolve(slow), RUN_WAIT_MS))
		]);
		if (error === slow) return { key, message: t.maintenance.stillRunning };
		if (error) return fail(500, { key, error: `${t.maintenance.failed} ${error}` });
		return { key, message: t.maintenance.done };
	},

	delete: async ({ request }) => {
		deleteBackup(String((await request.formData()).get('name') ?? ''));
		return { key: 'backup' };
	},

	deleteAll: () => {
		deleteAllBackups();
		return { key: 'backup' };
	}
};
