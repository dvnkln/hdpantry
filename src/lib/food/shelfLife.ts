// Guide values: how many days a kind of food keeps in a place of storage, open or
// vacuum-sealed. THESE ARE ESTIMATES, NOT GUARANTEES – food has to be checked before eating.
//
// How the values were chosen:
//  - German public bodies first (BVL, BZfE, BMEL), the USDA FoodKeeper data where they give no
//    figure. Where a source gives a range, its lower end is used; of two figures the more
//    cautious one.
//  - No public body publishes figures for the zero-degree zone or for food vacuum-sealed at
//    home. Those values are our own cautious estimates ('est', 'vac'): the zero-degree zone
//    about one and a half times the fridge for fresh food, vacuum about twice the open value
//    and never more than 10 days for perishable food in the fridge.
//  - Raw fish, seafood, poultry and minced meat get NO extra time from vacuum-sealing while
//    chilled: germs that matter there do not need air, and some grow better without it. The
//    vacuum only helps them in the freezer (no freezer burn).
//
// To change a value, change it here; every value names its source.
import type { Location } from '$lib/items';
import { RATINGS, type Category } from './categories';

export const SOURCES = {
	bvl: {
		name: 'Bundesamt für Verbraucherschutz und Lebensmittelsicherheit (BVL): Lebensmittel richtig lagern',
		url: 'https://www.bvl.bund.de/DE/Arbeitsbereiche/01_Lebensmittel/03_Verbraucher/03_UmgangLM/01_LMkonservierenLagern/01_Lagerung/lm_lagerung_node.html'
	},
	bzfe: {
		name: 'Bundeszentrum für Ernährung (BZfE): Lagerung',
		url: 'https://www.bzfe.de/einfache-sprache/kochen-und-aufbewahren/lagerung'
	},
	bmel: {
		name: 'Bundesministerium für Ernährung und Landwirtschaft, „Zu gut für die Tonne!“: Richtig lagern',
		url: 'https://www.zugutfuerdietonne.de/tipps-fuer-zu-hause/richtig-lagern'
	},
	huw: {
		name: 'Klingshirn et al. (2025): Gefrierlagerung und Verbraucherverhalten. Hauswirtschaft und Wissenschaft (Höchstlagerdauern nach BZfE)',
		url: 'https://haushalt-wissenschaft.de/wp-content/uploads/2025/01/HUW_10_2024_Klingshirn_Gefrierlagerung.pdf'
	},
	bfr: {
		name: 'Bundesinstitut für Risikobewertung (BfR): Fragen und Antworten zu verdorbenem Fleisch',
		url: 'https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zu-verdorbenem-fleisch/'
	},
	vz: {
		name: 'Verbraucherzentrale: Fleisch – das müssen Sie bei Haltbarkeit und Lagerung beachten',
		url: 'https://www.verbraucherzentrale.de/wissen/lebensmittel/auswaehlen-zubereiten-aufbewahren/fleisch-das-muessen-sie-bei-haltbarkeit-und-lagerung-beachten-58928'
	},
	usda: {
		name: 'U.S. Department of Agriculture, Food Safety and Inspection Service: FoodKeeper data (public domain)',
		url: 'https://catalog.data.gov/dataset/fsis-foodkeeper-data'
	},
	est: { name: 'Own cautious estimate, derived from the value for the fridge', url: null },
	vac: {
		name: 'Own cautious estimate for vacuum-sealed food (no public body publishes such figures)',
		url: null
	}
} as const;
export type SourceKey = keyof typeof SOURCES;

export type Value = { days: number; source: SourceKey };
type Row = { open: Value | null; vacuum: Value | null };

// days open (source), days vacuum-sealed (source 'vac' unless given)
const v = (
	open: number,
	source: SourceKey,
	vacuum: number,
	vacuumSource: SourceKey = 'vac'
): Row => ({
	open: { days: open, source },
	vacuum: { days: vacuum, source: vacuumSource }
});
const none: Row = { open: null, vacuum: null };

