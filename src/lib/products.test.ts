import { describe, expect, it } from 'vitest';
import { suggestCategory, suggestIcon } from './food/dictionary';
import { MAX_ITEM_NAME } from './items';
import {
	endOfMonth,
	kindOf,
	looksFrozen,
	readPackDate,
	readPackForm,
	readPackGroups,
	readProductForm,
	shapeFromDatabase,
	suggestedName,
	tidyBrand,
	oneSpelling,
	MAX_BRAND,
	suggestShape
} from './products';

const TODAY = '2026-10-18';
const form = (values: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(values)) data.set(key, value);
	return data;
};

describe('dates of packs', () => {
	it('a month means its last day, leap years included', () => {
		expect(endOfMonth('2027-03')).toBe('2027-03-31');
		expect(endOfMonth('2027-04')).toBe('2027-04-30');
		expect(endOfMonth('2028-02')).toBe('2028-02-29');
		expect(endOfMonth('2027-02')).toBe('2027-02-28');
	});
	it('takes month and year, or a whole day', () => {
		expect(readPackDate('2027-03')).toEqual({ bestBefore: '2027-03-31', dateMonth: true });
		expect(readPackDate('2027-03-14')).toEqual({ bestBefore: '2027-03-14', dateMonth: false });
		expect(readPackDate('2027-13')).toBeNull();
		expect(readPackDate('2027-02-30')).toBeNull();
		expect(readPackDate('03/2027')).toBeNull();
	});
});

describe('the pack form', () => {
	it('reads date, place and number', () => {
		expect(
			readPackForm(form({ bestBefore: '2027-03', location: 'freezer', count: '3' }), TODAY)
		).toEqual({
			values: {
				bestBefore: '2027-03-31',
				dateMonth: true,
				location: 'freezer',
				count: 3,
				storedOn: null
			}
		});
	});
	it('stored since an earlier day; today means nothing to keep', () => {
		const ok = { bestBefore: '2027-03', location: 'freezer', count: '1' };
		expect(readPackForm(form({ ...ok, storedOn: '2026-09-01' }), TODAY).values?.storedOn).toBe(
			'2026-09-01'
		);
		expect(readPackForm(form({ ...ok, storedOn: TODAY }), TODAY).values?.storedOn).toBeNull();
	});
	it('a date is optional, one pack is the default', () => {
		expect(readPackForm(form({ location: 'pantry' }), TODAY).values).toEqual({
			bestBefore: null,
			dateMonth: false,
			location: 'pantry',
			count: 1,
			storedOn: null
		});
	});
	it('refuses a wrong date, number or place', () => {
		const ok = { bestBefore: '2027-03', location: 'freezer', count: '1' };
		expect(readPackForm(form({ ...ok, bestBefore: 'soon' }), TODAY).problem).toBe('date');
		expect(readPackForm(form({ ...ok, count: '0' }), TODAY).problem).toBe('count');
		expect(readPackForm(form({ ...ok, count: '21' }), TODAY).problem).toBe('count');
		expect(readPackForm(form({ ...ok, count: '1.5' }), TODAY).problem).toBe('count');
		expect(readPackForm(form({ ...ok, location: 'garden' }), TODAY).problem).toBe('location');
		expect(readPackForm(form({ ...ok, storedOn: '2026-10-19' }), TODAY).problem).toBe('since');
		expect(readPackForm(form({ ...ok, storedOn: '2026-02-30' }), TODAY).problem).toBe('since');
		// no place is locked for a bought product (it has no kind of food to be checked against)
		expect(readPackForm(form({ ...ok, location: 'pantry' }), TODAY).values?.location).toBe(
			'pantry'
		);
	});
});

describe('the product form', () => {
	it('needs a name; an unknown kind of food becomes "other"', () => {
		expect(readProductForm(form({ name: '  ' })).problem).toBe('name');
		expect(
			readProductForm(
				form({
					name: ' Pea  soup ',
					brand: ' QUIXO ',
					category: 'nonsense',
					note: ' for  guests '
				})
			).values
		).toEqual({
			name: 'Pea soup',
			brand: 'QUIXO',
			note: 'for guests',
			shape: 'box',
			category: 'other',
			icon: null
		});
	});
});

describe('correcting the packs', () => {
	const group = { ids: [3, 4], count: 1, bestBefore: '2027-05', location: 'freezer' };
	const read = (groups: unknown[]) => readPackGroups(JSON.stringify(groups));
	it('reads number, date and place of each group', () => {
		expect(read([group, { ids: [7], count: 3, bestBefore: '', location: 'pantry' }])).toEqual([
			{ ids: [3, 4], count: 1, bestBefore: '2027-05-31', dateMonth: true, location: 'freezer' },
			{ ids: [7], count: 3, bestBefore: null, dateMonth: false, location: 'pantry' }
		]);
		expect(read([{ ...group, count: 0 }])?.[0].count).toBe(0);
		expect(readPackGroups('')).toEqual([]);
	});
	it('refuses anything wrong as a whole', () => {
		expect(readPackGroups('not json')).toBeNull();
		expect(read([{ ...group, count: 21 }])).toBeNull();
		expect(read([{ ...group, count: -1 }])).toBeNull();
		expect(read([{ ...group, ids: ['3'] }])).toBeNull();
		expect(read([{ ...group, bestBefore: '2027-13' }])).toBeNull();
		expect(read([{ ...group, location: 'garden' }])).toBeNull();
	});
});

