import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
export const containers = sqliteTable('containers', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	// ID taken from the code; also shown as the short code
	code: text('code').notNull().unique(),
	size: text('size'),
	typeCode: text('type_code'),
	// Optional name given by the user, e.g. "Bag L 3"
	name: text('name'),
	// Exactly what the code contained when the container was added
	rawContent: text('raw_content').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});
