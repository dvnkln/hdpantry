import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { afterAll, expect, it } from 'vitest';
import { applyMigrations } from '.';
import * as schema from './schema';

const dir = mkdtempSync(join(tmpdir(), 'hdpantry-migrate-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

// The migrations folder as it was up to (and including) migration number `last`
function folderUpTo(last: number) {
	const folder = join(dir, `upto-${last}`);
	cpSync('drizzle', folder, { recursive: true });
	const journalPath = join(folder, 'meta', '_journal.json');
	const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
	journal.entries = journal.entries.filter((entry: { idx: number }) => entry.idx <= last);
	writeFileSync(journalPath, JSON.stringify(journal));
	return folder;
}

it('keeps contents, history and sent reminders when products are added (0002)', () => {
	const client = new Database(join(dir, 'old.db'));
	client.pragma('foreign_keys = ON');
	const db = drizzle(client, { schema });
	applyMigrations(db, folderUpTo(1));

	// A stock as version 0.2 kept it
	client.exec(`
		insert into users (id, username, password_hash, created_at) values (1, 'demo', 'x', 0);
		insert into containers (id, code, raw_content, manual, created_at) values (1, 'AB12', 'AB12', 1, 0);
		insert into items (id, container_id, name, vacuumed, location, best_before, date_manual, fill, created_at, removed_at)
			values (1, 1, 'Soup', 0, 'fridge', '2026-01-01', 0, 'full', 0, 5),
			       (2, 1, 'Stew', 1, 'freezer', '2026-03-01', 1, 'medium', 6, null);
		insert into notifications_sent (user_id, item_id, kind, date) values (1, 2, 'soon', '2026-03-01');
	`);

	applyMigrations(db, 'drizzle');

	const rows = client.prepare('select * from items order by id').all() as Record<string, unknown>[];
	expect(rows.map((r) => [r.id, r.container_id, r.product_id, r.name, r.date_month])).toEqual([
		[1, 1, null, 'Soup', 0],
		[2, 1, null, 'Stew', 0]
	]);
	expect(client.prepare('select count(*) as n from notifications_sent').get()).toEqual({ n: 1 });
	// Links and rules are in force again
	expect(client.pragma('foreign_keys', { simple: true })).toBe(1);
	expect(() =>
		client.exec(
			`insert into items (name, vacuumed, location, fill, created_at) values ('Nowhere', 0, 'fridge', 'full', 0)`
		)
	).toThrow(/CHECK/);
	expect(() =>
		client.exec(
			`insert into items (container_id, name, vacuumed, location, fill, created_at, removed_at) values (1, 'Second', 0, 'fridge', 'full', 0, null)`
		)
	).toThrow(/UNIQUE/);
	client.close();
});

it('takes the maker out of names looked up before (0007)', () => {
	const client = new Database(join(dir, 'brand.db'));
	const db = drizzle(client, { schema });
	applyMigrations(db, folderUpTo(6));

	// Names as version 0.3 suggested them: the maker in brackets behind the food
	client.exec(`
		insert into product_lookups (barcode, found, name, brand, frozen, looked_at) values
			('9991234567890', 1, 'Nut mix', 'QUIXO', 0, 0),
			('9990000000017', 1, 'Quixo crisps', 'Quixo', 0, 0),
			('9990000000024', 0, null, '', 0, 0);
		insert into products (id, barcode, name, location, created_at) values
			(1, '9991234567890', 'Nut mix (QUIXO)', 'pantry', 0),
			(2, '9990000000017', 'Quixo crisps', 'pantry', 0),
			(3, '9990000000024', 'Bread', 'pantry', 0),
			(4, null, 'Jam (Quixo)', 'pantry', 0);
		insert into items (id, product_id, name, vacuumed, location, date_manual, fill, created_at, removed_at)
			values (1, 1, 'Nut mix (QUIXO)', 0, 'pantry', 1, 'full', 0, null),
			       (2, 1, 'Nuts (QUIXO)', 0, 'pantry', 1, 'full', 0, 5);
	`);

	applyMigrations(db, 'drizzle');

	const products = client.prepare('select id, name, brand from products order by id').all();
	expect(products).toEqual([
		{ id: 1, name: 'Nut mix', brand: 'QUIXO' },
		{ id: 2, name: 'Quixo crisps', brand: 'Quixo' },
		{ id: 3, name: 'Bread', brand: null },
		// Typed by hand: left as it is
		{ id: 4, name: 'Jam (Quixo)', brand: null }
	]);
	// Packs called like the product follow it; one eaten under another name keeps that
	expect(client.prepare('select name from items order by id').all()).toEqual([
		{ name: 'Nut mix' },
		{ name: 'Nuts (QUIXO)' }
	]);
	client.close();
});
