import { describe, expect, it } from 'vitest';
import type { ItemValues } from '$lib/items';
import {
	addScanned,
	changeCode,
	containerOverview,
	convertToScanned,
	deleteAllContainers,
	deleteContainer,
	findContainer,
	getContainer,
	mergeContainers,
	openScanned,
	openTyped
} from './containers';
import { activeItem, addItem, containerHistory, removeActiveItem } from './items';

const RAW = 'vendor://app/storage/in/?tc=11AA11&s=m&cc=AB12';
const food = (name: string): ItemValues => ({
	name,
	note: null,
	vacuumed: true,
	location: 'fridge',
	bestBefore: null,
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
