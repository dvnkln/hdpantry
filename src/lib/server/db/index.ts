import { mkdirSync } from 'node:fs';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import { DATA_DIR, DB_PATH, MIGRATIONS_DIR } from '../config';

// $client: the underlying better-sqlite3 connection.
let instance: (BetterSQLite3Database<typeof schema> & { $client: Database.Database }) | undefined;

// Opens the database on first use (not at import time, so `vite build` never touches it).
export function getDb() {
	if (!instance) {
		mkdirSync(DATA_DIR, { recursive: true });
		const client = new Database(DB_PATH);
		client.pragma('journal_mode = WAL');
		client.pragma('foreign_keys = ON');
		instance = drizzle(client, { schema });
	}
	return instance;
}

// Applies all pending migrations from the drizzle/ folder. Called once at server start.
// Some migrations build a table anew (SQLite cannot change a column in place). With the links
// between tables switched on, dropping the old table would take every row that points to it
// along (e.g. which reminders were already sent) – and inside the transaction of the migration
// they cannot be switched off. So they are off while migrating and checked afterwards, as
// SQLite advises for this.
export function runMigrations() {
	applyMigrations(getDb(), MIGRATIONS_DIR);
}

export function applyMigrations(
	db: BetterSQLite3Database<typeof schema> & { $client: Database.Database },
	folder: string
) {
	db.$client.pragma('foreign_keys = OFF');
	try {
		migrate(db, { migrationsFolder: folder });
		const broken = db.$client.pragma('foreign_key_check') as unknown[];
		if (broken.length) throw new Error(`Migration left ${broken.length} broken links`);
	} finally {
		db.$client.pragma('foreign_keys = ON');
	}
}
