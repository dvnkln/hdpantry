import { error } from '@sveltejs/kit';
import { and, asc, count, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { parseCode } from '$lib/codes';
import type { CodeSource, Pick } from '$lib/containers';
import type { Locale } from '$lib/i18n/index.svelte';
import { getDb } from './db';
import { containers, items } from './db/schema';
import { serverMessages } from './i18n';

export type Container = typeof containers.$inferSelect;

// Typed and scanned containers are kept apart: the same code may exist once in each group
// (see mergeContainers for bringing two of them together).
export function findContainer(code: string, manual: boolean) {
	return getDb()
		.select()
		.from(containers)
		.where(and(eq(containers.code, code), eq(containers.manual, manual)))
		.get();
}

export function getContainer(id: number) {
	return getDb().select().from(containers).where(eq(containers.id, id)).get();
}

// The container of a page address like /containers/3 – or the "not found" page.
export function containerOf(id: string, locale: Locale) {
	const container = /^\d+$/.test(id) ? getContainer(Number(id)) : undefined;
	if (!container) error(404, serverMessages(locale).containers.notFound);
	return container;
}

function insert(raw: string, source: CodeSource | null) {
	const parsed = parseCode(raw)!;
	return getDb()
		.insert(containers)
		.values({
			code: parsed.id,
			size: parsed.size,
			typeCode: parsed.typeCode,
			rawContent: raw.trim(),
			source,
			manual: source === 'manual'
		})
		.returning()
		.get();
}

// A code was typed by hand: the scanned container with that code if there is one (the short
// code is printed on the container), else the typed one – added if it is new.
// Returns null if the text cannot be a code (empty, too long).
export function openTyped(raw: string) {
	const parsed = parseCode(raw);
	if (!parsed) return null;
	return findContainer(parsed.id, false) ?? findContainer(parsed.id, true) ?? insert(raw, 'manual');
}

// A code was scanned (camera or photo): its container, added if it is new. If only a typed
// container with the same code exists, nothing is added – the caller asks whether the two are
// the same (`twin`).
export function openScanned(raw: string, source: CodeSource | null) {
	const parsed = parseCode(raw);
	if (!parsed) return null;
	const known = findContainer(parsed.id, false);
	if (known) return { container: known };
	const twin = findContainer(parsed.id, true);
	if (twin) return { twin };
	return { container: insert(raw, source) };
}

// "They are not the same": the scanned code gets its own container next to the typed one.
export function addScanned(raw: string, source: CodeSource | null) {
	const parsed = parseCode(raw);
	if (!parsed) return null;
	return findContainer(parsed.id, false) ?? insert(raw, source);
}

// "They are the same": the typed container becomes the scanned one – content and history stay.
export function convertToScanned(id: number, raw: string, source: CodeSource | null) {
	const parsed = parseCode(raw);
	const container = getContainer(id);
	if (!parsed || !container?.manual || findContainer(parsed.id, false)) return null;
	return getDb()
		.update(containers)
		.set({
			code: parsed.id,
			size: parsed.size,
			typeCode: parsed.typeCode,
			rawContent: raw.trim(),
			source,
			manual: false
		})
		.where(eq(containers.id, id))
		.returning()
		.get();
}

// Brings a typed container together with the scanned one of the same code: content and
// history move over, the typed container disappears. Not possible while both are full –
// a container holds one thing at a time.
export function mergeContainers(manualId: number): 'ok' | 'bothFull' | 'noTwin' {
	const db = getDb();
	const from = getContainer(manualId);
	const into = from?.manual ? findContainer(from.code, false) : undefined;
	if (!from || !into) return 'noTwin';
	const full = (id: number) =>
		db
			.select({ id: items.id })
			.from(items)
			.where(and(eq(items.containerId, id), isNull(items.removedAt)))
			.get() !== undefined;
	if (full(from.id) && full(into.id)) return 'bothFull';
	db.transaction((tx) => {
		tx.update(items).set({ containerId: into.id }).where(eq(items.containerId, from.id)).run();
		tx.delete(containers).where(eq(containers.id, from.id)).run();
	});
	return 'ok';
}

// Gives a typed container another code. Scanned ones keep theirs: it is what their code says.
export function changeCode(id: number, raw: string): 'ok' | 'invalid' | 'taken' | 'notManual' {
	const container = getContainer(id);
	if (!container?.manual) return 'notManual';
	const parsed = parseCode(raw);
	if (!parsed) return 'invalid';
	const other = findContainer(parsed.id, true);
	if (other && other.id !== id) return 'taken';
	getDb()
		.update(containers)
		.set({ code: parsed.id, size: parsed.size, typeCode: parsed.typeCode, rawContent: raw.trim() })
		.where(eq(containers.id, id))
		.run();
	return 'ok';
}

// All containers with what is in them and how many earlier contents they remember – for the
// settings. `twin`: a typed container that has a scanned one with the same code.
export function containerOverview() {
	const db = getDb();
	const content = new Map(
		db
			.select({ containerId: items.containerId, name: items.name })
			.from(items)
			.where(isNull(items.removedAt))
			.all()
			.map((row) => [row.containerId, row.name])
	);
	const history = new Map(
		db
			.select({ containerId: items.containerId, n: count() })
			.from(items)
			.where(isNotNull(items.removedAt))
			.groupBy(items.containerId)
			.all()
			.map((row) => [row.containerId, row.n])
	);
	const all = db
		.select()
		.from(containers)
		.orderBy(asc(containers.code), asc(containers.manual))
		.all();
	const scanned = new Map(all.filter((c) => !c.manual).map((c) => [c.code, c.id]));
	return all.map((c) => {
		const twinId = c.manual ? scanned.get(c.code) : undefined;
		return {
			id: c.id,
			code: c.code,
			size: c.size,
			manual: c.manual,
			// What the scanned code contained (typed containers have none)
			rawContent: c.manual ? null : c.rawContent,
			twin: twinId !== undefined,
			// Merging is not possible while both hold something
			bothFull: twinId !== undefined && content.has(c.id) && content.has(twinId),
			content: content.get(c.id) ?? null,
			history: history.get(c.id) ?? 0
		};
	});
}

// All containers to choose from when recording without the camera – so a container that was
// typed in by hand is found again and keeps its history. With what is in each one now and
// what was taken out last; those used last come first.
export function containersToPick(): Pick[] {
	const db = getDb();
	const now = new Map<number, { name: string; at: number }>();
	const last = new Map<number, { name: string; at: number }>();
	const rows = db
		.select({
			containerId: items.containerId,
			name: items.name,
			createdAt: items.createdAt,
			removedAt: items.removedAt
		})
		.from(items)
		.orderBy(desc(items.removedAt), desc(items.id))
		.all();
	for (const row of rows) {
		if (row.removedAt === null) {
			now.set(row.containerId, { name: row.name, at: row.createdAt.getTime() });
		} else if (!last.has(row.containerId)) {
			last.set(row.containerId, { name: row.name, at: row.removedAt.getTime() });
		}
	}
	return db
		.select()
		.from(containers)
		.all()
		.map((c) => ({
			id: c.id,
			code: c.code,
			size: c.size,
			manual: c.manual,
			content: now.get(c.id)?.name ?? null,
			last: last.get(c.id)?.name ?? null,
			used: Math.max(now.get(c.id)?.at ?? 0, last.get(c.id)?.at ?? 0, c.createdAt.getTime())
		}))
		.sort((a, b) => b.used - a.used || b.id - a.id)
		.map(({ used, ...container }) => {
			void used;
			return container;
		});
}

// Also removes what is and was in it.
export function deleteContainer(id: number) {
	getDb().delete(containers).where(eq(containers.id, id)).run();
}

// Everything: all containers, all contents, all history. Returns how many containers went.
export function deleteAllContainers() {
	return getDb().delete(containers).run().changes;
}
