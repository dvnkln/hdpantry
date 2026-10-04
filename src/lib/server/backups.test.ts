import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import {
	BACKUP_DIR,
	backupDue,
	backupSettings,
	backupState,
	createBackup,
	deleteBackup,
	isBackupName,
	listBackups,
	nextBackup,
	runBackup,
	saveBackupSettings
} from './backups';
import { addScanned } from './containers';

describe('automatic backup', () => {
	it('is off until switched on', () => {
		expect(backupSettings()).toEqual({
			enabled: false,
			schedule: { frequency: 'daily', time: '03:00', weekday: 1 },
			keep: 7
		});
		expect(backupDue(new Date('2031-03-12T10:00'))).toBe(false);
		expect(nextBackup()).toBeNull();
		expect(backupState().lastRun).toBeNull();
	});

	it('is due at the next planned time after switching on, not for earlier ones', () => {
		saveBackupSettings({ enabled: true }, new Date('2031-03-12T10:00'));
		expect(backupDue(new Date('2031-03-12T10:01'))).toBe(false);
		expect(backupDue(new Date('2031-03-13T03:00'))).toBe(true);
		expect(nextBackup(new Date('2031-03-12T10:01'))).toBe(
			new Date('2031-03-13T03:00').toISOString()
		);
		saveBackupSettings({ enabled: false });
		expect(backupDue(new Date('2031-03-13T03:00'))).toBe(false);
	});
});

describe('backup files', () => {
	it('writes a complete copy of the database', async () => {
		addScanned('BACKUP1', 'camera');
		const name = await createBackup(new Date('2031-03-12T03:00:00'));
		expect(name).toBe('hdpantry-2031-03-12_030000.db');
		const copy = new Database(join(BACKUP_DIR, name), { readonly: true });
		expect(copy.prepare('select code from containers').all()).toEqual([{ code: 'BACKUP1' }]);
		copy.close();
		expect(listBackups().map((file) => file.name)).toEqual([name]);
	});

	it('keeps only the newest ones', async () => {
		saveBackupSettings({ keep: 3 });
		for (let day = 13; day <= 17; day++) await createBackup(new Date(`2031-03-${day}T03:00:00`));
		expect(listBackups().map((file) => file.name)).toEqual([
			'hdpantry-2031-03-17_030000.db',
			'hdpantry-2031-03-16_030000.db',
			'hdpantry-2031-03-15_030000.db'
		]);
	});

	it('notes how the last run went', async () => {
		expect(await runBackup()).toBeNull();
		const state = backupState();
		expect(state.lastRun).not.toBeNull();
		expect(state.lastError).toBeNull();
	});

	it('only ever touches its own files', () => {
		expect(isBackupName('hdpantry-2031-03-12_030000.db')).toBe(true);
		for (const name of [
			'hdpantry.db',
			'../hdpantry.db',
			'hdpantry-2031-03-12_030000.db/..',
			'x.db'
		]) {
			expect(isBackupName(name)).toBe(false);
		}
		const other = join(BACKUP_DIR, 'notes.txt');
		writeFileSync(other, 'mine');
		deleteBackup('notes.txt');
		deleteBackup('../hdpantry.db');
		expect(existsSync(other)).toBe(true);
		expect(listBackups().some((file) => file.name === 'notes.txt')).toBe(false);
		const [newest] = listBackups();
		deleteBackup(newest.name);
		expect(listBackups().some((file) => file.name === newest.name)).toBe(false);
	});
});
