// What can be recorded about a bought product and its packs – shared by the forms in the
// browser and the checks on the server.
import { isCategory, type Category } from './food/categories';
import { suggestCategory, suggestIcon } from './food/dictionary';
import {
	LOCATIONS,
	MAX_ICON_NAME,
	MAX_ITEM_NAME,
	MAX_ITEM_NOTE,
	isDate,
	oneLine,
	type Location
} from './items';

// At most this many packs are added at once
export const MAX_PACKS = 20;

export type ProductValues = {
	name: string;
	// Who makes it, as typed (the server makes the spelling match, see tidyBrand)
	brand: string | null;
	note: string | null;
	shape: PackShape;
	// Kind of food ('other' = not known) and its symbol
	category: Category;
	icon: string | null;
};

export type PackValues = {
	// Best before, YYYY-MM-DD; null = no date
	bestBefore: string | null;
	// Only month and year were given: `bestBefore` is the last day of that month
	dateMonth: boolean;
	location: Location;
	count: number;
	// The day they went in, YYYY-MM-DD; null (or left out) = the day they are recorded
	storedOn?: string | null;
};

export type PackProblem = 'name' | 'location' | 'date' | 'count' | 'since';

// The last day of a month ("2027-03" → "2027-03-31"): what a date printed as month and year
// means – the pack keeps until the month is over.
export function endOfMonth(month: string) {
	const [year, number] = month.split('-').map(Number);
	const last = new Date(Date.UTC(year, number, 0)).getUTCDate();
	return `${month}-${String(last).padStart(2, '0')}`;
}

// A best-before date as typed: "YYYY-MM" (month and year) or "YYYY-MM-DD"
export function readPackDate(text: string): { bestBefore: string; dateMonth: boolean } | null {
	if (/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) {
		return { bestBefore: endOfMonth(text), dateMonth: true };
	}
	return isDate(text) ? { bestBefore: text, dateMonth: false } : null;
}

// A brand is at most this long
export const MAX_BRAND = 40;

// One maker, one spelling: the product database writes the same maker in capitals for one
// product and not for the next. Brands are compared without regard to case …
export function brandKey(brand: string) {
	return brand.normalize('NFC').toLowerCase();
}

