import { describe, expect, it, vi } from 'vitest';
import { addScanned, deleteContainer, openTyped } from './containers';
import { getDb } from './db';
import { items } from './db/schema';
import {
	addPacks,
	attachBarcode,
	correctPacks,
	createProduct,
	deleteAllProducts,
	deleteProduct,
	eatPack,
	findProduct,
	packGroups,
	packsOf,
	productHistory,
	productOfCode,
	productOverview,
	productStock,
	productsToPick,
	updateProduct
} from './products';

// Invented numbers
const PEAS = '9991234567890';
const OTHER = '99123451';

const newProduct = (name: string, barcode: string | null = null) =>
	createProduct({
		name,
		note: null,
		shape: 'bag',
		barcode,
		category: 'veg_cooked',
		icon: null,
		location: 'freezer'
	});

describe('products and their packs', () => {
	it('adds packs with the same date at once and keeps the place for next time', () => {
		const peas = newProduct('Peas', PEAS);
		expect(findProduct(PEAS)?.id).toBe(peas.id);
		const added = addPacks(peas.id, {
			bestBefore: '2027-03-31',
			dateMonth: true,
			location: 'zero',
			count: 3
		});
		expect(added).toHaveLength(3);
		expect(added[0]).toMatchObject({
			productId: peas.id,
			containerId: null,
			name: 'Peas',
			dateMonth: true,
			dateManual: true,
			fill: 'full'
		});
		expect(findProduct(PEAS)?.location).toBe('zero');
		deleteProduct(peas.id);
	});

	it('eats the pack with the nearest date first, packs without a date last', () => {
		const soup = newProduct('Soup');
		const pack = (bestBefore: string | null) =>
			addPacks(soup.id, { bestBefore, dateMonth: false, location: 'pantry', count: 1 })[0];
		const none = pack(null);
		const late = pack('2027-09-01');
		const early = pack('2027-02-01');
		expect(packsOf(soup.id).map((p) => p.id)).toEqual([early.id, late.id, none.id]);

		expect(eatPack(soup.id)).toBe(true);
		expect(packsOf(soup.id).map((p) => p.id)).toEqual([late.id, none.id]);
		// a chosen one
		expect(eatPack(soup.id, none.id)).toBe(true);
		expect(packsOf(soup.id).map((p) => p.id)).toEqual([late.id]);
		expect(
			productHistory(soup.id)
				.map((p) => p.id)
				.sort()
		).toEqual([early.id, none.id].sort());
		// one of another product is not eaten from here
		expect(eatPack(soup.id, 999999)).toBe(false);
		eatPack(soup.id);
		expect(eatPack(soup.id)).toBe(false);
		deleteProduct(soup.id);
	});

	it('a new name goes to the packs in stock, not to those eaten', () => {
		const bread = newProduct('Bred');
		addPacks(bread.id, { bestBefore: null, dateMonth: false, location: 'pantry', count: 2 });
		eatPack(bread.id);
		updateProduct(bread.id, {
			name: 'Bread',
			note: 'sliced',
			shape: 'bag',
			category: 'other',
			icon: null
		});
		expect(packsOf(bread.id).map((p) => [p.name, p.note])).toEqual([['Bread', null]]);
		expect(productHistory(bread.id).map((p) => p.name)).toEqual(['Bred']);
		deleteProduct(bread.id);
		// its packs and history go along
		expect(
			getDb()
				.select()
				.from(items)
				.all()
				.filter((i) => i.productId === bread.id)
		).toEqual([]);
	});

	it('a product recorded without a code gets one later, unless another has it', () => {
		const a = newProduct('Rolls');
		const b = newProduct('Buns', OTHER);
		expect(attachBarcode(a.id, OTHER)).toBe('taken');
		expect(attachBarcode(a.id, PEAS)).toBe('ok');
		expect(findProduct(PEAS)?.id).toBe(a.id);
		expect(attachBarcode(a.id, PEAS)).toBe('ok');
		deleteProduct(a.id);
		deleteProduct(b.id);
	});

	it('offers the products used last first, with the packs in stock', () => {
		// times are kept to the second
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2027-01-01T10:00:00Z'));
		const first = newProduct('Old');
		vi.setSystemTime(new Date('2027-01-01T10:00:10Z'));
		const second = newProduct('Newer');
		vi.setSystemTime(new Date('2027-01-01T10:00:20Z'));
		const third = newProduct('Newest');
		vi.setSystemTime(new Date('2027-01-01T10:00:30Z'));
		// adding a pack makes a product the latest used
		addPacks(first.id, { bestBefore: null, dateMonth: false, location: 'pantry', count: 2 });
		const picks = productsToPick();
		expect(picks.map((p) => p.name)).toEqual(['Old', 'Newest', 'Newer']);
		expect(picks[0].packs).toBe(2);
		expect(picks[1].packs).toBe(0);
		for (const p of [first, second, third]) deleteProduct(p.id);
		vi.useRealTimers();
	});
});

