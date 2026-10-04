import { describe, expect, it } from 'vitest';
import { isDate, readItemForm, scaleAmount } from './items';

function form(values: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries(values)) data.set(key, value);
	return data;
}
const base = { name: 'Lentils', location: 'freezer', fill: 'medium' };

describe('reading the form', () => {
	it('takes a complete entry', () => {
		expect(
			readItemForm(
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
			fill: 'medium',
			amount: 450,
			unit: 'g'
		});
	});
	it('note, date and amount are optional; the switch may be off', () => {
		expect(readItemForm(form({ ...base, unit: 'kg' })).values).toMatchObject({
			note: null,
			vacuumed: false,
			bestBefore: null,
			amount: null,
			unit: null // a unit without an amount means nothing
		});
	});
	it('accepts decimals with comma or point', () => {
		expect(readItemForm(form({ ...base, amount: '1,5', unit: 'kg' })).values).toMatchObject({
			amount: 1.5,
			unit: 'kg'
		});
		expect(readItemForm(form({ ...base, amount: '0.333', unit: 'l' })).values?.amount).toBe(0.33);
	});
	it('names the field that is wrong', () => {
		expect(readItemForm(form({ ...base, name: '   ' })).problem).toBe('name');
		expect(readItemForm(form({ ...base, location: 'garage' })).problem).toBe('location');
		expect(readItemForm(form({ ...base, bestBefore: '15.01.2027' })).problem).toBe('date');
		expect(readItemForm(form({ ...base, fill: 'overflowing' })).problem).toBe('fill');
		for (const amount of ['0', '-5', 'many', '100000']) {
			expect(readItemForm(form({ ...base, amount, unit: 'g' })).problem).toBe('amount');
		}
		expect(readItemForm(form({ ...base, amount: '5', unit: 'buckets' })).problem).toBe('amount');
		expect(readItemForm(form({ ...base, amount: '5' })).problem).toBe('amount');
	});
	it('cuts overlong texts', () => {
		const { values } = readItemForm(
			form({ ...base, name: 'x'.repeat(500), note: 'y'.repeat(900) })
		);
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
