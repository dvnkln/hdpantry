import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isKeep } from '$lib/schedule';
import { DATA_DIR, DB_PATH } from './config';
import { getDb } from './db';
import { getSetting, setSettings } from './settings';

// Copies of the whole database (stock, account, settings), made by the task "backup" (see
// scheduler.ts) on a schedule or by hand. Off by default: many people back up the whole
// volume anyway.

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

export function deleteAllBackups() {
	for (const file of listBackups()) deleteBackup(file.name);
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

// ---- How many to keep ----

export function backupKeep() {
	const keep = Number(getSetting('backupKeep'));
	return isKeep(keep) ? keep : 7;
}

export function saveBackupKeep(keep: number) {
	setSettings({ backupKeep: String(keep) });
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
	for (const old of listBackups().slice(backupKeep())) deleteBackup(old.name);
	return name;
}
