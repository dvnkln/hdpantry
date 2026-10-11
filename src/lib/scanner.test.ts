import { expect, it } from 'vitest';
import { looksLikeUrl, pointInFrame } from './scanner';

it('recognises web addresses', () => {
	expect(looksLikeUrl('https://example.com/c/4PG6')).toBe(true);
	expect(looksLikeUrl(' HTTP://example.com ')).toBe(true);
	expect(looksLikeUrl('4PG6')).toBe(false);
	expect(looksLikeUrl('see https://example.com')).toBe(false);
	expect(looksLikeUrl('https://example.com with text')).toBe(false);
});

it('maps a tap on the square camera picture to the whole frame', () => {
	const box = { width: 300, height: 300 };
	// A wide frame shows its middle: the sides are cut off
	const wide = { width: 1920, height: 1080 };
	expect(pointInFrame({ x: 150, y: 150 }, box, wide)).toEqual({ x: 0.5, y: 0.5 });
	expect(pointInFrame({ x: 0, y: 0 }, box, wide).x).toBeCloseTo((1920 - 1080) / 2 / 1920);
	expect(pointInFrame({ x: 0, y: 0 }, box, wide).y).toBe(0);
	expect(pointInFrame({ x: 300, y: 300 }, box, wide).x).toBeCloseTo(1 - (1920 - 1080) / 2 / 1920);
	expect(pointInFrame({ x: 300, y: 300 }, box, wide).y).toBe(1);
	// A tall frame (phone held upright): top and bottom are cut off
	const tall = { width: 1080, height: 1920 };
	expect(pointInFrame({ x: 0, y: 0 }, box, tall).x).toBe(0);
	expect(pointInFrame({ x: 0, y: 0 }, box, tall).y).toBeCloseTo((1920 - 1080) / 2 / 1920);
	// Never outside the frame, and harmless before the camera has a picture
	expect(pointInFrame({ x: 5000, y: 900 }, box, wide)).toEqual({ x: 1, y: 1 });
	expect(pointInFrame({ x: -5000, y: -900 }, box, wide)).toEqual({ x: 0, y: 0 });
	expect(pointInFrame({ x: 10, y: 10 }, box, { width: 0, height: 0 })).toEqual({ x: 0.5, y: 0.5 });
});
