import { expect, it } from 'vitest';
import { looksLikeUrl } from './scanner';

it('recognises web addresses', () => {
	expect(looksLikeUrl('https://example.com/c/4PG6')).toBe(true);
	expect(looksLikeUrl(' HTTP://example.com ')).toBe(true);
	expect(looksLikeUrl('4PG6')).toBe(false);
	expect(looksLikeUrl('see https://example.com')).toBe(false);
	expect(looksLikeUrl('https://example.com with text')).toBe(false);
});
