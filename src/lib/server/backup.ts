import { and, asc, count, isNotNull, isNull } from 'drizzle-orm';
import { BACKUP_APP, BACKUP_FORMAT, type Backup, type BackupItem } from '$lib/backup';
import { getDb } from './db';
import { containers, foodMemory, items, products } from './db/schema';

function backupItem(item: typeof items.$inferSelect) {
	return {
		name: item.name,
		note: item.note,
		vacuumed: item.vacuumed,
		location: item.location,
		bestBefore: item.bestBefore,
		dateMonth: item.dateMonth,
		dateManual: item.dateManual,
		category: item.category,
		icon: item.icon,
		fill: item.fill,
		amount: item.amount,
		unit: item.unit,
		storedOn: item.storedOn,
		createdAt: item.createdAt.toISOString(),
		removedAt: item.removedAt?.toISOString() ?? null
	};
}

// Everything about the stock as one export file (see src/lib/backup.ts for what is in it).
export function exportBackup(now = new Date()): Backup {
	const db = getDb();
	const allItems = db.select().from(items).orderBy(asc(items.id)).all();
	return {
		app: BACKUP_APP,
		format: BACKUP_FORMAT,
		exportedAt: now.toISOString(),
		containers: db
			.select()
			.from(containers)
			.orderBy(asc(containers.id))
			.all()
			.map((container) => ({
				code: container.code,
				size: container.size,
				typeCode: container.typeCode,
				rawContent: container.rawContent,
				source: container.source,
				manual: container.manual,
				createdAt: container.createdAt.toISOString(),
				items: allItems.filter((item) => item.containerId === container.id).map(backupItem)
			})),
		products: db
			.select()
			.from(products)
			.orderBy(asc(products.id))
			.all()
			.map((product) => ({
				barcode: product.barcode,
				name: product.name,
				note: product.note,
				shape: product.shape,
				category: product.category,
				icon: product.icon,
				location: product.location,
				createdAt: product.createdAt.toISOString(),
				items: allItems.filter((item) => item.productId === product.id).map(backupItem)
			})),
		foodMemory: db.select().from(foodMemory).orderBy(asc(foodMemory.name)).all()
	};
}

// Replaces the whole stock with the file: every container, content, history entry and learned
// correction goes, then the file is written – all at once, so a failure leaves things as they
// were. Only call with a file that passed parseBackup().
export function importBackup(backup: Backup) {
	getDb().transaction((tx) => {
		tx.delete(containers).run(); // takes contents and history along
		tx.delete(products).run(); // and packs
		tx.delete(foodMemory).run();
		const insertItems = (
			contents: BackupItem[],
			owner: { containerId: number } | { productId: number }
		) => {
			for (const item of contents) {
				tx.insert(items)
					.values({
						...item,
						...owner,
						createdAt: new Date(item.createdAt),
						removedAt: item.removedAt ? new Date(item.removedAt) : null
					})
					.run();
			}
		};
		for (const { items: contents, ...container } of backup.containers) {
			const { id } = tx
				.insert(containers)
				.values({ ...container, createdAt: new Date(container.createdAt) })
				.returning({ id: containers.id })
				.get();
			insertItems(contents, { containerId: id });
		}
		for (const { items: packs, ...product } of backup.products) {
			const { id } = tx
				.insert(products)
				.values({ ...product, createdAt: new Date(product.createdAt) })
				.returning({ id: products.id })
				.get();
			insertItems(packs, { productId: id });
		}
		for (const entry of backup.foodMemory) tx.insert(foodMemory).values(entry).run();
	});
}

// What is in the app right now, for the data page (same counts as backupCounts())
export function stockCounts() {
	const db = getDb();
	const number = (rows: { n: number }[]) => rows[0].n;
	const contents = isNotNull(items.containerId);
	const packs = isNotNull(items.productId);
	const all = (where: ReturnType<typeof and>) =>
		number(db.select({ n: count() }).from(items).where(where).all());
	const filled = all(and(contents, isNull(items.removedAt)));
	const inStock = all(and(packs, isNull(items.removedAt)));
	return {
		containers: number(db.select({ n: count() }).from(containers).all()),
		filled,
		products: number(db.select({ n: count() }).from(products).all()),
		packs: inStock,
		history: all(isNotNull(items.removedAt)),
		memory: number(db.select({ n: count() }).from(foodMemory).all())
	};
}
