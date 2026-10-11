import { describe, expect, it } from 'vitest';
import { and, eq, isNull } from 'drizzle-orm';
import type { ItemValues } from '$lib/items';
import {
	addScanned,
	changeCode,
	containerOverview,
	containersToPick,
	convertToScanned,
	deleteAllContainers,
	deleteContainer,
	findContainer,
	getContainer,
	mergeContainers,
	openScanned,
	openTyped
} from './containers';
import { getDb } from './db';
import { items } from './db/schema';
import { activeItem, addItem, containerHistory, removeActiveItem, vacuumDefault } from './items';

const RAW = 'vendor://app/storage/in/?tc=11AA11&s=m&cc=AB12';
const food = (name: string): ItemValues => ({
	name,
	note: null,
	vacuumed: true,
	location: 'fridge',
	bestBefore: null,
	dateManual: false,
	storedOn: null,
	category: 'other',
	icon: null,
	fill: 'full',
	amount: null,
	unit: null
});

describe('scanned containers', () => {
	it('a scanned code adds its container, with raw content and how it was read', () => {
		expect(openScanned(` ${RAW} `, 'camera')?.container).toMatchObject({
			code: 'AB12',
			size: 'm',
			typeCode: '11AA11',
			rawContent: RAW,
			source: 'camera',
			manual: false
		});
	});
	it('the same container is never added twice – whatever shape the code has', () => {
		const first = findContainer('AB12', false)!;
		const again = openScanned('https://links.example.com/storage?cc=AB12', 'photo');
		expect(again?.container?.id).toBe(first.id);
		expect(getContainer(first.id)?.source).toBe('camera'); // untouched
	});
	it('typing the printed short code opens the scanned container', () => {
		expect(openTyped('ab12')?.id).toBe(findContainer('AB12', false)!.id);
		expect(findContainer('AB12', true)).toBeUndefined();
	});
	it('refuses content that cannot be a code', () => {
		expect(openScanned('   ', 'camera')).toBeNull();
		expect(openTyped('   ')).toBeNull();
	});
});

describe('typed containers', () => {
	it('a typed code that is new adds a container marked as typed', () => {
		expect(openTyped('jar 1')).toMatchObject({ code: 'jar 1', manual: true, source: 'manual' });
		expect(openTyped('jar 1')?.id).toBe(findContainer('jar 1', true)!.id);
	});
	it('its code can be changed, but not to that of another typed container', () => {
		const jar = openTyped('jar 1')!;
		openTyped('jar 2');
		expect(changeCode(jar.id, 'jar 2')).toBe('taken');
		expect(changeCode(jar.id, '   ')).toBe('invalid');
		expect(changeCode(jar.id, ' shelf a ')).toBe('ok');
		expect(getContainer(jar.id)).toMatchObject({ code: 'shelf a', rawContent: 'shelf a' });
		expect(changeCode(jar.id, 'shelf a')).toBe('ok'); // unchanged is fine
		expect(changeCode(findContainer('AB12', false)!.id, 'XX')).toBe('notManual');
	});
});

describe('a scanned code that was typed before', () => {
	it('is not added silently: the typed container is reported as its twin', () => {
		const typed = openTyped('CD34')!;
		addItem(typed.id, food('Cheese'));
		const result = openScanned('vendor://app/in/?s=l&cc=CD34', 'camera');
		expect(result?.container).toBeUndefined();
		expect(result?.twin?.id).toBe(typed.id);
		expect(findContainer('CD34', false)).toBeUndefined();
	});
	it('"the same": the typed one becomes the scanned one, content and history stay', () => {
		const typed = findContainer('CD34', true)!;
		removeActiveItem(typed.id);
		addItem(typed.id, food('Salmon'));
		const merged = convertToScanned(typed.id, 'vendor://app/in/?s=l&cc=CD34', 'camera');
		expect(merged).toMatchObject({ id: typed.id, manual: false, source: 'camera', size: 'l' });
		expect(activeItem(typed.id)?.name).toBe('Salmon');
		expect(containerHistory(typed.id).map((i) => i.name)).toEqual(['Cheese']);
		expect(openTyped('cd34')?.id).toBe(typed.id);
	});
	it('"not the same": both exist next to each other and can be merged later', () => {
		const typed = openTyped('EF56')!;
		addItem(typed.id, food('Bread'));
		removeActiveItem(typed.id);
		const scanned = addScanned('vendor://app/in/?cc=EF56', 'camera')!;
		expect(scanned.id).not.toBe(typed.id);
		expect(openScanned('vendor://app/in/?cc=EF56', 'camera')?.container?.id).toBe(scanned.id);
		expect(openTyped('EF56')?.id).toBe(scanned.id); // typing now opens the scanned one
		expect(containerOverview().find((c) => c.id === typed.id)?.twin).toBe(true);

		addItem(scanned.id, food('Rice'));
		addItem(typed.id, food('Beans'));
		expect(containerOverview().find((c) => c.id === typed.id)?.bothFull).toBe(true);
		expect(mergeContainers(typed.id)).toBe('bothFull');
		removeActiveItem(typed.id);
		expect(containerOverview().find((c) => c.id === typed.id)?.bothFull).toBe(false);
		expect(mergeContainers(typed.id)).toBe('ok');
		expect(getContainer(typed.id)).toBeUndefined();
		expect(activeItem(scanned.id)?.name).toBe('Rice');
		expect(containerHistory(scanned.id).map((i) => i.name)).toEqual(['Beans', 'Bread']);
	});
	it('nothing to merge without a scanned container of the same code', () => {
		expect(mergeContainers(openTyped('lonely')!.id)).toBe('noTwin');
		expect(mergeContainers(findContainer('AB12', false)!.id)).toBe('noTwin');
	});
	it('changing the code of a typed container to a scanned one makes them twins', () => {
		const lonely = findContainer('LONELY', true)!; // short codes are stored in upper case
		expect(changeCode(lonely.id, 'ab12')).toBe('ok');
		expect(containerOverview().find((c) => c.id === lonely.id)).toMatchObject({
			code: 'AB12',
			twin: true
		});
	});
});

