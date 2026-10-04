// Kinds of food. The kind decides which places of storage suit it and how long it keeps there
// (see shelfLife.ts). Raw and prepared are separate kinds where that makes a difference.
import type { Location } from '$lib/items';

export const CATEGORIES = [
	'fish_raw',
	'fish_smoked',
	'seafood',
	'beef_raw',
	'pork_raw',
	'poultry_raw',
	'minced',
	'meat_cooked',
	'cold_cuts',
	'cured',
	'cheese_hard',
	'cheese_soft',
	'dairy',
	'eggs',
	'plant_based',
	'veg_raw',
	'veg_cooked',
	'salad_herbs',
	'fruit',
	'berries',
	'bread',
	'cake',
	'leftovers',
	'dry_goods',
	'other'
] as const;
export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
	return (CATEGORIES as readonly unknown[]).includes(value);
}

// How well a place of storage suits a kind of food:
// good = recommended, ok = possible, bad = not recommended, never = must not be chosen.
export type Rating = 'good' | 'ok' | 'bad' | 'never';

// Order: pantry, fridge, zero-degree zone, freezer
const R = (pantry: Rating, fridge: Rating, zero: Rating, freezer: Rating) => ({
	pantry,
	fridge,
	zero,
	freezer
});

export const RATINGS: Record<Category, Record<Location, Rating>> = {
	fish_raw: R('never', 'bad', 'good', 'good'),
	fish_smoked: R('never', 'good', 'good', 'ok'),
	seafood: R('never', 'bad', 'good', 'good'),
	beef_raw: R('never', 'ok', 'good', 'good'),
	pork_raw: R('never', 'ok', 'good', 'good'),
	poultry_raw: R('never', 'bad', 'good', 'good'),
	minced: R('never', 'bad', 'ok', 'good'),
	meat_cooked: R('never', 'good', 'good', 'good'),
	cold_cuts: R('never', 'good', 'good', 'ok'),
	cured: R('ok', 'good', 'good', 'bad'),
	cheese_hard: R('never', 'good', 'ok', 'bad'),
	cheese_soft: R('never', 'good', 'ok', 'bad'),
	dairy: R('never', 'good', 'good', 'bad'),
	eggs: R('bad', 'good', 'ok', 'never'),
	plant_based: R('never', 'good', 'good', 'good'),
	veg_raw: R('ok', 'good', 'good', 'good'),
	veg_cooked: R('never', 'good', 'good', 'good'),
	salad_herbs: R('never', 'good', 'good', 'never'),
	fruit: R('ok', 'good', 'good', 'good'),
	berries: R('never', 'good', 'good', 'good'),
	bread: R('good', 'bad', 'bad', 'good'),
	cake: R('ok', 'good', 'ok', 'good'),
	leftovers: R('never', 'good', 'good', 'good'),
	dry_goods: R('good', 'ok', 'ok', 'ok'),
	// Nothing is known about it: every place is possible, no date is suggested
	other: R('ok', 'ok', 'ok', 'ok')
};

export function rating(category: Category, location: Location): Rating {
	return RATINGS[category][location];
}

// The place preselected for a kind of food: the first recommended one in the order of everyday
// use (fridge before the zero-degree zone, which not every household has).
const PREFERENCE: Location[] = ['fridge', 'zero', 'pantry', 'freezer'];
export function bestLocation(category: Category): Location | null {
	if (category === 'other') return null;
	return PREFERENCE.find((location) => RATINGS[category][location] === 'good') ?? null;
}
