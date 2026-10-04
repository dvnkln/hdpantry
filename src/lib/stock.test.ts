import { describe, expect, it } from 'vitest';
import { daysUntil, expiry, sortStock } from './stock';

const today = '2026-10-04';

describe('what expires soon', () => {
	it('counts whole days, across months and summer time', () => {
		expect(daysUntil('2026-10-04', today)).toBe(0);
		expect(daysUntil('2026-10-05', today)).toBe(1);
		expect(daysUntil('2026-11-03', today)).toBe(30);
		expect(daysUntil('2026-10-25', '2026-10-24')).toBe(1); // clocks go back that night
		expect(daysUntil('2026-10-01', today)).toBe(-3);
	});
	it('expired before today, soon up to three days ahead, fine after that', () => {
		expect(expiry('2026-10-03', today)).toEqual({ level: 'expired', days: -1 });
		expect(expiry('2026-10-04', today)).toEqual({ level: 'soon', days: 0 });
		expect(expiry('2026-10-07', today)).toEqual({ level: 'soon', days: 3 });
		expect(expiry('2026-10-08', today)).toEqual({ level: 'fine', days: 4 });
		expect(expiry(null, today)).toEqual({ level: 'none', days: null });
	});
});

describe('order of the list', () => {
	const item = (
		name: string,
		location: 'pantry' | 'fridge' | 'zero' | 'freezer',
		bestBefore: string | null
	) => ({
		name,
		location,
		bestBefore
	});
	const list = [
		item('Brot', 'pantry', '2026-10-06'),
		item('äpfel', 'fridge', null),
		item('Lachs', 'freezer', '2027-01-01'),
		item('Zander', 'zero', '2026-10-05'),
		item('Butter', 'fridge', '2026-10-20'),
		item('Mehl', 'pantry', null)
	];
	const names = (l: typeof list) => l.map((i) => i.name);

	it('by date: what expires first comes first, no date last', () => {
		expect(names(sortStock(list, 'date'))).toEqual([
			'Zander',
			'Brot',
			'Butter',
			'Lachs',
			'äpfel',
			'Mehl'
		]);
	});
	it('by date reversed: no date still comes last', () => {
		expect(names(sortStock(list, 'date', true))).toEqual([
			'Lachs',
			'Butter',
			'Brot',
			'Zander',
			'äpfel',
			'Mehl'
		]);
	});
	it('by name, ignoring case and umlauts', () => {
		expect(names(sortStock(list, 'name', false, 'de'))).toEqual([
			'äpfel',
			'Brot',
			'Butter',
			'Lachs',
			'Mehl',
			'Zander'
		]);
		expect(names(sortStock(list, 'name', true, 'de'))[0]).toBe('Zander');
	});
	it('by place of storage, within a place the more urgent first', () => {
		expect(names(sortStock(list, 'location'))).toEqual([
			'Brot',
			'Mehl',
			'Butter',
			'äpfel',
			'Zander',
			'Lachs'
		]);
	});
	it('does not change the list it was given', () => {
		sortStock(list, 'name');
		expect(list[0].name).toBe('Brot');
	});
});