describe('containers to pick from without the camera', () => {
	it('all of them, the one used last first, with what is and was in them', () => {
		const jar = openTyped('pick jar')!;
		addItem(jar.id, food('Honey'));
		removeActiveItem(jar.id);
		const box = openTyped('pick box')!;
		addItem(box.id, food('Nuts'));
		const fresh = openTyped('pick new')!;
		const list = containersToPick();
		const of = (id: number) => list.find((c) => c.id === id)!;
		expect(of(jar.id)).toMatchObject({ manual: true, content: null, last: 'Honey' });
		expect(of(box.id)).toMatchObject({ content: 'Nuts', last: null });
		expect(of(fresh.id)).toMatchObject({ content: null, last: null });
		expect(list.some((c) => !c.manual)).toBe(true);
		// used last = first (times are kept to the second, so this one is set a day ahead)
		addItem(jar.id, food('Jam'));
		getDb()
			.update(items)
			.set({ createdAt: new Date(Date.now() + 86_400_000) })
			.where(and(eq(items.containerId, jar.id), isNull(items.removedAt)))
			.run();
		expect(containersToPick()[0]).toMatchObject({ id: jar.id, content: 'Jam', last: 'Honey' });
	});
});

describe('deleting', () => {
	it('one container, with its content and history', () => {
		const gone = findContainer('CD34', false)!;
		deleteContainer(gone.id);
		expect(getContainer(gone.id)).toBeUndefined();
		expect(containerHistory(gone.id)).toEqual([]);
	});
	it('all of them', () => {
		expect(deleteAllContainers()).toBeGreaterThan(2);
		expect(containerOverview()).toEqual([]);
	});
});

describe('a container known by its printed short code', () => {
	const REAL = 'vendor://app/storage/in/?tc=22BB22&s=l&cc=ZQ77';

	it('is added like a scanned one, with the short code as all that is known', () => {
		const { container } = openScanned('ZQ77', 'printed')!;
		expect(container).toMatchObject({
			code: 'ZQ77',
			manual: false,
			source: 'printed',
			rawContent: 'ZQ77',
			size: null,
			typeCode: null
		});
		// Its form says it is a vacuum container, as scanning the code would
		expect(vacuumDefault(container!)).toBe(true);
		// Read again: the same container
		expect(openScanned('ZQ77', 'printed')!.container!.id).toBe(container!.id);
	});

	it('learns the rest when its code is scanned for real, and keeps content and history', () => {
		const before = openScanned('ZQ77', 'printed')!.container!;
		addItem(before.id, food('Peas'));
		const after = openScanned(REAL, 'camera')!.container!;
		expect(after).toMatchObject({
			id: before.id,
			code: 'ZQ77',
			size: 'l',
			typeCode: '22BB22',
			rawContent: REAL,
			source: 'camera'
		});
		expect(activeItem(after.id)?.name).toBe('Peas');
		// Reading the short code later changes nothing any more
		expect(openScanned('ZQ77', 'printed')!.container).toMatchObject({
			rawContent: REAL,
			size: 'l'
		});
	});

	it('asks about a typed container with the same code, like a scan does', () => {
		openTyped('TY44');
		expect(openScanned('TY44', 'printed')!.twin).toMatchObject({ code: 'TY44', manual: true });
	});
});
