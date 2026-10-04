import { eq } from 'drizzle-orm';
import type { Category } from '$lib/food/categories';
import { simplify, suggestCategory } from '$lib/food/dictionary';
import { getDb } from './db';
import { foodMemory } from './db/schema';

export type Memory = Record<string, { category: Category; icon: string | null }>;

// Everything the user has corrected so far, by simplified name – handed to the form, which
// suggests in the browser.
export function foodMemoryAll(): Memory {
	const rows = getDb().select().from(foodMemory).all();
	return Object.fromEntries(
		rows.map((row) => [row.name, { category: row.category, icon: row.icon }])
	);
}

// Remembers what was chosen for a name, if it differs from what the dictionary would say.
// Choosing the dictionary's suggestion again forgets the correction.
export function learnFood(name: string, category: Category, icon: string | null) {
	const key = simplify(name);
	if (!key) return;
	const db = getDb();
	if (category === suggestCategory(name) && !icon) {
		db.delete(foodMemory).where(eq(foodMemory.name, key)).run();
		return;
	}
	db.insert(foodMemory)
		.values({ name: key, category, icon })
		.onConflictDoUpdate({ target: foodMemory.name, set: { category, icon } })
		.run();
}
