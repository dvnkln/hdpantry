// The export file: containers with what is and was inside, plus the corrections the app
// learned (name → kind of food). No account, no logins, no settings. Read and checked here
// for browser (preview before importing) and server (the check that counts) alike.
import { CODE_SOURCES, type CodeSource } from './containers';
import { isCategory, type Category } from './food/categories';
import { isIcon } from './food/icons';
import {
	FILL_LEVELS,
	LOCATIONS,
	MAX_AMOUNT,
	MAX_ICON_NAME,
	MAX_ITEM_NAME,
	MAX_ITEM_NOTE,
	UNITS,
	isDate,
	type FillLevel,
	type Location,
	type Unit
} from './items';

export const BACKUP_APP = 'hdpantry';
// Raised whenever the file changes shape; older files must stay readable
export const BACKUP_FORMAT = 1;
// Larger files are refused (start.js allows uploads a bit above this)
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const MAX_TEXT = 2000;

export type BackupItem = {
	name: string;
	note: string | null;
	vacuumed: boolean;
	location: Location;
	bestBefore: string | null;
	dateManual: boolean;
	category: Category | null;
	icon: string | null;
	fill: FillLevel;
	amount: number | null;
	unit: Unit | null;
	// Points in time as ISO text; removedAt null = still in the container
	createdAt: string;
	removedAt: string | null;
};

export type BackupContainer = {
	code: string;
	size: string | null;
	typeCode: string | null;
	rawContent: string;
	source: CodeSource | null;
	manual: boolean;
	createdAt: string;
	items: BackupItem[];
};

export type BackupMemory = { name: string; category: Category; icon: string | null };

export type Backup = {
	app: typeof BACKUP_APP;
	format: number;
	exportedAt: string;
	containers: BackupContainer[];
	foodMemory: BackupMemory[];
};

// notBackup: not an export of this app · newer: written by a newer version · invalid: damaged
// (`where` names the place in the file)
export type BackupProblem =
	| { kind: 'tooLarge' }
	| { kind: 'notBackup' }
	| { kind: 'newer' }
	| { kind: 'invalid'; where: string };
export type BackupResult = { ok: true; backup: Backup } | { ok: false; problem: BackupProblem };

// Thrown inside the checks below with the place that is wrong
class Invalid extends Error {}
function bad(where: string): never {
	throw new Invalid(where);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function text(value: unknown, where: string, max = MAX_TEXT) {
	if (typeof value !== 'string' || !value.trim() || value.length > max) bad(where);
	return value as string;
}
function optionalText(value: unknown, where: string, max = MAX_TEXT) {
	return value === null || value === undefined ? null : text(value, where, max);
}
function flag(value: unknown, where: string) {
	if (typeof value !== 'boolean') bad(where);
	return value as boolean;
}
function oneOf<T extends string>(value: unknown, list: readonly T[], where: string) {
	if (!(list as readonly unknown[]).includes(value)) bad(where);
	return value as T;
}
function moment(value: unknown, where: string) {
	if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) bad(where);
	return new Date(value as string).toISOString();
}

function readItem(value: unknown, where: string): BackupItem {
	if (!isRecord(value)) bad(where);
	const bestBefore = optionalText(value.bestBefore, `${where}.bestBefore`);
	if (bestBefore !== null && !isDate(bestBefore)) bad(`${where}.bestBefore`);
	const category = value.category ?? null;
	if (category !== null && !isCategory(category)) bad(`${where}.category`);
	// A symbol this version does not know is dropped, not refused
	const icon = optionalText(value.icon, `${where}.icon`, MAX_ICON_NAME);
	const amount = value.amount ?? null;
	const unit = value.unit ?? null;
	if ((amount === null) !== (unit === null)) bad(`${where}.amount`);
	if (amount !== null && !(typeof amount === 'number' && amount > 0 && amount <= MAX_AMOUNT)) {
		bad(`${where}.amount`);
	}
	return {
		name: text(value.name, `${where}.name`, MAX_ITEM_NAME),
		note: optionalText(value.note, `${where}.note`, MAX_ITEM_NOTE),
		vacuumed: flag(value.vacuumed, `${where}.vacuumed`),
		location: oneOf(value.location, LOCATIONS, `${where}.location`),
		bestBefore,
		dateManual: flag(value.dateManual, `${where}.dateManual`),
		category: category as Category | null,
		icon: isIcon(icon) ? icon : null,
		fill: oneOf(value.fill, FILL_LEVELS, `${where}.fill`),
		amount: amount as number | null,
		unit: unit === null ? null : oneOf(unit, UNITS, `${where}.unit`),
		createdAt: moment(value.createdAt, `${where}.createdAt`),
		removedAt:
			value.removedAt === null || value.removedAt === undefined
				? null
				: moment(value.removedAt, `${where}.removedAt`)
	};
}

