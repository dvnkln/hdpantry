import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { parseCode, parseProductCode } from '$lib/codes';
import type { CodeSource } from '$lib/containers';
import type { Locale } from '$lib/i18n/index.svelte';
import type { ProductTile } from '$lib/picks';
import {
	brandKey,
	oneSpelling,
	tidyBrand,
	type PackGroup,
	type PackValues,
	type ProductValues
} from '$lib/products';
import type { Location } from '$lib/items';
import { findContainer } from './containers';
import { getDb } from './db';
import { items, products } from './db/schema';
import { serverMessages } from './i18n';

export type Product = typeof products.$inferSelect;

export function getProduct(id: number) {
	return getDb().select().from(products).where(eq(products.id, id)).get();
}

// The product of a page address like /products/3 – or the "not found" page.
export function productOf(id: string, locale: Locale) {
	const product = /^\d+$/.test(id) ? getProduct(Number(id)) : undefined;
	if (!product) error(404, serverMessages(locale).products.notFound);
	return product;
}

// Whether a code that was read (or typed) is the barcode of a bought product – and if so,
// which product, if it is known. A container that was recorded with that very code before
// stays a container (so codes used as containers before products existed keep working), and a
// printed short code always belongs to a container.
export function productOfCode(raw: string, source: CodeSource | null) {
	const barcode = parseProductCode(raw);
	if (!barcode || source === 'printed') return null;
	const id = parseCode(raw)?.id ?? '';
	if (findContainer(id, false) || findContainer(id, true)) return null;
	return { barcode, known: findProduct(barcode) ?? null };
}

// The product with this barcode (see parseProductCode), if it was recorded before
export function findProduct(barcode: string) {
	return getDb().select().from(products).where(eq(products.barcode, barcode)).get();
}

// The brands in use, the most common first – to suggest when one is typed, and the spelling a
// maker keeps (see tidyBrand)
export function knownBrands() {
	return getDb()
		.select({ brand: products.brand })
		.from(products)
		.where(isNotNull(products.brand))
		.groupBy(products.brand)
		.orderBy(desc(sql`count(*)`), asc(sql`${products.brand} collate nocase`))
		.all()
		.map((row) => row.brand!);
}

export function createProduct(
	values: ProductValues & { barcode: string | null; location: Location }
) {
	const brand = tidyBrand(values.brand, knownBrands());
	return getDb()
		.insert(products)
		.values({ ...values, brand })
		.returning()
		.get();
}

// Renames a product or changes its brand, kind of food, symbol, note or packaging – its packs
// in stock take the new name, kind and symbol, the ones eaten keep what they were called then.
// A brand spelled anew (only its case changed) is spelled so for every product of that maker.
export function updateProduct(id: number, values: ProductValues) {
	const before = getProduct(id);
	const typed = tidyBrand(values.brand, []);
	const respelled =
		before?.brand && typed && typed !== before.brand && brandKey(typed) === brandKey(before.brand);
	const brand = respelled ? typed : tidyBrand(values.brand, knownBrands());
	getDb().transaction((tx) => {
		tx.update(products)
			.set({ ...values, brand })
			.where(eq(products.id, id))
			.run();
		if (respelled) {
			tx.update(products).set({ brand }).where(eq(products.brand, before.brand!)).run();
		}
		// The packs keep only what is shown with them; note and packaging belong to the product
		tx.update(items)
			.set({ name: values.name, category: values.category, icon: values.icon })
			.where(and(eq(items.productId, id), isNull(items.removedAt)))
			.run();
	});
}

// One spelling per maker in what is stored already: old data, an imported file. Run at start
// and after an import; changes nothing once the spellings agree.
export function unifyBrands() {
	const groups = new Map<string, string[]>();
	for (const brand of knownBrands()) {
		const key = brandKey(brand);
		groups.set(key, [...(groups.get(key) ?? []), brand]);
	}
	getDb().transaction((tx) => {
		for (const spellings of groups.values()) {
			const one = oneSpelling(spellings);
			for (const other of spellings.filter((s) => s !== one)) {
				tx.update(products).set({ brand: one }).where(eq(products.brand, other)).run();
			}
		}
	});
}

