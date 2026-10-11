import { expect, it } from 'vitest';
import { addLines, surelyRead, type Seen } from './tally';

const line = (text: string, confidence: number) => ({ text, confidence });

it('keeps the best reading of every line and counts how often it came', () => {
	let seen: Seen[] = [];
	seen = addLines(seen, [line('ZQ77', 0.99), line('OHAO', 0.57)]);
	seen = addLines(seen, []); // a picture without text takes nothing away
	seen = addLines(seen, [line('ZQ77', 1), line('DHRO', 0.64)]);
	expect(seen).toEqual([
		{ text: 'ZQ77', best: 1, times: 2, sure: 2 },
		{ text: 'DHRO', best: 0.64, times: 1, sure: 0 },
		{ text: 'OHAO', best: 0.57, times: 1, sure: 0 }
	]);
});

it('believes a line only after it was read sure twice', () => {
	let seen = addLines([], [line('ZQ77', 0.99)]);
	expect(surelyRead(seen)).toBeNull();
	seen = addLines(seen, [line('ZQ77', 0.8)]); // seen again, but not sure
	expect(surelyRead(seen)).toBeNull();
	seen = addLines(seen, [line('ZQ77', 0.95)]);
	expect(surelyRead(seen)?.text).toBe('ZQ77');
});

it('counts a line once per picture, however often it shows there', () => {
	const seen = addLines([], [line('ZQ77', 0.99), line('ZQ77', 0.97)]);
	expect(seen).toEqual([{ text: 'ZQ77', best: 0.99, times: 1, sure: 1 }]);
	expect(surelyRead(seen)).toBeNull();
});

it('never believes what is read often but unsure, and can be narrowed to a form', () => {
	let seen: Seen[] = [];
	for (let i = 0; i < 5; i++) seen = addLines(seen, [line('APGA', 0.85), line('PRESS', 0.97)]);
	expect(surelyRead(seen)?.text).toBe('PRESS');
	expect(surelyRead(seen, (text) => /^[A-Z0-9]{4}$/.test(text))).toBeNull();
});
