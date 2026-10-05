import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
	DEFAULT_SCHEDULE,
	KEEP_CHOICES,
	isDue,
	isFrequency,
	isTime,
	nextSlot,
	type Schedule
} from '$lib/schedule';
import { DATA_DIR, DB_PATH } from './config';
import { getDb } from './db';
import { getSetting, setSettings } from './settings';

// Copies of the whole database (stock, account, settings), made on a schedule or by hand.
// Off by default: many people back up the whole volume anyway.

export const BACKUP_DIR = resolve(DATA_DIR, 'backups');

// Only files written by the app, e.g. "hdpantry-2031-01-31_030000.db"
const NAME_PATTERN = /^hdpantry-\d{4}-\d{2}-\d{2}_\d{6}\.db$/;

export function isBackupName(name: string) {
	return NAME_PATTERN.test(name);
}

export type BackupFile = { name: string; size: number; createdAt: string };

// All backups, newest first
export function listBackups(): BackupFile[] {
	let names: string[];
	try {
		names = readdirSync(BACKUP_DIR);
	} catch {
		return []; // the folder does not exist yet
	}
	return names
		.filter(isBackupName)
		.map((name) => {
			const stat = statSync(join(BACKUP_DIR, name));
			return { name, size: stat.size, createdAt: stat.mtime.toISOString() };
		})
		.sort((a, b) => b.name.localeCompare(a.name));
}

export function deleteBackup(name: string) {
	if (!isBackupName(name)) return;
	try {
		unlinkSync(join(BACKUP_DIR, name));
	} catch {
		// already gone
	}
}

// Size of the database on disk, including changes not yet written into the main file
export function databaseSize() {
	return [DB_PATH, `${DB_PATH}-wal`].reduce(
		(sum, file) => sum + (existsSync(file) ? statSync(file).size : 0),
		0
	);
}

// ---- Settings ----

export function backupSettings() {
	const frequency = getSetting('backupFrequency');
	const time = getSetting('backupTime');
	const weekday = Number(getSetting('backupWeekday'));
	const keep = Number(getSetting('backupKeep'));
	const schedule: Schedule = {
		frequency: isFrequency(frequency) ? frequency : DEFAULT_SCHEDULE.frequency,
		time: isTime(time) ? time : DEFAULT_SCHEDULE.time,
		weekday: Number.isInteger(weekday) && weekday >= 0 && weekday <= 6 ? weekday : 1
	};
	return {
		enabled: getSetting('backupEnabled') === 'on',
		schedule,
		keep: (KEEP_CHOICES as readonly number[]).includes(keep) ? keep : 7
	};
}

// Switching on or changing the schedule starts the count anew: planned times before that
// moment are not caught up.
export function saveBackupSettings(
	values: Partial<{ enabled: boolean; keep: number } & Schedule>,
	now = new Date()
) {
	setSettings({
		...(values.enabled !== undefined && { backupEnabled: values.enabled ? 'on' : 'off' }),
		...(values.frequency && { backupFrequency: values.frequency }),
		...(values.time && { backupTime: values.time }),
		...(values.weekday !== undefined && { backupWeekday: String(values.weekday) }),
		...(values.keep !== undefined && { backupKeep: String(values.keep) }),
		backupChangedAt: String(now.getTime())
	});
}

// How the last run went; lastRun null = never
export function backupState() {
	const lastRun = Number(getSetting('backupLastRun'));
	return {
		lastRun: lastRun ? new Date(lastRun).toISOString() : null,
		lastMs: Number(getSetting('backupLastMs')) || 0,
		lastError: getSetting('backupLastError') || null
	};
}

// The next planned run, or null while backups are off
export function nextBackup(now = new Date()) {
	const { enabled, schedule } = backupSettings();
	return enabled ? nextSlot(schedule, now).toISOString() : null;
}

// ---- Running ----

// Copies the database into the backup folder, then deletes the oldest copies beyond the
// number to keep. The copy is complete even while the app keeps running.
export async function createBackup(now = new Date()) {
	mkdirSync(BACKUP_DIR, { recursive: true });
	// Local time: "2031-01-31 03:00:00" -> "2031-01-31_030000"
	const stamp = now.toLocaleString('sv-SE').replace(' ', '_').replaceAll(':', '');
	const name = `hdpantry-${stamp}.db`;
	await getDb().$client.backup(join(BACKUP_DIR, name));
	for (const old of listBackups().slice(backupSettings().keep)) deleteBackup(old.name);
	return name;
}

let running = false;

// Makes a backup now and notes how it went. Returns the error message, or null if it worked.
export async function runBackup(): Promise<string | null> {
	if (running) return null;
	running = true;
	const started = Date.now();
	let error: string | null = null;
	try {
		await createBackup();
	} catch (err) {
		console.error('Backup failed', err);
		error = err instanceof Error ? err.message : String(err);
	} finally {
		running = false;
	}
	setSettings({
		backupLastRun: String(started),
		backupLastMs: String(Date.now() - started),
		backupLastError: error ?? ''
	});
	return error;
}

// True if a planned backup is waiting to be made
export function backupDue(now = new Date()) {
	const { enabled, schedule } = backupSettings();
	if (!enabled) return false;
	const since = Math.max(
		Number(getSetting('backupLastRun')) || 0,
		Number(getSetting('backupChangedAt')) || 0
	);
	return isDue(schedule, new Date(since), now);
}