// Gives a product recorded without a code its barcode (scanned later). Refused if another
// product has it already.
export function attachBarcode(id: number, barcode: string): 'ok' | 'taken' {
	const other = findProduct(barcode);
	if (other) return other.id === id ? 'ok' : 'taken';
	getDb().update(products).set({ barcode }).where(eq(products.id, id)).run();
	return 'ok';
}

// Also removes its packs and their history.
export function deleteProduct(id: number) {
	getDb().delete(products).where(eq(products.id, id)).run();
}

// New packs of a product, all with the same date. The place they go to is remembered for the
// next ones.
export function addPacks(productId: number, values: PackValues) {
	const product = getProduct(productId);
	if (!product) return [];
	const { count, ...pack } = values;
	return getDb().transaction((tx) => {
		tx.update(products).set({ location: pack.location }).where(eq(products.id, productId)).run();
		return tx
			.insert(items)
			.values(
				Array.from({ length: count }, () => ({
					productId,
					name: product.name,
					category: product.category,
					icon: product.icon,
					...pack,
					// A pack has no fill level and is not vacuum-sealed; its date is the printed one
					vacuumed: false,
					fill: 'full' as const,
					dateManual: true
				}))
			)
			.returning()
			.all();
	});
}

// The packs in stock, the one to eat first (nearest date) first, those without a date last.
export function packsOf(productId: number) {
	return getDb()
		.select()
		.from(items)
		.where(and(eq(items.productId, productId), isNull(items.removedAt)))
		.orderBy(sql`${items.bestBefore} is null`, asc(items.bestBefore), asc(items.id))
		.all();
}

// Packs eaten before, the latest first
export function productHistory(productId: number, limit = 8) {
	return getDb()
		.select()
		.from(items)
		.where(and(eq(items.productId, productId), isNotNull(items.removedAt)))
		.orderBy(desc(items.removedAt), desc(items.id))
		.limit(limit)
		.all();
}

// One pack eaten: the given one, or else the one to eat first. Returns false if there is none.
export function eatPack(productId: number, itemId?: number) {
	const pack = itemId ? packsOf(productId).find((p) => p.id === itemId) : packsOf(productId)[0];
	if (!pack) return false;
	getDb().update(items).set({ removedAt: new Date() }).where(eq(items.id, pack.id)).run();
	return true;
}

// All products to choose from on the page for scanning and typing, the ones used last first (a
// pack added or eaten), with the packs in stock now
export function productsToPick(): ProductTile[] {
	const db = getDb();
	const used = new Map<number, number>();
	const inStock = new Map<number, number>();
	const rows = db
		.select({
			productId: items.productId,
			createdAt: items.createdAt,
			removedAt: items.removedAt
		})
		.from(items)
		.where(isNotNull(items.productId))
		.all();
	for (const row of rows) {
		const id = row.productId!;
		const at = Math.max(row.createdAt.getTime(), row.removedAt?.getTime() ?? 0);
		used.set(id, Math.max(used.get(id) ?? 0, at));
		if (!row.removedAt) inStock.set(id, (inStock.get(id) ?? 0) + 1);
	}
	return db
		.select()
		.from(products)
		.all()
		.map((p) => ({
			kind: 'product' as const,
			id: p.id,
			name: p.name,
			icon: p.icon,
			category: p.category,
			barcode: p.barcode,
			packs: inStock.get(p.id) ?? 0,
			shape: p.shape ?? ('box' as const),
			used: Math.max(used.get(p.id) ?? 0, p.createdAt.getTime())
		}))
		.sort((a, b) => b.used - a.used || b.id - a.id);
}

