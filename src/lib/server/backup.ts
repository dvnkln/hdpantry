import { asc, count, isNull } from 'drizzle-orm';
import { BACKUP_APP, BACKUP_FORMAT, type Backup } from '$lib/backup';
import { getDb } from './db';
import { containers, foodMemory, items } from './db/schema';

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
				items: allItems
					.filter((item) => item.containerId === container.id)
					.map((item) => ({
						name: item.name,
						note: item.note,
						vacuumed: item.vacuumed,
						location: item.location,
						bestBefore: item.bestBefore,
						dateManual: item.dateManual,
						category: item.category,
						icon: item.icon,
						fill: item.fill,
						amount: item.amount,
						unit: item.unit,
						createdAt: item.createdAt.toISOString(),
						removedAt: item.removedAt?.toISOString() ?? null
					}))
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
		tx.delete(foodMemory).run();
		for (const { items: contents, ...container } of backup.containers) {
			const { id } = tx
				.insert(containers)
				.values({ ...container, createdAt: new Date(container.createdAt) })
				.returning({ id: containers.id })
				.get();
			for (const item of contents) {
				tx.insert(items)
					.values({
						...item,
						containerId: id,
						createdAt: new Date(item.createdAt),
						removedAt: item.removedAt ? new Date(item.removedAt) : null
					})
					.run();
			}
		}
		for (const entry of backup.foodMemory) tx.insert(foodMemory).values(entry).run();
	});
}

// What is in the app right now, for the data page (same counts as backupCounts())
export function stockCounts() {
	const db = getDb();
	const [all] = db.select({ n: count() }).from(containers).all();
	const [contents] = db.select({ n: count() }).from(items).all();
	const [filled] = db.select({ n: count() }).from(items).where(isNull(items.removedAt)).all();
	const [memory] = db.select({ n: count() }).from(foodMemory).all();
	return { containers: all.n, filled: filled.n, history: contents.n - filled.n, memory: memory.n };
}
