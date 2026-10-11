import { describe, expect, it } from 'vitest';
import { isDate, matchNames, readItemForm, scaleAmount } from './items';

function form(values: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries(values)) data.set(key, value);
	return data;
}
const base = { name: 'Lentils', location: 'freezer', fill: 'medium' };
const TODAY = '2026-10-10';
// The form as the server reads it on that day
const read = (data: FormData) => readItemForm(data, TODAY);

describe('reading the form', () => {
	it('takes a complete entry', () => {
		expect(
			read(
				form({
					...base,
					name: '  Lentil   soup ',
					note: ' spicy ',
					vacuumed: 'on',
					bestBefore: '2027-01-15',
					amount: '450',
					unit: 'g'
				})
			).values
		).toEqual({
			name: 'Lentil soup',
			note: 'spicy',
			vacuumed: true,
			location: 'freezer',
			bestBefore: '2027-01-15',
			dateManual: false,
			storedOn: null,
			category: 'other',
			icon: null,
			fill: 'medium',
			amount: 450,
			unit: 'g'
		});
	});
	it('note, date and amount are optional; the switch may be off', () => {
		expect(read(form({ ...base, unit: 'kg' })).values).toMatchObject({
			note: null,
			vacuumed: false,
			bestBefore: null,
			amount: null,
			unit: null // a unit without an amount means nothing
		});
	});
	it('takes kind of food, symbol and whether the date was typed by hand', () => {
		const { values } = read(
			form({
				...base,
				category: 'fish_raw',
				icon: 'fish',
				dateManual: '1',
				bestBefore: '2027-01-15'
			})
		);
		expect(values).toMatchObject({ category: 'fish_raw', icon: 'fish', dateManual: true });
		expect(read(form({ ...base, category: 'nonsense' })).values?.category).toBe('other');
	});
	it('refuses a place that must not be used for the kind of food', () => {
		expect(read(form({ ...base, category: 'fish_raw', location: 'pantry' })).problem).toBe(
			'location'
		);
		expect(read(form({ ...base, category: 'bread', location: 'pantry' })).values).toBeTruthy();
	});
	it('accepts decimals with comma or point', () => {
		expect(read(form({ ...base, amount: '1,5', unit: 'kg' })).values).toMatchObject({
			amount: 1.5,
			unit: 'kg'
		});
		expect(read(form({ ...base, amount: '0.333', unit: 'l' })).values?.amount).toBe(0.33);
	});
	it('names the field that is wrong', () => {
		expect(read(form({ ...base, name: '   ' })).problem).toBe('name');
		expect(read(form({ ...base, location: 'garage' })).problem).toBe('location');
		expect(read(form({ ...base, bestBefore: '15.01.2027' })).problem).toBe('date');
		expect(read(form({ ...base, fill: 'overflowing' })).problem).toBe('fill');
		for (const amount of ['0', '-5', 'many', '100000']) {
			expect(read(form({ ...base, amount, unit: 'g' })).problem).toBe('amount');
		}
		expect(read(form({ ...base, amount: '5', unit: 'buckets' })).problem).toBe('amount');
		expect(read(form({ ...base, amount: '5' })).problem).toBe('amount');
	});
	it('takes the day the content went in, up to today', () => {
		expect(read(form(base)).values?.storedOn).toBeNull();
		expect(read(form({ ...base, storedOn: '' })).values?.storedOn).toBeNull();
		expect(read(form({ ...base, storedOn: '2026-10-05' })).values?.storedOn).toBe('2026-10-05');
		expect(read(form({ ...base, storedOn: TODAY })).values?.storedOn).toBe(TODAY);
		expect(read(form({ ...base, storedOn: '2026-10-11' })).problem).toBe('since');
		expect(read(form({ ...base, storedOn: '05.10.2026' })).problem).toBe('since');
		expect(read(form({ ...base, storedOn: '2026-02-30' })).problem).toBe('since');
	});
	it('cuts overlong texts', () => {
		const { values } = read(form({ ...base, name: 'x'.repeat(500), note: 'y'.repeat(900) }));
		expect(values?.name).toHaveLength(80);
		expect(values?.note).toHaveLength(300);
	});
});

describe('amount follows the fill level in thirds', () => {
	it('full = 3/3, medium = 2/3, low = 1/3', () => {
		const typed = { amount: 600, level: 'full' } as const;
		expect(scaleAmount(typed, 'medium', 'g')).toBe(400);
		expect(scaleAmount(typed, 'low', 'g')).toBe(200);
		expect(scaleAmount(typed, 'full', 'g')).toBe(600);
	});
	it('counts from the level the amount was typed at', () => {
		const typed = { amount: 300, level: 'medium' } as const;
		expect(scaleAmount(typed, 'full', 'g')).toBe(450);
		expect(scaleAmount(typed, 'low', 'g')).toBe(150);
		expect(scaleAmount({ amount: 100, level: 'low' }, 'full', 'ml')).toBe(300);
	});
	it('whole numbers for g, ml, pieces; two decimals for kg and l', () => {
		expect(scaleAmount({ amount: 500, level: 'full' }, 'low', 'g')).toBe(167);
		expect(scaleAmount({ amount: 1, level: 'full' }, 'medium', 'kg')).toBe(0.67);
		expect(scaleAmount({ amount: 4, level: 'full' }, 'low', 'pcs')).toBe(1);
	});
	it('moving back gives exactly what was typed, and never nothing', () => {
		expect(scaleAmount({ amount: 0.5, level: 'full' }, 'full', 'g')).toBe(0.5);
		expect(scaleAmount({ amount: 1, level: 'full' }, 'low', 'pcs')).toBe(1);
	});
});

it('only accepts real calendar days', () => {
	expect(isDate('2028-02-29')).toBe(true);
	expect(isDate('2027-02-29')).toBe(false);
	expect(isDate('2027-13-01')).toBe(false);
	expect(isDate('2027-1-1')).toBe(false);
});

describe('names offered below the name field', () => {
	const names = ['Provolone', 'Lentil soup', 'Carrots', 'Chili', 'Chicken soup', 'Rice'];
	it('nothing typed: the ones recorded last', () => {
		expect(matchNames(names, '', 3)).toEqual(['Provolone', 'Lentil soup', 'Carrots']);
		expect(matchNames(names, '   ')).toEqual(names);
	});
	it('while typing: what begins like it first, then what contains it', () => {
		expect(matchNames(names, 'ch')).toEqual(['Chili', 'Chicken soup']);
		expect(matchNames(names, 'SOUP')).toEqual(['Lentil soup', 'Chicken soup']);
		expect(matchNames(names, 'ri')).toEqual(['Rice']);
		expect(matchNames(names, 'c', 2)).toEqual(['Carrots', 'Chili']);
	});
	it('offers nothing that does not fit, and not what is typed already', () => {
		expect(matchNames(names, 'xyz')).toEqual([]);
		expect(matchNames(names, 'rice')).toEqual([]);
	});
});
