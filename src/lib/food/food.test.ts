import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOCATIONS } from '$lib/items';
import { CATEGORIES, RATINGS, bestLocation, rating } from './categories';
import { simplify, suggestCategory, suggestIcon } from './dictionary';
import { CATEGORY_ICONS, ICONS, isIcon, lineFile } from './icons';
import { SHELF_LIFE, SOURCES, addDays, shelfLife, suggestDate } from './shelfLife';

describe('guessing the kind of food from its name', () => {
	it('knows common foods in German and English', () => {
		const expected: Record<string, string> = {
			Provolone: 'cheese_hard',
			Gouda: 'cheese_hard',
			Mozzarella: 'cheese_soft',
			Lachs: 'fish_raw',
			salmon: 'fish_raw',
			Garnelen: 'seafood',
			Rinderfilet: 'beef_raw',
			Schweinekotelett: 'pork_raw',
			Hähnchenbrust: 'poultry_raw',
			'chicken thighs': 'poultry_raw',
			Hackfleisch: 'minced',
			Salami: 'cured',
			Leberwurst: 'cold_cuts',
			Möhren: 'veg_raw',
			Brokkoli: 'veg_raw',
			Feldsalat: 'salad_herbs',
			Äpfel: 'fruit',
			Erdbeeren: 'berries',
			Brot: 'bread',
			Käsekuchen: 'cake',
			Reis: 'dry_goods',
			lentils: 'dry_goods',
			Kaffeebohnen: 'dry_goods',
			Tofu: 'plant_based',
			'vegane Wurst': 'plant_based',
			'veganes Hack': 'plant_based',
			Hafermilch: 'plant_based',
			Hummus: 'plant_based',
			Joghurt: 'dairy',
			Milch: 'dairy',
			Eier: 'eggs',
			Ei: 'eggs',
			Frikadellen: 'meat_cooked'
		};
		for (const [name, category] of Object.entries(expected)) {
			expect(suggestCategory(name), name).toBe(category);
		}
	});
	it('a dish is a dish, whatever is in it', () => {
		for (const name of [
			'Linsensuppe',
			'Rindergulasch',
			'Hähnchencurry',
			'Bolognese',
			'chicken soup'
		]) {
			expect(suggestCategory(name), name).toBe('leftovers');
		}
	});
	it('tells smoked and cooked from raw', () => {
		expect(suggestCategory('Räucherlachs')).toBe('fish_smoked');
		expect(suggestCategory('smoked salmon')).toBe('fish_smoked');
		expect(suggestCategory('gebratene Hähnchenbrust')).toBe('meat_cooked');
		expect(suggestCategory('pulled pork')).toBe('meat_cooked');
		expect(suggestCategory('Brokkoli blanchiert')).toBe('veg_cooked');
	});
	it('the longest matching word decides', () => {
		expect(suggestCategory('Preiselbeeren')).toBe('berries'); // not "reis"
		expect(suggestCategory('Käsekuchen')).toBe('cake'); // not "käse"
		expect(suggestCategory('Putenbrust Aufschnitt')).toBe('cold_cuts');
	});
	it('in a compound the last part says what it is', () => {
		expect(suggestCategory('Zwiebelkuchen')).toBe('cake');
		expect(suggestCategory('Erdbeerkuchen')).toBe('cake');
		expect(suggestCategory('Käsebrot')).toBe('bread');
		expect(suggestCategory('Fleischkäse')).toBe('cold_cuts');
		expect(suggestCategory('Rinderfilet')).toBe('beef_raw');
	});
	it('names of cuts only count when the animal is not named', () => {
		expect(suggestCategory('Putenschnitzel')).toBe('poultry_raw');
		expect(suggestCategory('Thunfischsteak')).toBe('fish_raw');
		expect(suggestCategory('Schnitzel')).toBe('pork_raw');
		expect(suggestCategory('Steak')).toBe('beef_raw');
		expect(suggestCategory('Wiener Schnitzel')).toBe('pork_raw');
	});
	it('very short words only count when they stand alone', () => {
		expect(suggestCategory('Teewurst')).toBe('cold_cuts'); // not "tee"
		expect(suggestCategory('Tee')).toBe('dry_goods');
	});
	it('ignores case, umlauts and punctuation', () => {
		expect(simplify('  Grüße, Käse-Soße! ')).toBe('grusse kase sosse');
		expect(suggestCategory('KÄSE')).toBe('cheese_hard');
		expect(suggestCategory('kaese')).toBe('other'); // written-out umlauts are not guessed
	});
	it('unknown names give "other"', () => {
		expect(suggestCategory('Dingsbums')).toBe('other');
		expect(suggestCategory('   ')).toBe('other');
	});
});

describe('places of storage', () => {
	it('every kind of food rates every place', () => {
		for (const category of CATEGORIES) {
			for (const location of LOCATIONS) expect(RATINGS[category][location]).toBeTruthy();
		}
	});
	it('raw fish never goes into the pantry and is best in the zero-degree zone', () => {
		expect(rating('fish_raw', 'pantry')).toBe('never');
		expect(rating('fish_raw', 'fridge')).toBe('bad');
		expect(bestLocation('fish_raw')).toBe('zero');
	});
	it('preselects the fridge where it is recommended, else the next good place', () => {
		expect(bestLocation('cheese_hard')).toBe('fridge');
		expect(bestLocation('bread')).toBe('pantry');
		expect(bestLocation('minced')).toBe('freezer');
		expect(bestLocation('other')).toBeNull();
	});
});