describe('container or product', () => {
	it('a barcode is a product – known or new; UPC-A and EAN-13 are the same one', () => {
		expect(productOfCode(PEAS, 'camera')).toEqual({ barcode: PEAS, known: null });
		const peas = newProduct('Peas', '0009998887778');
		expect(productOfCode('009998887778', 'camera')?.known?.id).toBe(peas.id);
		expect(productOfCode('0009998887778', 'manual')?.known?.id).toBe(peas.id);
		deleteProduct(peas.id);
	});
	it('other codes, printed short codes and codes of containers recorded before are no product', () => {
		expect(productOfCode('x://y?cc=AB12', 'camera')).toBeNull();
		expect(productOfCode('AB12', 'manual')).toBeNull();
		expect(productOfCode('99123451', 'printed')).toBeNull();
		const scanned = addScanned(OTHER, 'camera')!;
		expect(productOfCode(OTHER, 'camera')).toBeNull();
		expect(productOfCode(OTHER, 'manual')).toBeNull();
		deleteContainer(scanned.id);
		// typed by hand as a container: stays that container, typed or scanned
		const typed = openTyped(OTHER)!;
		expect(productOfCode(OTHER, 'manual')).toBeNull();
		expect(productOfCode(OTHER, 'camera')).toBeNull();
		deleteContainer(typed.id);
	});
});

describe('products in the stock list', () => {
	it('one entry per product and place, with the number of packs and the first date', () => {
		const peas = newProduct('Peas', PEAS);
		const add = (bestBefore: string | null, location: 'freezer' | 'fridge', count = 1) =>
			addPacks(peas.id, { bestBefore, dateMonth: false, location, count });
		add(null, 'freezer');
		add('2027-06-30', 'freezer', 2);
		add('2027-03-31', 'freezer');
		add('2027-01-01', 'fridge');
		const entries = productStock().filter((e) => e.productId === peas.id);
		expect(
			entries
				.map((e) => [e.location, e.packs, e.bestBefore])
				.sort((a, b) => String(a[0]).localeCompare(String(b[0])))
		).toEqual([
			['freezer', 4, '2027-03-31'],
			['fridge', 1, '2027-01-01']
		]);
		// eaten packs are gone from the list
		eatPack(peas.id); // the fridge one, it comes first
		expect(productStock().filter((e) => e.productId === peas.id)).toHaveLength(1);
		deleteProduct(peas.id);
		expect(productStock().filter((e) => e.productId === peas.id)).toEqual([]);
	});
});

describe('products in the settings', () => {
	it('all of them by name, with packs in stock and eaten', () => {
		const rolls = newProduct('rolls');
		const peas = newProduct('Peas', PEAS);
		addPacks(peas.id, { bestBefore: null, dateMonth: false, location: 'freezer', count: 3 });
		eatPack(peas.id);
		expect(productOverview()).toEqual([
			{ id: peas.id, name: 'Peas', barcode: PEAS, packs: 2, eaten: 1 },
			{ id: rolls.id, name: 'rolls', barcode: null, packs: 0, eaten: 0 }
		]);
		deleteProduct(rolls.id);
		deleteProduct(peas.id);
	});
});

describe('correcting the packs', () => {
	it('groups by date and place; more, fewer, other date and place', () => {
		const peas = newProduct('Peas');
		const add = (bestBefore: string | null, location: 'freezer' | 'fridge', count: number) =>
			addPacks(peas.id, { bestBefore, dateMonth: !!bestBefore, location, count });
		add('2027-05-31', 'freezer', 3);
		add(null, 'fridge', 1);
		eatPack(peas.id); // one of the three: history
		const groups = packGroups(peas.id);
		expect(groups.map((g) => [g.bestBefore, g.location, g.count])).toEqual([
			['2027-05-31', 'freezer', 2],
			[null, 'fridge', 1]
		]);
		correctPacks(peas.id, [
			{ ...groups[0], count: 4, bestBefore: '2027-06-30', location: 'zero' },
			{ ...groups[1], count: 0 }
		]);
		expect(packsOf(peas.id).map((p) => [p.bestBefore, p.dateMonth, p.location])).toEqual(
			Array(4).fill(['2027-06-30', true, 'zero'])
		);
		// fewer is a correction: the history keeps only what was eaten
		expect(productHistory(peas.id)).toHaveLength(1);
		correctPacks(peas.id, [{ ...packGroups(peas.id)[0], count: 1 }]);
		expect(packsOf(peas.id)).toHaveLength(1);
		expect(productHistory(peas.id)).toHaveLength(1);
		deleteProduct(peas.id);
	});
	it('touches no pack of another product, nor one eaten', () => {
		const a = newProduct('A');
		const b = newProduct('B');
		const [own] = addPacks(a.id, {
			bestBefore: null,
			dateMonth: false,
			location: 'pantry',
			count: 1
		});
		const [other] = addPacks(b.id, {
			bestBefore: null,
			dateMonth: false,
			location: 'pantry',
			count: 1
		});
		eatPack(a.id);
		correctPacks(a.id, [
			{ ids: [own.id, other.id], count: 0, bestBefore: null, dateMonth: false, location: 'fridge' }
		]);
		expect(packsOf(b.id).map((p) => p.id)).toEqual([other.id]);
		expect(productHistory(a.id).map((p) => p.id)).toEqual([own.id]);
		deleteProduct(a.id);
		deleteProduct(b.id);
	});
});

describe('deleting all products', () => {
	it('takes every product with its packs and history, and leaves containers alone', () => {
		const box = addScanned('x://y?cc=GH78', 'camera')!;
		const a = newProduct('A');
		addPacks(a.id, { bestBefore: null, dateMonth: false, location: 'pantry', count: 2 });
		eatPack(a.id);
		newProduct('B');
		expect(deleteAllProducts()).toBeGreaterThanOrEqual(2);
		expect(productOverview()).toEqual([]);
		expect(
			getDb()
				.select()
				.from(items)
				.all()
				.filter((i) => i.productId !== null)
		).toEqual([]);
		expect(getDb().select().from(items).all().length).toBe(0);
		// the container is still there
		expect(openTyped('GH78')?.id).toBe(box.id);
		deleteContainer(box.id);
	});
});
