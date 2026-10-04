// What can be recorded about the content of a container – shared by the form in the browser
// and the checks on the server.
import { isCategory, rating, type Category } from './food/categories';

export const LOCATIONS = ['pantry', 'fridge', 'zero', 'freezer'] as const;
export type Location = (typeof LOCATIONS)[number];

export const FILL_LEVELS = ['low', 'medium', 'full'] as const;
export type FillLevel = (typeof FILL_LEVELS)[number];

export const UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'servings'] as const;
export type Unit = (typeof UNITS)[number];

export const MAX_ITEM_NAME = 80;
export const MAX_ITEM_NOTE = 300;
export const MAX_AMOUNT = 99999;
export const MAX_ICON_NAME = 40;

export type ItemValues = {
	name: string;
	note: string | null;
	vacuumed: boolean;
	location: Location;
	// Best before, YYYY-MM-DD; null = no date
	bestBefore: string | null;
	// The date was typed by hand, not suggested
	dateManual: boolean;
	// Kind of food ('other' = not known) and its symbol
	category: Category;
	icon: string | null;
	fill: FillLevel;
	// How much is inside, optional. Both are set or both are null.
	amount: number | null;
	unit: Unit | null;
};

export type ItemProblem = 'name' | 'location' | 'date' | 'fill' | 'amount';

// A real calendar day in the form YYYY-MM-DD
export function isDate(text: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
	const date = new Date(`${text}T00:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

function isUnit(value: string): value is Unit {
	return (UNITS as readonly string[]).includes(value);
}

// kg and l are given with decimals, everything else in whole numbers
function decimalsOf(unit: Unit) {
	return unit === 'kg' || unit === 'l' ? 2 : 0;
}

// The fill level counts in thirds: low = 1/3, medium = 2/3, full = 3/3. Moving the slider
// changes the amount accordingly, starting from the amount last typed in (`base`) and the
// level it was typed at.
export function scaleAmount(
	base: { amount: number; level: FillLevel },
	level: FillLevel,
	unit: Unit
) {
	if (level === base.level) return base.amount;
	const thirds = (l: FillLevel) => FILL_LEVELS.indexOf(l) + 1;
	const factor = 10 ** decimalsOf(unit);
	const scaled = Math.round(((base.amount * thirds(level)) / thirds(base.level)) * factor) / factor;
	return Math.max(scaled, 1 / factor); // never down to nothing
}

function oneLine(value: FormDataEntryValue | null, max: number) {
	return String(value ?? '')
		.trim()
		.replace(/\s+/g, ' ')
		.slice(0, max);
}

// Reads the form. Returns the values, or which field is wrong.
export function readItemForm(
	data: FormData
): { values: ItemValues; problem?: undefined } | { problem: ItemProblem; values?: undefined } {
	const name = oneLine(data.get('name'), MAX_ITEM_NAME);
	if (!name) return { problem: 'name' };

	const categoryText = String(data.get('category') ?? '');
	const category: Category = isCategory(categoryText) ? categoryText : 'other';

	const location = String(data.get('location') ?? '');
	if (!(LOCATIONS as readonly string[]).includes(location)) return { problem: 'location' };
	// A place that must not be used for this kind of food
	if (rating(category, location as Location) === 'never') return { problem: 'location' };

	const date = String(data.get('bestBefore') ?? '').trim();
	if (date && !isDate(date)) return { problem: 'date' };

	const fill = String(data.get('fill') ?? '');
	if (!(FILL_LEVELS as readonly string[]).includes(fill)) return { problem: 'fill' };

	// "1,5" and "1.5" both mean one and a half
	const amountText = String(data.get('amount') ?? '')
		.trim()
		.replace(',', '.');
	let amount: number | null = null;
	let unit: Unit | null = null;
	if (amountText) {
		const unitText = String(data.get('unit') ?? '');
		amount = Math.round(Number(amountText) * 100) / 100;
		if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT || !isUnit(unitText)) {
			return { problem: 'amount' };
		}
		unit = unitText;
	}

	return {
		values: {
			name,
			note: oneLine(data.get('note'), MAX_ITEM_NOTE) || null,
			vacuumed: data.get('vacuumed') !== null,
			location: location as Location,
			bestBefore: date || null,
			dateManual: data.get('dateManual') === '1',
			category,
			icon: oneLine(data.get('icon'), MAX_ICON_NAME) || null,
			fill: fill as FillLevel,
			amount,
			unit
		}
	};
}