describe('guide values', () => {
	it('every value names a known source and is a positive number of days', () => {
		for (const category of CATEGORIES) {
			for (const location of LOCATIONS) {
				for (const value of Object.values(SHELF_LIFE[category][location])) {
					if (!value) continue;
					expect(value.days).toBeGreaterThan(0);
					expect(SOURCES[value.source]).toBeTruthy();
				}
			}
		}
	});
	it('a place has values exactly when it may be used (unknown food has none at all)', () => {
		for (const category of CATEGORIES) {
			for (const location of LOCATIONS) {
				const row = SHELF_LIFE[category][location];
				const usable = RATINGS[category][location] !== 'never' && category !== 'other';
				expect(row.open !== null, `${category}/${location}`).toBe(usable);
				expect(row.vacuum !== null, `${category}/${location}`).toBe(usable);
			}
		}
	});
	it('vacuum-sealed never keeps shorter than open, and colder never shorter than the fridge', () => {
		for (const category of CATEGORIES) {
			for (const location of LOCATIONS) {
				const row = SHELF_LIFE[category][location];
				if (row.open && row.vacuum) expect(row.vacuum.days).toBeGreaterThanOrEqual(row.open.days);
			}
			const { fridge, zero } = SHELF_LIFE[category];
			if (fridge.open && zero.open) expect(zero.open.days).toBeGreaterThanOrEqual(fridge.open.days);
		}
	});
	it('perishable food in the fridge stays within 10 days even when vacuum-sealed', () => {
		for (const category of [
			'fish_raw',
			'seafood',
			'beef_raw',
			'pork_raw',
			'poultry_raw',
			'minced',
			'meat_cooked',
			'cold_cuts',
			'leftovers',
			'veg_cooked'
		] as const) {
			expect(shelfLife(category, 'fridge', true)!.days, category).toBeLessThanOrEqual(10);
		}
	});
	it('raw fish, seafood, poultry and minced meat gain nothing from vacuum while chilled', () => {
		for (const category of ['fish_raw', 'seafood', 'poultry_raw', 'minced'] as const) {
			for (const location of ['fridge', 'zero'] as const) {
				expect(shelfLife(category, location, true)!.days, `${category}/${location}`).toBe(
					shelfLife(category, location, false)!.days
				);
			}
			// ... but they do in the freezer
			expect(shelfLife(category, 'freezer', true)!.days).toBeGreaterThan(
				shelfLife(category, 'freezer', false)!.days
			);
		}
	});
	it('raw fish and meat stay at one or two days in the fridge', () => {
		expect(shelfLife('fish_raw', 'fridge', false)!.days).toBe(1);
		expect(shelfLife('minced', 'fridge', false)!.days).toBe(1);
		expect(shelfLife('poultry_raw', 'fridge', false)!.days).toBe(1);
		expect(shelfLife('beef_raw', 'fridge', false)!.days).toBe(2);
		expect(shelfLife('pork_raw', 'fridge', false)!.days).toBe(2);
	});
	it('suggests a date from kind, place and vacuum', () => {
		expect(suggestDate('cheese_hard', 'fridge', false, '2026-10-04')).toBe('2026-10-18');
		expect(suggestDate('cheese_hard', 'fridge', true, '2026-10-04')).toBe('2026-11-03');
		expect(suggestDate('fish_raw', 'fridge', false, '2026-10-04')).toBe('2026-10-05');
		expect(suggestDate('fish_raw', 'pantry', false, '2026-10-04')).toBeNull(); // must not be used
		expect(suggestDate('other', 'fridge', false, '2026-10-04')).toBeNull(); // nothing known
	});
	it('counts days across months and years', () => {
		expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
		expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
	});
});

describe('symbols', () => {
	const icon = (name: string) => suggestIcon(name, suggestCategory(name));
	it('a food with a symbol of its own gets it, others that of their kind', () => {
		expect(icon('Bananen')).toBe('banana');
		expect(icon('Provolone')).toBe('cheese-wedge');
		expect(icon('Lachsfilet')).toBe('fish');
		expect(icon('Linsensuppe')).toBe('steaming-bowl');
		expect(icon('Zwiebelkuchen')).toBe('shortcake'); // a cake, not an onion
		expect(icon('Bananenbrot')).toBe('bread');
		expect(icon('Apfelmus')).toBe('red-apple');
		expect(icon('Hähnchenbrust')).toBe('poultry-leg');
		expect(icon('Butter')).toBe('butter'); // has a symbol although its kind is unknown
		expect(icon('Dingsbums')).toBe('fork-and-knife-with-plate');
	});
	it('every kind of food has a symbol from the list', () => {
		for (const key of Object.values(CATEGORY_ICONS)) expect(isIcon(key)).toBe(true);
	});
	it('every symbol has its file in both styles (made by scripts/food-icons.mjs)', () => {
		for (const key of ICONS) {
			expect(existsSync(`static/food/color/${key}.svg`), key).toBe(true);
			expect(existsSync(`static/food/line/${lineFile(key)}.svg`), key).toBe(true);
		}
	});
});
