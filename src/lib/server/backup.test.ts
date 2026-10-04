import { describe, expect, it } from 'vitest';
import { BACKUP_FORMAT, backupCounts, backupFileName, parseBackup, type Backup } from '$lib/backup';
import { exportBackup, importBackup, stockCounts } from './backup';
import { addScanned, openTyped } from './containers';
import { getDb } from './db';
import { users } from './db/schema';
import { learnFood } from './food';
import { addItem, listStock, removeActiveItem } from './items';
import { getSetting, setSettings } from './settings';

const cheese = {
	name: 'Provolone',
	note: 'from the market',
	vacuumed: true,
	location: 'fridge',
	bestBefore: '2031-03-01',
	dateManual: true,
	category: 'cheese_hard',
	icon: 'cheese-wedge',
	fill: 'medium',
	amount: 250,
	unit: 'g'
} as const;
const soup = { ...cheese, name: 'Lentil soup', note: null, category: 'other', icon: null } as const;

// An export as text, optionally changed first – the way a damaged file would arrive
function fileWith(change: (data: Backup) => void = () => {}) {
	const data = structuredClone(exportBackup());
	change(data);
	return JSON.stringify(data);
}
function problemOf(content: string) {
	const result = parseBackup(content);
	return result.ok ? null : result.problem;
}

describe('export and import', () => {
	it('brings back the same stock, history and learned corrections', () => {
		const bag = addScanned('x://y?cc=AB12&s=s&tc=T1', 'camera')!;
		addItem(bag.id, soup);
		removeActiveItem(bag.id);
		addItem(bag.id, cheese);
		const jar = openTyped('JAR7')!;
		addItem(jar.id, soup);
		addScanned('EMPTY1', 'photo');
		learnFood('Provolone', 'cheese_hard', 'cheese-wedge');

		const before = exportBackup();
		expect(backupCounts(before)).toEqual({ containers: 3, filled: 2, history: 1, memory: 1 });
		const parsed = parseBackup(JSON.stringify(before));
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;

		// Something else is in the app by now: it has to be gone afterwards
		addScanned('LATER', 'camera');
		learnFood('Tofu', 'cheese_hard', null);
		importBackup(parsed.backup);

		const after = exportBackup(new Date(before.exportedAt));
		expect(after).toEqual(before);
		expect(stockCounts()).toEqual(backupCounts(before));
		expect(
			listStock()
				.map((item) => item.name)
				.sort()
		).toEqual(['Lentil soup', 'Provolone']);
	});

	it('leaves account and settings alone', () => {
		getDb().insert(users).values({ username: 'demo', passwordHash: 'scrypt$00$00' }).run();
		setSettings({ soonDays: '7' });
		const file = JSON.stringify(exportBackup());
		expect(file).not.toContain('demo');
		expect(file).not.toContain('scrypt');
		expect(file).not.toContain('soonDays');
		const parsed = parseBackup(file);
		if (parsed.ok) importBackup(parsed.backup);
		expect(getDb().select().from(users).all()).toHaveLength(1);
		expect(getSetting('soonDays')).toBe('7');
	});

	it('keeps everything when the import fails half way', () => {
		const before = exportBackup();
		const broken = structuredClone(before);
		// Passes no check: the same container twice – the database refuses the second one
		broken.containers.push(broken.containers[0]);
		expect(() => importBackup(broken)).toThrow();
		expect(exportBackup(new Date(before.exportedAt))).toEqual(before);
	});
});

describe('reading an export file', () => {
	it('refuses what is not an export of this app', () => {
		expect(problemOf('not json')).toEqual({ kind: 'notBackup' });
		expect(problemOf('[]')).toEqual({ kind: 'notBackup' });
		expect(problemOf('{"containers":[]}')).toEqual({ kind: 'notBackup' });
		expect(problemOf(fileWith((d) => ((d as { app: string }).app = 'other')))).toEqual({
			kind: 'notBackup'
		});
	});
	it('refuses a file from a newer version', () => {
		expect(problemOf(fileWith((d) => (d.format = BACKUP_FORMAT + 1)))).toEqual({ kind: 'newer' });
	});
	it('names the place that is damaged', () => {
		const where = (change: (data: Backup) => void) => {
			const problem = problemOf(fileWith(change));
			return problem?.kind === 'invalid' ? problem.where : problem;
		};
		expect(where((d) => (d.containers[0].code = ''))).toBe('containers[0].code');
		expect(
			where((d) => ((d.containers[0].items[0] as { location: string }).location = 'attic'))
		).toBe('containers[0].items[0].location');
		expect(where((d) => (d.containers[0].items[1].bestBefore = '2031-02-30'))).toBe(
			'containers[0].items[1].bestBefore'
		);
		expect(where((d) => (d.containers[0].items[1].unit = null))).toBe(
			'containers[0].items[1].amount'
		);
		expect(where((d) => (d.containers[0].items[1].name = 'x'.repeat(81)))).toBe(
			'containers[0].items[1].name'
		);
		expect(where((d) => (d.containers[0].createdAt = 'yesterday'))).toBe('containers[0].createdAt');
		// two things in one container at the same time
		expect(where((d) => (d.containers[0].items[0].removedAt = null))).toBe('containers[0].items');
		// the same scanned code twice
		expect(where((d) => d.containers.push({ ...d.containers[0] }))).toBe('containers[3].code');
		expect(where((d) => ((d as { containers: unknown }).containers = {}))).toBe('containers');
	});
	it('drops a symbol it does not know instead of refusing the file', () => {
		const result = parseBackup(fileWith((d) => (d.containers[0].items[1].icon = 'unicorn')));
		expect(result.ok && result.backup.containers[0].items[1].icon).toBeNull();
	});
	it('accepts an empty stock', () => {
		const result = parseBackup(fileWith((d) => ((d.containers = []), (d.foodMemory = []))));
		expect(result.ok && backupCounts(result.backup)).toEqual({
			containers: 0,
			filled: 0,
			history: 0,
			memory: 0
		});
	});
	it('names the file after the day', () => {
		expect(backupFileName('2031-01-31')).toBe('hdpantry-2031-01-31.json');
	});
});