function readContainer(value: unknown, where: string): BackupContainer {
	if (!isRecord(value)) bad(where);
	if (!Array.isArray(value.items)) bad(`${where}.items`);
	const items = (value.items as unknown[]).map((item, i) => readItem(item, `${where}.items[${i}]`));
	// A container holds one thing at a time
	if (items.filter((item) => item.removedAt === null).length > 1) bad(`${where}.items`);
	return {
		code: text(value.code, `${where}.code`),
		size: optionalText(value.size, `${where}.size`),
		typeCode: optionalText(value.typeCode, `${where}.typeCode`),
		rawContent: text(value.rawContent, `${where}.rawContent`),
		source:
			value.source === null || value.source === undefined
				? null
				: oneOf(value.source, CODE_SOURCES, `${where}.source`),
		manual: flag(value.manual, `${where}.manual`),
		createdAt: moment(value.createdAt, `${where}.createdAt`),
		items
	};
}

function readMemory(value: unknown, where: string): BackupMemory {
	if (!isRecord(value)) bad(where);
	if (!isCategory(value.category)) bad(`${where}.category`);
	const icon = optionalText(value.icon, `${where}.icon`, MAX_ICON_NAME);
	return {
		name: text(value.name, `${where}.name`, MAX_ITEM_NAME),
		category: value.category as Category,
		icon: isIcon(icon) ? icon : null
	};
}

// Reads an export file. Either everything in it is usable or nothing is taken.
export function parseBackup(content: string): BackupResult {
	if (content.length > MAX_BACKUP_BYTES) return { ok: false, problem: { kind: 'tooLarge' } };
	let data: unknown;
	try {
		data = JSON.parse(content);
	} catch {
		return { ok: false, problem: { kind: 'notBackup' } };
	}
	if (!isRecord(data) || data.app !== BACKUP_APP || typeof data.format !== 'number') {
		return { ok: false, problem: { kind: 'notBackup' } };
	}
	if (data.format > BACKUP_FORMAT) return { ok: false, problem: { kind: 'newer' } };

	try {
		if (!Array.isArray(data.containers)) bad('containers');
		const containers = (data.containers as unknown[]).map((c, i) =>
			readContainer(c, `containers[${i}]`)
		);
		// The same code may exist once typed and once scanned, never twice in a group
		const seen = new Set<string>();
		containers.forEach((container, i) => {
			const key = `${container.manual}:${container.code}`;
			if (seen.has(key)) bad(`containers[${i}].code`);
			seen.add(key);
		});

		const memoryList = data.foodMemory ?? [];
		if (!Array.isArray(memoryList)) bad('foodMemory');
		const foodMemory = (memoryList as unknown[]).map((entry, i) =>
			readMemory(entry, `foodMemory[${i}]`)
		);
		if (new Set(foodMemory.map((entry) => entry.name)).size !== foodMemory.length) {
			bad('foodMemory');
		}

		return {
			ok: true,
			backup: {
				app: BACKUP_APP,
				format: data.format,
				exportedAt: moment(data.exportedAt, 'exportedAt'),
				containers,
				foodMemory
			}
		};
	} catch (error) {
		if (error instanceof Invalid)
			return { ok: false, problem: { kind: 'invalid', where: error.message } };
		throw error;
	}
}

// What a file holds, for the summary shown before importing
export function backupCounts(backup: Backup) {
	const items = backup.containers.flatMap((container) => container.items);
	const filled = items.filter((item) => item.removedAt === null).length;
	return {
		containers: backup.containers.length,
		filled,
		history: items.length - filled,
		memory: backup.foodMemory.length
	};
}

// Name of the downloaded file: hdpantry-2026-01-31.json
export function backupFileName(day: string) {
	return `${BACKUP_APP}-${day}.json`;
}
