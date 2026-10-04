import { describe, expect, it } from 'vitest';
import { isDue, isTime, latestSlot, nextSlot, type Schedule } from './schedule';

// Local time, like the server sees it
const at = (text: string) => new Date(text);
const local = (date: Date) => date.toLocaleString('sv-SE').slice(0, 16);

const daily: Schedule = { frequency: 'daily', time: '03:00', weekday: 1 };
const weekly: Schedule = { frequency: 'weekly', time: '03:00', weekday: 1 }; // Mondays
const monthly: Schedule = { frequency: 'monthly', time: '03:00', weekday: 1 };

describe('planned times', () => {
	it('daily: today once the time has passed, otherwise yesterday', () => {
		expect(local(latestSlot(daily, at('2031-03-12T10:00')))).toBe('2031-03-12 03:00');
		expect(local(latestSlot(daily, at('2031-03-12T02:59')))).toBe('2031-03-11 03:00');
		expect(local(nextSlot(daily, at('2031-03-12T10:00')))).toBe('2031-03-13 03:00');
		expect(local(nextSlot(daily, at('2031-03-12T02:59')))).toBe('2031-03-12 03:00');
	});
	it('weekly: the chosen day of the week', () => {
		// 2031-03-12 is a Wednesday, the Monday before is the 10th
		expect(local(latestSlot(weekly, at('2031-03-12T10:00')))).toBe('2031-03-10 03:00');
		expect(local(nextSlot(weekly, at('2031-03-12T10:00')))).toBe('2031-03-17 03:00');
		expect(local(latestSlot(weekly, at('2031-03-10T02:00')))).toBe('2031-03-03 03:00');
	});
	it('monthly: the first of the month', () => {
		expect(local(latestSlot(monthly, at('2031-03-12T10:00')))).toBe('2031-03-01 03:00');
		expect(local(latestSlot(monthly, at('2031-03-01T01:00')))).toBe('2031-02-01 03:00');
		expect(local(nextSlot(monthly, at('2031-12-12T10:00')))).toBe('2032-01-01 03:00');
	});
});

describe('due or not', () => {
	it('runs once after a planned time has passed', () => {
		const lastRun = at('2031-03-11T03:00:20');
		expect(isDue(daily, lastRun, at('2031-03-12T02:59'))).toBe(false);
		expect(isDue(daily, lastRun, at('2031-03-12T03:00'))).toBe(true);
		expect(isDue(daily, at('2031-03-12T03:00:10'), at('2031-03-12T03:01'))).toBe(false);
	});
	it('catches up after the server was off, but only once', () => {
		expect(isDue(daily, at('2031-03-01T03:00:10'), at('2031-03-12T10:00'))).toBe(true);
		expect(isDue(daily, at('2031-03-12T10:00:05'), at('2031-03-12T10:01'))).toBe(false);
	});
	it('does not run for times before it was switched on', () => {
		// switched on at 10:00 – the 03:00 of that day does not count as missed
		expect(isDue(daily, at('2031-03-12T10:00'), at('2031-03-12T10:01'))).toBe(false);
		expect(isDue(daily, at('2031-03-12T10:00'), at('2031-03-13T03:00'))).toBe(true);
	});
});

describe('time of day', () => {
	it('accepts HH:MM only', () => {
		expect(isTime('03:00')).toBe(true);
		expect(isTime('23:59')).toBe(true);
		expect(isTime('24:00')).toBe(false);
		expect(isTime('3:00')).toBe(false);
		expect(isTime('03:60')).toBe(false);
	});
});
