import { and, asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import type { ItemValues, Location } from '$lib/items';
import { getDb } from './db';
import { containers, items } from './db/schema';

export type Item = typeof items.$inferSelect;

// What is in the container right now, if anything.
export function activeItem(containerId: number) {
	return getDb()
		.select()
		.from(items)
		.where(and(eq(items.containerId, containerId), isNull(items.removedAt)))
		.get();
}

// What was in the container before, the latest first – shown when it is filled again.
export function containerHistory(containerId: number, limit = 8) {
	return getDb()
		.select()
		.from(items)
		.where(and(eq(items.containerId, containerId), isNotNull(items.removedAt)))
		.orderBy(desc(items.removedAt), desc(items.id))
		.limit(limit)
		.all();
}

// Everything in stock: what expires first comes first, things without a date last.
export function listStock() {
	return getDb()
		.select({
			id: items.id,
			containerId: items.containerId,
			name: items.name,
			note: items.note,
			vacuumed: items.vacuumed,
			location: items.location,
			bestBefore: items.bestBefore,
			category: items.category,
			icon: items.icon,
			fill: items.fill,
			amount: items.amount,
			unit: items.unit,
			code: containers.code,
			size: containers.size,
			source: containers.source
		})
		.from(items)
		.innerJoin(containers, eq(items.containerId, containers.id))
		.where(isNull(items.removedAt))
		.orderBy(
			sql`${items.bestBefore} is null`,
			asc(items.bestBefore),
			sql`${items.name} collate nocase`
		)
		.all();
}

// Fills an empty container. Returns null if it already holds something.
export function addItem(containerId: number, values: ItemValues) {
	if (activeItem(containerId)) return null;
	return getDb()
		.insert(items)
		.values({ containerId, ...values })
		.returning()
		.get();
}

// Corrects what is in the container. Returns false if it is empty.
export function updateActiveItem(containerId: number, values: ItemValues) {
	return (
		getDb()
			.update(items)
			.set(values)
			.where(and(eq(items.containerId, containerId), isNull(items.removedAt)))
			.run().changes > 0
	);
}

// Eaten: the container is empty again, the entry stays as its history.
export function removeActiveItem(containerId: number) {
	return (
		getDb()
			.update(items)
			.set({ removedAt: new Date() })
			.where(and(eq(items.containerId, containerId), isNull(items.removedAt)))
			.run().changes > 0
	);
}

// Where the latest content was put – preselected in the form.
export function lastLocation(): Location {
	const row = getDb()
		.select({ location: items.location })
		.from(items)
		.orderBy(desc(items.id))
		.limit(1)
		.get();
	return row?.location ?? 'fridge';
}
