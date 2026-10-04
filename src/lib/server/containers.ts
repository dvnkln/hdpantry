import { asc, eq, sql } from 'drizzle-orm';
import { parseCode } from '$lib/codes';
import { MAX_CONTAINER_NAME } from '$lib/containers';
import { getDb } from './db';
import { containers } from './db/schema';

export type Container = typeof containers.$inferSelect;

export function findContainerByCode(code: string) {
	return getDb().select().from(containers).where(eq(containers.code, code)).get();
}

export function getContainer(id: number) {
	return getDb().select().from(containers).where(eq(containers.id, id)).get();
}

// Named ones first (by name), then the unnamed by code.
export function listContainers() {
	return getDb()
		.select()
		.from(containers)
		.orderBy(
			sql`${containers.name} is null`,
			sql`${containers.name} collate nocase`,
			asc(containers.code)
		)
		.all();
}

// An empty name means "no name"; too long ones are cut.
export function cleanName(name: string) {
	return name.trim().replace(/\s+/g, ' ').slice(0, MAX_CONTAINER_NAME) || null;
}

// Adds the container a code belongs to, or returns the one that already exists.
// Returns null if the content cannot be a code (empty, too long).
export function addContainer(raw: string, name = '') {
	const parsed = parseCode(raw);
	if (!parsed) return null;
	const existing = findContainerByCode(parsed.id);
	if (existing) return existing;
	return getDb()
		.insert(containers)
		.values({
			code: parsed.id,
			size: parsed.size,
			typeCode: parsed.typeCode,
			name: cleanName(name),
			rawContent: raw.trim()
		})
		.returning()
		.get();
}

export function renameContainer(id: number, name: string) {
	getDb()
		.update(containers)
		.set({ name: cleanName(name) })
		.where(eq(containers.id, id))
		.run();
}

export function deleteContainer(id: number) {
	getDb().delete(containers).where(eq(containers.id, id)).run();
}