describe('what a product is', () => {
	it('sees frozen food in names and on packs', () => {
		for (const text of [
			'TK-Spinat',
			'Rahmspinat tk',
			'Tiefkühlpizza',
			'Erbsen, tiefgefroren',
			'Frozen peas',
			'en:frozen-vegetables',
			'Gemüse gefroren'
		]) {
			expect(looksFrozen(text), text).toBe(true);
		}
		for (const text of ['Spinat', 'Tkachenko', 'Peas', 'Kühlschrank-Snack', 'Stück']) {
			expect(looksFrozen(text), text).toBe(false);
		}
	});
	it('the hints of the database first, the first that knows; else the name', () => {
		// a variety that sounds like a dish does not make nuts a leftover
		const nuts = kindOf('Nut mix hot chili', ['Mystery', 'cashew nuts']);
		expect(nuts.category).toBe(suggestCategory('cashew nuts'));
		expect(nuts.category).not.toBe(suggestCategory('Nut mix hot chili'));
		expect(nuts.icon).toBe(suggestIcon('cashew nuts', nuts.category));
		expect(kindOf('Erbsen', [])).toEqual({ category: suggestCategory('Erbsen'), icon: null });
		expect(kindOf('Erbsen', ['Mystery'])).toEqual({
			category: suggestCategory('Erbsen'),
			icon: null
		});
		expect(kindOf('Quixo Dream', ['Mystery'])).toEqual({ category: 'other', icon: null });
	});
});

describe('the suggested name', () => {
	const lookup = (name: string | null, brand: string | null) => ({
		name,
		brand,
		hints: [],
		frozen: false,
		shape: null
	});
	it('is the name only – the maker has its own field', () => {
		expect(suggestedName(lookup('Nut mix hot', 'Quixo'))).toBe('Nut mix hot');
		expect(suggestedName(lookup(' Nut mix ', null))).toBe('Nut mix');
		expect(suggestedName(lookup(null, 'Quixo'))).toBeNull();
		expect(suggestedName(null)).toBeNull();
	});
	it('stays within the length of a name', () => {
		expect(suggestedName(lookup('x'.repeat(90), null))).toBe('x'.repeat(MAX_ITEM_NAME));
	});
});

describe('the spelling of a brand', () => {
	it('keeps the spelling of a maker known already, whatever the case', () => {
		expect(tidyBrand('QUIXO', ['Quixo'])).toBe('Quixo');
		expect(tidyBrand('quixo', ['Quixo', 'Brümli'])).toBe('Quixo');
		expect(tidyBrand('BRÜMLI', ['Quixo', 'Brümli'])).toBe('Brümli');
	});
	it('softens capitals throughout in a new one, but not short ones', () => {
		expect(tidyBrand('QUIXO', [])).toBe('Quixo');
		expect(tidyBrand('ÖKO-HOF BRÜMLI', [])).toBe('Öko-Hof Brümli');
		expect(tidyBrand('XL', [])).toBe('XL');
		expect(tidyBrand('Quixo', [])).toBe('Quixo');
		expect(tidyBrand('quixo', [])).toBe('quixo');
	});
	it('tidies spaces and treats empty as no brand', () => {
		expect(tidyBrand('  Quixo   Foods ', [])).toBe('Quixo Foods');
		expect(tidyBrand('   ', [])).toBeNull();
		expect(tidyBrand(null, [])).toBeNull();
		expect(tidyBrand('x'.repeat(50), [])).toHaveLength(MAX_BRAND);
	});
	it('picks one spelling for several', () => {
		expect(oneSpelling(['QUIXO', 'Quixo', 'quixo'])).toBe('Quixo');
		expect(oneSpelling(['QUIXO'])).toBe('Quixo');
	});
});

describe('the shape of the pack', () => {
	it('the database first, then words in name or hints, then the kind of food, then a box', () => {
		expect(suggestShape('Peas', [], 'veg_raw', 'box')).toBe('box');
		expect(suggestShape('Tomaten in der Dose', [], 'veg_raw')).toBe('can');
		expect(suggestShape('Gurken', ['Gurkenglas'], 'other')).toBe('jar');
		expect(suggestShape('Olivenöl', ['oil in a bottle'], 'other')).toBe('bottle');
		expect(suggestShape('Joghurt Becher', [], 'dairy')).toBe('cup');
		expect(suggestShape('Erbsen', [], 'veg_raw')).toBe('bag');
		expect(suggestShape('Pizza', [], 'other')).toBe('box');
	});
	it('words count at the end of a word (and "Dosen-" in front), only when they name one shape', () => {
		expect(suggestShape('Glasnudeln', [], 'other')).toBe('box');
		expect(suggestShape('Dosenmilch', [], 'other')).toBe('can');
		expect(suggestShape('Kakaodose', [], 'other')).toBe('can');
		expect(suggestShape('Glas oder Dose', [], 'other')).toBe('box');
	});
	it('takes the database only where it agrees with itself', () => {
		expect(shapeFromDatabase(['en:bag'], '')).toBe('bag');
		expect(shapeFromDatabase(['en:bottle'], 'glass jar, plastic lid')).toBeNull();
		expect(shapeFromDatabase([], 'Kunststoffbeutel')).toBe('bag');
		expect(shapeFromDatabase(['en:lid', 'en:film'], '')).toBeNull();
		expect(shapeFromDatabase([], '')).toBeNull();
	});
});