// The products in stock for the list: one entry per product and place of storage, with how
// many packs lie there and the date of the one to eat first (packs without a date count, but
// a date always wins). Since: the day that first pack went in.
export function productStock() {
	const packs = getDb()
		.select({
			id: items.id,
			productId: items.productId,
			location: items.location,
			bestBefore: items.bestBefore,
			dateMonth: items.dateMonth,
			createdAt: items.createdAt,
			storedOn: items.storedOn
		})
		.from(items)
		.where(and(isNotNull(items.productId), isNull(items.removedAt)))
		.orderBy(sql`${items.bestBefore} is null`, asc(items.bestBefore), asc(items.id))
		.all();
	const byKey = new Map<string, { first: (typeof packs)[number]; count: number }>();
	for (const pack of packs) {
		const key = `${pack.productId}:${pack.location}`;
		const entry = byKey.get(key);
		if (entry) entry.count++;
		else byKey.set(key, { first: pack, count: 1 });
	}
	const byId = new Map(
		getDb()
			.select()
			.from(products)
			.all()
			.map((p) => [p.id, p])
	);
	return [...byKey.values()].map(({ first, count }) => {
		const product = byId.get(first.productId!)!;
		return {
			productId: product.id,
			name: product.name,
			brand: product.brand,
			note: product.note,
			shape: product.shape ?? ('box' as const),
			category: product.category,
			icon: product.icon,
			location: first.location,
			bestBefore: first.bestBefore,
			dateMonth: first.dateMonth,
			packs: count,
			createdAt: first.createdAt,
			storedOn: first.storedOn
		};
	});
}

// All products for the settings, by name: their barcode, packs in stock and packs eaten
export function productOverview() {
	const counts = new Map<number, { packs: number; eaten: number }>();
	for (const row of getDb()
		.select({ productId: items.productId, removedAt: items.removedAt })
		.from(items)
		.where(isNotNull(items.productId))
		.all()) {
		const entry = counts.get(row.productId!) ?? { packs: 0, eaten: 0 };
		if (row.removedAt) entry.eaten++;
		else entry.packs++;
		counts.set(row.productId!, entry);
	}
	return getDb()
		.select()
		.from(products)
		.orderBy(sql`${products.name} collate nocase`)
		.all()
		.map((p) => ({
			id: p.id,
			name: p.name,
			brand: p.brand,
			barcode: p.barcode,
			...(counts.get(p.id) ?? { packs: 0, eaten: 0 })
		}));
}

// The packs in stock grouped by date and place, for correcting them under "edit"
export function packGroups(productId: number): PackGroup[] {
	const groups = new Map<string, PackGroup>();
	for (const pack of packsOf(productId)) {
		const key = `${pack.bestBefore}|${pack.dateMonth}|${pack.location}`;
		const group = groups.get(key);
		if (group) {
			group.ids.push(pack.id);
			group.count++;
		} else {
			groups.set(key, {
				ids: [pack.id],
				count: 1,
				bestBefore: pack.bestBefore,
				dateMonth: pack.dateMonth,
				location: pack.location
			});
		}
	}
	return [...groups.values()];
}

// Corrects the packs in stock: each group gets its date and place, and as many packs as it
// should have – more are added like the others, fewer are deleted (a correction, not eaten:
// it leaves no history). Only packs of this product that are still in stock are touched.
export function correctPacks(productId: number, groups: PackGroup[]) {
	const product = getProduct(productId);
	if (!product) return;
	const inStock = new Map(packsOf(productId).map((pack) => [pack.id, pack]));
	getDb().transaction((tx) => {
		for (const group of groups) {
			const own = group.ids.filter((id) => inStock.has(id)).sort((a, b) => a - b);
			const values = {
				bestBefore: group.bestBefore,
				dateMonth: group.dateMonth,
				location: group.location
			};
			const kept = own.slice(0, group.count);
			for (const id of kept) tx.update(items).set(values).where(eq(items.id, id)).run();
			for (const id of own.slice(group.count)) tx.delete(items).where(eq(items.id, id)).run();
			const first = kept.length ? inStock.get(kept[0]) : undefined;
			for (let i = own.length; i < group.count; i++) {
				tx.insert(items)
					.values({
						productId,
						name: product.name,
						category: product.category,
						icon: product.icon,
						...values,
						storedOn: first?.storedOn ?? null,
						vacuumed: false,
						fill: 'full',
						dateManual: true
					})
					.run();
			}
		}
		// All packs at one place now: that is where the next ones go
		const places = new Set(groups.filter((g) => g.count > 0).map((g) => g.location));
		if (places.size === 1) {
			tx.update(products)
				.set({ location: [...places][0] })
				.where(eq(products.id, productId))
				.run();
		}
	});
}

// Every product with its packs and their history; containers stay. Returns how many went.
export function deleteAllProducts() {
	return getDb().delete(products).run().changes;
}
