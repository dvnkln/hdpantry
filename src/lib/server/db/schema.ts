import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { CodeSource } from '../../containers';
import type { FillLevel, Location, Unit } from '../../items';

// Simple key/value store for app settings (interface language, ...).
export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// One row per logged-in browser. `id` is the HMAC of the cookie token, never the token itself.
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// A reusable container or bag, known by the code on it (see src/lib/codes.ts).
export const containers = sqliteTable(
	'containers',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		// ID taken from the code; also shown as the short code
		code: text('code').notNull(),
		size: text('size'),
		typeCode: text('type_code'),
		// Exactly what the code contained when the container was added
		rawContent: text('raw_content').notNull(),
		// How the code was first read ('camera', 'photo', 'manual'); empty = not recorded
		source: text('source').$type<CodeSource>(),
		// Recorded by typing instead of scanning (then `source` is 'manual'). Typed and scanned
		// containers are kept apart, so the same code may exist once in each group.
		manual: integer('manual', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [uniqueIndex('containers_code_idx').on(table.code, table.manual)]
);

// What is (or was) in a container. Content that was eaten is not deleted but gets `removedAt`,
// so every container keeps its history.
export const items = sqliteTable(
	'items',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		containerId: integer('container_id')
			.notNull()
			.references(() => containers.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		note: text('note'),
		vacuumed: integer('vacuumed', { mode: 'boolean' }).notNull(),
		location: text('location').$type<Location>().notNull(),
		// Best before, YYYY-MM-DD; empty = no date
		bestBefore: text('best_before'),
		fill: text('fill').$type<FillLevel>().notNull(),
		// How much is inside, optional: a number and its unit
		amount: real('amount'),
		unit: text('unit').$type<Unit>(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		// Empty = still in the container
		removedAt: integer('removed_at', { mode: 'timestamp' })
	},
	(table) => [
		index('items_container_idx').on(table.containerId),
		// A container holds one thing at a time
		uniqueIndex('items_active_idx')
			.on(table.containerId)
			.where(sql`${table.removedAt} is null`)
	]
);
