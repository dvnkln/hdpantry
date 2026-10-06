import { eq } from 'drizzle-orm';
import { latestSlot, type Frequency } from '$lib/schedule';
import { deleteExpiredSessions } from './auth';
import { createBackup, databaseSize } from './backups';
import { getDb } from './db';
import { tasks } from './db/schema';
import { sendDueNotifications } from './notifications';

// What runs by itself in the background (there is no cron in the image). Every task has a
// schedule and notes how its last run went – shown under Settings → Maintenance, and a failed
// one is a point in the overview under Settings → Server.

export type TaskRow = typeof tasks.$inferSelect;
type Plan = { enabled: boolean; frequency: Frequency; time: string; weekday: number };

type TaskDef = {
	// Clean-up tasks return how many bytes of disk space they freed
	run: () => void | number | Promise<void | number>;
	// Cannot be switched off
	required?: boolean;
	defaults: Plan;
};

// All tasks in the order they are shown; the backup (off by default) last.
export const TASKS = {
	notifications: {
		// Reminders about what expires. Always on: whether anything is sent is decided under
		// Settings → Notifications – with reminders off, a run reads a few settings and is done.
		run: sendDueNotifications,
		required: true,
		defaults: { enabled: true, frequency: 'hourly', time: '00:00', weekday: 0 }
	},
	optimize: {
		// Updates the statistics the database plans its queries with and compacts the file
		run: () => {
			const before = databaseSize();
			const client = getDb().$client;
			client.pragma('optimize');
			client.exec('VACUUM');
			client.pragma('wal_checkpoint(TRUNCATE)');
			return Math.max(before - databaseSize(), 0);
		},
		defaults: { enabled: true, frequency: 'weekly', time: '04:00', weekday: 0 }
	},
	sessions: {
		run: () => void deleteExpiredSessions(),
		defaults: { enabled: true, frequency: 'daily', time: '03:30', weekday: 0 }
	},
	backup: {
		run: async () => void (await createBackup()),
		defaults: { enabled: false, frequency: 'daily', time: '03:00', weekday: 0 }
	}
} satisfies Record<string, TaskDef>;

export type TaskKey = keyof typeof TASKS;
export const TASK_KEYS = Object.keys(TASKS) as TaskKey[];

export function isTaskKey(value: string): value is TaskKey {
	return Object.hasOwn(TASKS, value);
}

export function isRequired(key: TaskKey) {
	return (TASKS[key] as TaskDef).required === true;
}

// ---- Rows in the database ----

// Creates missing rows with their default values (new installation or new task)
function ensureRows() {
	const db = getDb();
	for (const key of TASK_KEYS) {
		db.insert(tasks)
			.values({ key, ...TASKS[key].defaults, changedAt: new Date() })
			.onConflictDoNothing()
			.run();
	}
}

// All tasks: the ones switched on first, the others below (each group in the order of TASKS)
export function listTasks(): TaskRow[] {
	ensureRows();
	const rows = getDb().select().from(tasks).all();
	const ordered = TASK_KEYS.map((key) => rows.find((row) => row.key === key)).filter(
		(row) => row !== undefined
	);
	return [...ordered.filter((task) => task.enabled), ...ordered.filter((task) => !task.enabled)];
}

// Changing the schedule (or switching on) starts the count anew: planned times before that
// moment are not caught up.
export function updateTask(key: TaskKey, plan: Plan, now = new Date()) {
	ensureRows();
	getDb()
		.update(tasks)
		.set({ ...plan, enabled: plan.enabled || isRequired(key), changedAt: now })
		.where(eq(tasks.key, key))
		.run();
	loadRows();
}

// Due once a planned time has passed since the last run or the last change of the schedule,
// whichever is later. Several missed times still lead to one run only.
export function isDue(task: TaskRow, now: Date) {
	if (!task.enabled && !isRequired(task.key as TaskKey)) return false;
	const since = Math.max(task.lastRunAt?.getTime() ?? 0, task.changedAt.getTime());
	return latestSlot(task, now).getTime() > since;
}

// ---- Running ----

const running = new Set<TaskKey>();

export function isRunning(key: TaskKey) {
	return running.has(key);
}

// Runs a task now and notes how it went. Returns the error message, or null if it worked.
export async function runTask(key: TaskKey): Promise<string | null> {
	if (running.has(key)) return null;
	running.add(key);
	const started = new Date();
	let error: string | null = null;
	let freed: number | null = null;
	try {
		freed = (await TASKS[key].run()) ?? null;
	} catch (err) {
		console.error(`Task ${key} failed`, err);
		error = err instanceof Error ? err.message : String(err);
	} finally {
		running.delete(key);
	}
	try {
		ensureRows();
		getDb()
			.update(tasks)
			.set({
				lastRunAt: started,
				lastDurationMs: Date.now() - started.getTime(),
				lastFreedBytes: freed,
				lastError: error
			})
			.where(eq(tasks.key, key))
			.run();
		loadRows();
	} catch (err) {
		// The database cannot be written (e.g. wrong owner of the file): nothing can be noted
		console.error(`Result of task ${key} could not be stored`, err);
		error ??= err instanceof Error ? err.message : String(err);
	}
	return error;
}

// ---- Scheduler ----

// Copy of the rows in memory, so the look every minute does not read the database
let rows: TaskRow[] = [];
function loadRows() {
	rows = listTasks();
}

async function tick() {
	const now = new Date();
	for (const task of rows) {
		if (isDue(task, now)) await runTask(task.key as TaskKey);
	}
}

// Called once at server start: looks every minute whether a task is due. What was missed
// while the server was off runs shortly after the start.
export function startScheduler() {
	// During development the server code can be reloaded; never start a second timer
	const g = globalThis as { hdpantryScheduler?: boolean };
	if (g.hdpantryScheduler) return;
	g.hdpantryScheduler = true;
	loadRows();
	const safeTick = () => tick().catch((err) => console.error('Scheduler failed', err));
	setTimeout(safeTick, 30_000).unref();
	setInterval(safeTick, 60_000).unref();
}