export const SHELF_LIFE: Record<Category, Record<Location, Row>> = {
	// BVL and Verbraucherzentrale: fresh fish one day at most, at 4 °C or colder (USDA: 1–2 days).
	// USDA: fatty fish 2–3 months frozen (BZfE: fish 6–9 months).
	fish_raw: {
		pantry: none,
		fridge: v(1, 'bvl', 1),
		zero: v(2, 'est', 2),
		freezer: v(90, 'usda', 180)
	},
	// USDA: smoked fish 14 days and more, vacuum-packed 21 days and more. BZfE: fish 6–9 months frozen.
	fish_smoked: {
		pantry: none,
		fridge: v(14, 'usda', 21, 'usda'),
		zero: v(14, 'est', 21),
		freezer: v(180, 'bzfe', 270)
	},
	// BVL as for fish (USDA: 1–3 days). USDA: crab meat 2–4 months frozen.
	seafood: {
		pantry: none,
		fridge: v(1, 'bvl', 1),
		zero: v(2, 'est', 2),
		freezer: v(60, 'usda', 120)
	},
	// BVL and Verbraucherzentrale: meat 1–2 days (USDA: 3–5 days; BfR: whole pieces keep clearly
	// longer at 2–4 °C). BfR: beef 9–18 months frozen, BZfE: 9–12 months.
	beef_raw: {
		pantry: none,
		fridge: v(2, 'bvl', 4),
		zero: v(3, 'est', 6),
		freezer: v(270, 'bfr', 540)
	},
	// BfR: pork 6–9 months frozen (BZfE: fatty meat 6–9 months).
	pork_raw: {
		pantry: none,
		fridge: v(2, 'bvl', 4),
		zero: v(3, 'est', 6),
		freezer: v(180, 'bfr', 360)
	},
	// Verbraucherzentrale: poultry 1–2 days at 4 °C or colder (USDA: 1–2 days).
	// BZfE: poultry 9–12 months frozen.
	poultry_raw: {
		pantry: none,
		fridge: v(1, 'vz', 1),
		zero: v(2, 'est', 2),
		freezer: v(270, 'bzfe', 540)
	},
	// BfR: use minced meat on the day of purchase or the day after at the latest; it spoils
	// after two days (USDA: 1–2 days). USDA: 3–4 months frozen.
	minced: {
		pantry: none,
		fridge: v(1, 'bfr', 1),
		zero: v(1, 'est', 1),
		freezer: v(90, 'usda', 180)
	},
	// Verbraucherzentrale: cooked meat 2–3 days (USDA: 3–4 days). USDA: 2–3 months frozen.
	meat_cooked: {
		pantry: none,
		fridge: v(2, 'vz', 4),
		zero: v(3, 'est', 6),
		freezer: v(60, 'usda', 120)
	},
	// BVL: sausages 1–2 days. USDA: luncheon meat 1–2 months frozen.
	cold_cuts: {
		pantry: none,
		fridge: v(2, 'bvl', 5),
		zero: v(3, 'est', 7),
		freezer: v(30, 'usda', 60)
	},
	// USDA: hard, dry sausage 2–3 weeks, 1–2 months frozen.
	cured: {
		pantry: v(7, 'est', 14),
		fridge: v(14, 'usda', 30),
		zero: v(14, 'est', 30),
		freezer: v(30, 'usda', 60)
	},
	// BMEL: cheese in one piece 2–3 weeks. Paper: dairy products 2–4 months frozen.
	cheese_hard: {
		pantry: none,
		fridge: v(14, 'bmel', 30),
		zero: v(14, 'est', 30),
		freezer: v(60, 'huw', 120)
	},
	// BVL: fresh cheese about three days.
	cheese_soft: {
		pantry: none,
		fridge: v(3, 'bvl', 6),
		zero: v(3, 'est', 6),
		freezer: v(60, 'huw', 120)
	},
	// Opened milk and cream. USDA: cream 3–4 days. Paper: dairy products 2–4 months frozen.
	dairy: {
		pantry: none,
		fridge: v(3, 'usda', 6),
		zero: v(4, 'est', 8),
		freezer: v(60, 'huw', 120)
	},
	// USDA: eggs in the shell 3–5 weeks in the fridge. Sealing does not change that.
	eggs: {
		pantry: v(7, 'est', 7),
		fridge: v(21, 'usda', 21),
		zero: v(21, 'est', 21),
		freezer: none
	},
	// USDA: tofu one week, prepared soy protein 3–4 days; tofu 5 months frozen.
	plant_based: {
		pantry: none,
		fridge: v(3, 'usda', 6),
		zero: v(4, 'est', 8),
		freezer: v(150, 'usda', 300)
	},
	// USDA: broccoli, beans, cauliflower 3–5 days; vegetables 8–12 months frozen.
	veg_raw: {
		pantry: v(3, 'est', 5),
		fridge: v(3, 'usda', 7),
		zero: v(5, 'est', 10),
		freezer: v(240, 'usda', 480)
	},
	// USDA: leftovers without meat 3–4 days, 1–2 months frozen.
	veg_cooked: {
		pantry: none,
		fridge: v(3, 'usda', 6),
		zero: v(4, 'est', 8),
		freezer: v(30, 'usda', 60)
	},
	// USDA: leafy greens 1–4 days. BZfE: lettuce should not be frozen.
	salad_herbs: { pantry: none, fridge: v(2, 'usda', 4), zero: v(3, 'est', 6), freezer: none },
	// USDA: peaches, pears, plums 3–5 days; apples 8 months frozen.
	fruit: {
		pantry: v(3, 'est', 5),
		fridge: v(5, 'usda', 10),
		zero: v(7, 'est', 14),
		freezer: v(240, 'usda', 480)
	},
	// USDA: berries 3–6 days. Paper: fruit 10–24 months frozen. BVL: berries belong in the fridge.
	berries: {
		pantry: none,
		fridge: v(3, 'usda', 6),
		zero: v(4, 'est', 8),
		freezer: v(300, 'huw', 600)
	},
	// BVL: wheat bread about two days. Paper: baked goods 1–6 months frozen.
	bread: {
		pantry: v(2, 'bvl', 4),
		fridge: v(4, 'est', 8),
		zero: v(4, 'est', 8),
		freezer: v(30, 'huw', 60)
	},
	// USDA: pies 3–4 days in the fridge.
	cake: {
		pantry: v(2, 'est', 4),
		fridge: v(3, 'usda', 6),
		zero: v(3, 'est', 6),
		freezer: v(30, 'huw', 60)
	},
	// BMEL: cooked pasta 1–2 days. Paper: leftovers 1–6 months frozen.
	leftovers: {
		pantry: none,
		fridge: v(2, 'bmel', 4),
		zero: v(3, 'est', 6),
		freezer: v(30, 'huw', 60)
	},
	// USDA: flour 6–12 months, rice and pasta longer.
	dry_goods: {
		pantry: v(180, 'usda', 360),
		fridge: v(180, 'est', 360),
		zero: v(180, 'est', 360),
		freezer: v(180, 'est', 360)
	},
	other: { pantry: none, fridge: none, zero: none, freezer: none }
};

// The guide value for a kind of food in a place, or null if there is none (unknown kind) or
// the place must not be used.
export function shelfLife(category: Category, location: Location, vacuumed: boolean): Value | null {
	if (RATINGS[category][location] === 'never') return null;
	const row = SHELF_LIFE[category][location];
	return vacuumed ? row.vacuum : row.open;
}

// YYYY-MM-DD plus a number of days
export function addDays(date: string, days: number) {
	const [year, month, day] = date.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

// The suggested best-before date for food stored from `from` (YYYY-MM-DD) on, or null.
export function suggestDate(
	category: Category,
	location: Location,
	vacuumed: boolean,
	from: string
) {
	const value = shelfLife(category, location, vacuumed);
	return value ? addDays(from, value.days) : null;
}
