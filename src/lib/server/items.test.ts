import { expect, it } from 'vitest';
import type { ItemValues } from '$lib/items';
import { containerOverview, deleteContainer, openTyped } from './containers';
import { getDb } from './db';
import { items } from './db/schema';
import {
	activeItem,
	addItem,
	containerHistory,
	lastLocation,
	listStock,
	removeActiveItem,
	updateActiveItem
} from './items';

const lentils: ItemValues = {
	name: 'Lentils',
	note: null,
	vacuumed: true,
	location: 'freezer',
	bestBefore: '2027-01-15',
	dateManual: false,
	category: 'other',
	icon: null,
	fill: 'medium',
	amount: null,
	unit: null
};

const allNames = () =>
	getDb()
		.select()
		.from(items)
		.all()
		.map((i) => i.name);

it('suggests the fridge before anything was stored', () => {
	expect(lastLocation()).toBe('fridge');
});

it('fills an empty container and remembers where it was put', () => {
	const bag = openTyped('AB12')!;
	expect(activeItem(bag.id)).toBeUndefined();
	expect(addItem(bag.id, lentils)).toMatchObject({ name: 'Lentils', containerId: bag.id });
	expect(activeItem(bag.id)?.name).toBe('Lentils');
	expect(lastLocation()).toBe('freezer');
});

it('a container holds one thing at a time', () => {
	const bag = openTyped('AB12')!;
	expect(addItem(bag.id, { ...lentils, name: 'Bread' })).toBeNull();
	expect(activeItem(bag.id)?.name).toBe('Lentils');
	// the database itself refuses it as well
	expect(() =>
		getDb()
			.insert(items)
			.values({ containerId: bag.id, ...lentils })
			.run()
	).toThrow();
});

it('corrects the content of a container', () => {
	const bag = openTyped('AB12')!;
	expect(
		updateActiveItem(bag.id, { ...lentils, name: 'Red lentils', amount: 1.5, unit: 'kg' })
	).toBe(true);
	expect(activeItem(bag.id)).toMatchObject({ name: 'Red lentils', amount: 1.5, unit: 'kg' });
	expect(updateActiveItem(openTyped('EMPTY1')!.id, lentils)).toBe(false);
});

it('lists the stock: what expires first comes first, no date last', () => {
	addItem(openTyped('CD34')!.id, { ...lentils, name: 'Salmon', bestBefore: '2026-11-01' });
	addItem(openTyped('EF56')!.id, { ...lentils, name: 'Rice', bestBefore: null });
	addItem(openTyped('GH78')!.id, { ...lentils, name: 'apple', bestBefore: null });
	expect(listStock().map((i) => i.name)).toEqual(['Salmon', 'Red lentils', 'apple', 'Rice']);
	expect(listStock()[0]).toMatchObject({ code: 'CD34', size: null, source: 'manual' });
});

it('eaten: the container is empty again and can take something new', () => {
	const bag = openTyped('AB12')!;
	expect(removeActiveItem(bag.id)).toBe(true);
	expect(activeItem(bag.id)).toBeUndefined();
	expect(removeActiveItem(bag.id)).toBe(false);
	expect(listStock().map((i) => i.name)).not.toContain('Red lentils');
	expect(addItem(bag.id, { ...lentils, name: 'Bread' })?.name).toBe('Bread');
});

it('history of a container: the latest first, only what was taken out', () => {
	const bag = openTyped('AB12')!;
	expect(containerHistory(bag.id).map((i) => i.name)).toEqual(['Red lentils']);
	removeActiveItem(bag.id);
	addItem(bag.id, { ...lentils, name: 'Soup' });
	expect(containerHistory(bag.id).map((i) => i.name)).toEqual(['Bread', 'Red lentils']);
	expect(containerHistory(bag.id, 1)).toHaveLength(1);
	expect(containerHistory(openTyped('CD34')!.id)).toEqual([]);
});

it('overview for the settings: every container with content and length of history', () => {
	const rows = containerOverview();
	expect(rows.map((c) => c.code)).toEqual(['AB12', 'CD34', 'EF56', 'EMPTY1', 'GH78']);
	expect(rows[0]).toMatchObject({ code: 'AB12', content: 'Soup', history: 2 });
	expect(rows[3]).toMatchObject({ code: 'EMPTY1', content: null, history: 0 });
});

it('deleting a container removes its content and history', () => {
	const bag = openTyped('AB12')!;
	deleteContainer(bag.id);
	expect(allNames()).not.toContain('Soup');
	expect(allNames()).not.toContain('Bread');
});
