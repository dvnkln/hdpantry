import { sql } from 'drizzle-orm';
import {
	check,
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import type { CodeSource } from '../../containers';
import type { Category } from '../../food/categories';
import type { FillLevel, Location, Unit } from '../../items';
import type { PackShape } from '../../products';
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
		// How the code was first read ('camera', 'photo', 'manual', 'printed'); empty = not recorded
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

// A bought product, known by its barcode (or by its name only, for one without a code). What
// the app learned about it is kept here; its packs in stock are `items`.
export const products = sqliteTable('products', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	// EAN-13 / EAN-8 (see parseProductCode); empty = recorded without a code
	barcode: text('barcode').unique(),
	name: text('name').notNull(),
	// A note about the product (e.g. "for guests"), shown with it
	note: text('note'),
	// How it is packed (see PACK_SHAPES in $lib/products); empty = a box
	shape: text('shape').$type<PackShape>(),
	category: text('category').$type<Category>(),
	icon: text('icon'),
	// Where its packs are usually kept – preselected for the next one
	location: text('location').$type<Location>().notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// What the product database answered for a barcode (see server/lookup.ts), so it is asked once
// per barcode only. `found` false: it does not know the product.
export const productLookups = sqliteTable('product_lookups', {
	barcode: text('barcode').primaryKey(),
	found: integer('found', { mode: 'boolean' }).notNull(),
	name: text('name'),
	// Who makes it ('' = not known; empty = asked before the maker was taken, ask again)
	brand: text('brand'),
	// Description and kinds of the product, the most telling first, one per line
	hints: text('hints'),
	frozen: integer('frozen', { mode: 'boolean' }).notNull().default(false),
	// How it is packed, if the database says one thing only
	shape: text('shape').$type<PackShape>(),
	lookedAt: integer('looked_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// What is (or was) in a container – or one pack of a product. Content that was eaten is not
// deleted but gets `removedAt`, so every container and product keeps its history.
export const items = sqliteTable(
	'items',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		// Exactly one of the two is set
		containerId: integer('container_id').references(() => containers.id, { onDelete: 'cascade' }),
		productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		note: text('note'),
		vacuumed: integer('vacuumed', { mode: 'boolean' }).notNull(),
		location: text('location').$type<Location>().notNull(),
		// Best before, YYYY-MM-DD; empty = no date
		bestBefore: text('best_before'),
		// Only month and year were given (as printed on many packs): `bestBefore` is then the
		// last day of that month
		dateMonth: integer('date_month', { mode: 'boolean' }).notNull().default(false),
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
		// The day the content went in, YYYY-MM-DD, if it is not the day it was recorded
		// (something that has been in the freezer for a while); empty = the day of created_at
		storedOn: text('stored_on'),
		// Empty = still in the container
		removedAt: integer('removed_at', { mode: 'timestamp' })
	},
	(table) => [
		index('items_container_idx').on(table.containerId),
		index('items_product_idx').on(table.productId),
		// A container holds one thing at a time
		uniqueIndex('items_active_idx')
			.on(table.containerId)
			.where(sql`${table.removedAt} is null`),
		check(
			'items_belongs_to_one',
			sql`(${table.containerId} is null) <> (${table.productId} is null)`
		)
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
