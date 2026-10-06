import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { CodeSource } from '../../containers';
import type { Category } from '../../food/categories';
import type { FillLevel, Location, Unit } from '../../items';
import type { ReminderKind } from '../../reminders';

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

// A container, known by the code on it (see src/lib/codes.ts).
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
		// The date was typed by hand (true) or is the suggestion from kind of food, place and
		// vacuum (false) – a suggestion follows when those change, a typed date stays
		dateManual: integer('date_manual', { mode: 'boolean' }).notNull().default(false),
		// Kind of food (see src/lib/food/categories.ts) and its symbol; empty = not known
		category: text('category').$type<Category>(),
		icon: text('icon'),
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

// What the user corrected: kind of food and symbol for a name (simplified, see
// src/lib/food/dictionary.ts). Next time that name is suggested this way.
export const foodMemory = sqliteTable('food_memory', {
	name: text('name').primaryKey(),
	category: text('category').$type<Category>().notNull(),
	icon: text('icon')
});

// A browser or installed app that receives push notifications (Web Push). `endpoint` is the
// address at the browser maker's push service, the two keys encrypt the message for this
// device only. Belongs to the user who switched it on.
export const pushSubscriptions = sqliteTable(
	'push_subscriptions',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		endpoint: text('endpoint').notNull().unique(),
		p256dh: text('p256dh').notNull(),
		auth: text('auth').notNull(),
		// Shown in the list of devices, e.g. "Chrome · Android"
		label: text('label').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		// Last time the push service accepted a message for this device
		lastOkAt: integer('last_ok_at', { mode: 'timestamp' }),
		// Off: stays in the list with everything about it, but gets no messages
		enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true)
	},
	(table) => [index('push_subscriptions_user').on(table.userId)]
);

// What the user was already told about a content, so nothing is announced twice. `date` is
// the best-before date the message was about: a content whose date is changed is announced
// anew. Rows go with their content.
export const notificationsSent = sqliteTable(
	'notifications_sent',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		itemId: integer('item_id')
			.notNull()
			.references(() => items.id, { onDelete: 'cascade' }),
		// 'soon' | 'today' | 'expired' (see src/lib/reminders.ts)
		kind: text('kind').$type<ReminderKind>().notNull(),
		date: text('date').notNull()
	},
	(table) => [
		uniqueIndex('notifications_sent_once').on(table.userId, table.itemId, table.kind, table.date)
	]
);

// Further ways to notify the user, besides their own devices (see server/channels.ts): a
// Pushover account, an ntfy topic, a webhook. Any number, each with a name and a switch – off
// keeps the settings. `config` holds what the kind needs (keys, address, ...).
export const notificationChannels = sqliteTable(
	'notification_channels',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		kind: text('kind').$type<'pushover' | 'ntfy' | 'webhook'>().notNull(),
		name: text('name').notNull(),
		enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
		config: text('config', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		lastOkAt: integer('last_ok_at', { mode: 'timestamp' }),
		// Why the last message could not be delivered (cleared by the next one that works)
		lastError: text('last_error')
	},
	(table) => [index('notification_channels_user').on(table.userId)]
);

// Background tasks (reminders, clean-up, backup): schedule and result of the last run.
// Rows are created with default values when first needed (see server/scheduler.ts).
export const tasks = sqliteTable('tasks', {
	key: text('key').primaryKey(),
	enabled: integer('enabled', { mode: 'boolean' }).notNull(),
	frequency: text('frequency').$type<'hourly' | 'daily' | 'weekly' | 'monthly'>().notNull(),
	time: text('time').notNull(), // "HH:MM", time zone of the server (TZ)
	weekday: integer('weekday').notNull(), // 0 = Sunday, only used for "weekly"
	// When the schedule was last changed: times before that do not count as missed
	changedAt: integer('changed_at', { mode: 'timestamp' }).notNull(),
	lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
	lastDurationMs: integer('last_duration_ms'),
	// Disk space the last run freed (clean-up tasks only)
	lastFreedBytes: integer('last_freed_bytes'),
	lastError: text('last_error')
});