// … capitals throughout are softened ("QUIXO FOODS" → "Quixo Foods"; short ones such as "XL"
// stay) …
function shouting(brand: string) {
	const letters = brand.match(/\p{L}/gu) ?? [];
	return letters.length > 3 && brand === brand.toUpperCase() && brand !== brand.toLowerCase();
}
function softened(brand: string) {
	return brand
		.toLowerCase()
		.replace(/(^|[\s\-/&.(])(\p{L})/gu, (_, before: string, letter: string) => {
			return before + letter.toUpperCase();
		});
}

// … and a maker known already keeps the spelling it has (`known`: the brands in use).
// Returns null for no brand.
export function tidyBrand(typed: string | null, known: readonly string[]): string | null {
	const brand = (typed ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_BRAND).trim();
	if (!brand) return null;
	const same = known.find((k) => brandKey(k) === brandKey(brand));
	if (same) return same;
	return shouting(brand) ? softened(brand) : brand;
}

// The one spelling for brands written in several ways (old data, an imported file): the first
// that is not in capitals throughout, else the first softened
export function oneSpelling(spellings: readonly string[]) {
	return spellings.find((s) => !shouting(s)) ?? softened(spellings[0]);
}

// Name, kind of food and symbol of a product (when it is recorded or renamed)
export function readProductForm(
	data: FormData
): { values: ProductValues; problem?: undefined } | { problem: 'name'; values?: undefined } {
	const name = oneLine(data.get('name'), MAX_ITEM_NAME);
	if (!name) return { problem: 'name' };
	const categoryText = String(data.get('category') ?? '');
	return {
		values: {
			name,
			brand: oneLine(data.get('brand'), MAX_BRAND) || null,
			note: oneLine(data.get('note'), MAX_ITEM_NOTE) || null,
			shape: isPackShape(data.get('shape')) ? (data.get('shape') as PackShape) : 'box',
			category: isCategory(categoryText) ? categoryText : 'other',
			icon: oneLine(data.get('icon'), MAX_ICON_NAME) || null
		}
	};
}

// Date, place and number of new packs. `today` (YYYY-MM-DD): they cannot have gone in later.
export function readPackForm(
	data: FormData,
	today: string
): { values: PackValues; problem?: undefined } | { problem: PackProblem; values?: undefined } {
	const location = String(data.get('location') ?? '');
	// No place is locked for a bought product: the maker says how it keeps (frozen spinach is
	// fine in the freezer, fresh spinach is not) – unlike what is put into a container
	if (!(LOCATIONS as readonly string[]).includes(location)) return { problem: 'location' };

	const dateText = String(data.get('bestBefore') ?? '').trim();
	const date = dateText ? readPackDate(dateText) : null;
	if (dateText && !date) return { problem: 'date' };

	const countText = String(data.get('count') ?? '1').trim();
	const count = /^\d+$/.test(countText) ? Number(countText) : NaN;
	if (!(count >= 1 && count <= MAX_PACKS)) return { problem: 'count' };

	const storedOn = String(data.get('storedOn') ?? '').trim();
	if (storedOn && (!isDate(storedOn) || storedOn > today)) return { problem: 'since' };

	return {
		values: {
			bestBefore: date?.bestBefore ?? null,
			dateMonth: date?.dateMonth ?? false,
			location: location as Location,
			count,
			// Today is the default: then nothing is stored (the day of recording counts)
			storedOn: storedOn && storedOn !== today ? storedOn : null
		}
	};
}

// Packs of a product with the same date and place, as they are corrected under "edit": how
// many there should be, and their date and place. `ids`: the packs the group stood for.
export type PackGroup = {
	ids: number[];
	count: number;
	bestBefore: string | null;
	dateMonth: boolean;
	location: Location;
};

// The corrected groups as sent by the form (JSON in the field `packs`). Returns null if anything
// in it is wrong – nothing is changed then.
export function readPackGroups(text: string): PackGroup[] | null {
	let data: unknown;
	try {
		data = JSON.parse(text || '[]');
	} catch {
		return null;
	}
	if (!Array.isArray(data) || data.length > 100) return null;
	const groups: PackGroup[] = [];
	for (const entry of data) {
		if (typeof entry !== 'object' || entry === null) return null;
		const { ids, count, bestBefore, location } = entry as Record<string, unknown>;
		if (!Array.isArray(ids) || !ids.every((id) => Number.isInteger(id) && id > 0)) return null;
		if (!Number.isInteger(count) || (count as number) < 0 || (count as number) > MAX_PACKS) {
			return null;
		}
		if (!(LOCATIONS as readonly unknown[]).includes(location)) return null;
		const date = bestBefore ? readPackDate(String(bestBefore)) : null;
		if (bestBefore && !date) return null;
		groups.push({
			ids: ids as number[],
			count: count as number,
			bestBefore: date?.bestBefore ?? null,
			dateMonth: date?.dateMonth ?? false,
			location: location as Location
		});
	}
	return groups;
}

// What the product database knows about a barcode (see server/lookup.ts): a name to suggest,
// description and kinds of the product as hints for its kind of food, and whether it is frozen
export type Lookup = {
	name: string | null;
	// Who makes it, if known
	brand: string | null;
	hints: string[];
	frozen: boolean;
	// How it is packed, if the database says one thing only
	shape: PackShape | null;
};

// The name suggested for a product the database knows. Who makes it goes into its own field.
export function suggestedName(lookup: Lookup | null) {
	const name = lookup?.name?.trim();
	return name ? name.slice(0, MAX_ITEM_NAME).trim() : null;
}

// Words on a pack (or in its name) that say it is sold frozen. Then the freezer is suggested,
// whatever the kind of food says about fresh food of that kind.
const FROZEN =
	/(^|[^a-zäöüß])(tk|tiefkühl\w*|tiefgekühlt\w*|tiefgefroren\w*|gefroren\w*|frozen|surgel\w*)([^a-zäöüß]|$)/i;
export function looksFrozen(text: string) {
	return FROZEN.test(text);
}

// Kind of food and symbol of a new product. What the product database says about it (its
// description and kinds, see server/lookup.ts) comes first: it knows the product, while the name
// may mislead – a brand, or a variety such as "hot chili" that sounds like a dish. Without such
// hints, or when they tell nothing, the name decides, as for containers; the symbol is then null
// and follows the name, as anywhere else.
export function kindOf(
	name: string,
	hints: readonly string[]
): { category: Category; icon: string | null } {
	for (const hint of hints) {
		const found = suggestCategory(hint);
		if (found !== 'other') return { category: found, icon: suggestIcon(hint, found) };
	}
	return { category: suggestCategory(name), icon: null };
}

// How a product is packed: drawn as its symbol, with the number of packs inside
export const PACK_SHAPES = ['box', 'bag', 'can', 'jar', 'bottle', 'cup'] as const;
export type PackShape = (typeof PACK_SHAPES)[number];
export function isPackShape(value: unknown): value is PackShape {
	return (PACK_SHAPES as readonly unknown[]).includes(value);
}

// Words for each shape. German ones count at the end of a word too ("Kakaodose"), the short
// English ones only as a word of their own; not at the start ("Glasnudeln" are no jar) – except
// "Dosen-" ("Dosentomaten" are in a can).
const SHAPE_WORDS: [PackShape, RegExp][] = [
	['bag', /(beutel|tüte|tuete)$|^(bag|pouch|sachet)s?$/],
	['can', /(dose|konserve|büchse)$|^dosen|^(can|tin|canned)s?$/],
	['jar', /glas$|^jars?$/],
	['bottle', /flasche$|^bottles?$/],
	['cup', /becher$|^(cup|tub)s?$/],
	['box', /(karton|schachtel)$|^(box|boxes|carton)$/]
];

// The shapes the words of a text speak of
function shapesIn(text: string): PackShape[] {
	const words = text
		.toLowerCase()
		.split(/[^a-zäöüß]+/)
		.filter(Boolean);
	return SHAPE_WORDS.filter(([, pattern]) => words.some((word) => pattern.test(word))).map(
		([shape]) => shape
	);
}

// What a kind of food usually comes in, where there is a usual one
const SHAPE_OF_KIND: Partial<Record<Category, PackShape>> = {
	veg_raw: 'bag',
	veg_cooked: 'bag',
	fruit: 'bag',
	berries: 'bag',
	salad_herbs: 'bag',
	dry_goods: 'bag',
	bread: 'bag',
	dairy: 'cup',
	cheese_soft: 'cup'
};

// The shape suggested for a product: what the product database says, if it says one thing
// only (`known`, see server/lookup.ts – it is often missing, sometimes contradicts itself); else
// the first shape named in the name or the hints; else the usual one for its kind of food;
// else a box.
export function suggestShape(
	name: string,
	hints: readonly string[],
	category: Category,
	known: PackShape | null = null
): PackShape {
	if (known) return known;
	for (const text of [name, ...hints]) {
		const found = shapesIn(text);
		if (found.length === 1) return found[0];
	}
	return SHAPE_OF_KIND[category] ?? 'box';
}

// The shape the product database gives, from its own shape fields and the free text about the
// packaging – but only if all of it agrees on one
export function shapeFromDatabase(shapeTags: readonly string[], packagingText: string) {
	const TAGS: Record<string, PackShape> = {
		'en:bag': 'bag',
		'en:sachet': 'bag',
		'en:pouch': 'bag',
		'en:box': 'box',
		'en:carton': 'box',
		'en:brick': 'box',
		'en:tray': 'box',
		'en:can': 'can',
		'en:tin': 'can',
		'en:jar': 'jar',
		'en:bottle': 'bottle',
		'en:tub': 'cup',
		'en:cup': 'cup'
	};
	const found = new Set<PackShape>([
		...shapeTags.map((tag) => TAGS[tag]).filter((shape) => shape !== undefined),
		...shapesIn(packagingText)
	]);
	return found.size === 1 ? [...found][0] : null;
}
