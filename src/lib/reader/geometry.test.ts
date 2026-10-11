import { describe, expect, it } from 'vitest';
import {
	codeShaped,
	offCodeShape,
	decodeLine,
	findBoxes,
	findingSize,
	lineSize,
	searchedPart,
	wholeInPicture
} from './geometry';

describe('size for the finding model', () => {
	it('scales to about the wanted number of pixels, in multiples of 32', () => {
		expect(findingSize({ width: 2268, height: 4032 })).toEqual({ width: 512, height: 896 });
		expect(findingSize({ width: 1080, height: 1080 })).toEqual({ width: 672, height: 672 });
		expect(findingSize({ width: 1920, height: 1080 })).toEqual({ width: 896, height: 512 });
		expect(findingSize({ width: 1080, height: 1080 }, 1_000_000)).toEqual({
			width: 992,
			height: 992
		});
	});
	it('never makes a picture larger', () => {
		expect(findingSize({ width: 320, height: 256 })).toEqual({ width: 320, height: 256 });
		expect(findingSize({ width: 10, height: 10 })).toEqual({ width: 32, height: 32 });
	});
});

describe('what of a camera frame is searched', () => {
	it('is the middle square the page shows, and a little beyond on both sides', () => {
		expect(searchedPart({ width: 1920, height: 1080 })).toEqual({
			x: 366,
			y: 0,
			width: 1188,
			height: 1080
		});
		expect(searchedPart({ width: 1080, height: 1920 })).toEqual({
			x: 0,
			y: 366,
			width: 1080,
			height: 1188
		});
	});
	it('never reaches beyond the frame', () => {
		expect(searchedPart({ width: 1100, height: 1080 })).toEqual({
			x: 0,
			y: 0,
			width: 1100,
			height: 1080
		});
		expect(searchedPart({ width: 0, height: 0 }).width).toBe(0);
	});
});

describe('lines cut off at the edge', () => {
	const picture = { width: 1000, height: 800 };
	const box = (x: number, y: number, angle = 0) => ({
		x,
		y,
		width: 200,
		height: 60,
		angle,
		score: 1
	});
	it('counts a line as whole only with a little room to every edge', () => {
		expect(wholeInPicture(box(500, 400), picture)).toBe(true);
		expect(wholeInPicture(box(101, 400), picture)).toBe(false); // left end at the edge
		expect(wholeInPicture(box(895, 400), picture)).toBe(false);
		expect(wholeInPicture(box(500, 32), picture)).toBe(false);
		expect(wholeInPicture(box(500, 765), picture)).toBe(false);
		expect(wholeInPicture(box(120, 400), picture)).toBe(true);
	});
	it('takes the turn of a line into account', () => {
		// Upright, the same line needs room above and below instead of left and right
		expect(wholeInPicture(box(40, 400, Math.PI / 2), picture)).toBe(true);
		expect(wholeInPicture(box(500, 90, Math.PI / 2), picture)).toBe(false);
	});
});

describe('shape of a short code', () => {
	it('ranks lines by how close they are to the shape of the printed code', () => {
		const code = offCodeShape({ width: 240, height: 100 });
		expect(code).toBeCloseTo(0);
		expect(offCodeShape({ width: 290, height: 100 })).toBeGreaterThan(code);
		expect(offCodeShape({ width: 180, height: 100 })).toBeGreaterThan(code);
		// As far off on the wide side as on the narrow side
		expect(offCodeShape({ width: 480, height: 100 })).toBeCloseTo(
			offCodeShape({ width: 120, height: 100 })
		);
	});
	it('is a short row of characters, not a square and not a long line', () => {
		expect(codeShaped({ width: 400, height: 150 })).toBe(true);
		expect(codeShaped({ width: 150, height: 150 })).toBe(false);
		expect(codeShaped({ width: 1200, height: 100 })).toBe(false);
	});
});

// A map of the given size with text (value 0.9) wherever `inside` says so
function mapOf(width: number, height: number, inside: (x: number, y: number) => boolean) {
	const map = new Float32Array(width * height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) if (inside(x, y)) map[y * width + x] = 0.9;
	}
	return map;
}

describe('lines of text from the map of the model', () => {
	it('finds a flat line and widens it to the whole letters', () => {
		const [box, ...more] = findBoxes(
			mapOf(200, 100, (x, y) => x >= 50 && x < 130 && y >= 40 && y < 56),
			200,
			100
		);
		expect(more).toHaveLength(0);
		expect(box.x).toBeCloseTo(90, 0);
		expect(box.y).toBeCloseTo(48, 0);
		expect(Math.abs(Math.sin(box.angle))).toBeLessThan(0.05);
		// 81 x 17 pixels of core, grown on every side
		expect(box.width).toBeGreaterThan(95);
		expect(box.width).toBeLessThan(115);
		expect(box.height).toBeGreaterThan(30);
		expect(box.height).toBeLessThan(50);
		expect(box.score).toBeGreaterThan(0.8);
	});
	it('follows a line that is turned', () => {
		// A band along the diagonal
		const [box] = findBoxes(
			mapOf(200, 200, (x, y) => Math.abs(x - y) <= 6 && x + y >= 120 && x + y <= 280),
			200,
			200
		);
		expect(Math.abs(Math.tan(box.angle))).toBeCloseTo(1, 1);
		expect(box.width).toBeGreaterThan(box.height * 3);
	});
	it('takes an upright line as long side, too', () => {
		const [box] = findBoxes(
			mapOf(100, 200, (x, y) => x >= 40 && x < 56 && y >= 50 && y < 150),
			100,
			200
		);
		expect(box.width).toBeGreaterThan(box.height * 2);
		expect(Math.abs(Math.cos(box.angle))).toBeLessThan(0.05);
	});
	it('keeps lines apart and ignores specks and what the model is unsure of', () => {
		const map = mapOf(
			300,
			100,
			(x, y) =>
				(x >= 20 && x < 100 && y >= 20 && y < 34) || (x >= 180 && x < 270 && y >= 60 && y < 74)
		);
		map[5 * 300 + 5] = 0.9; // a speck
		for (let y = 80; y < 94; y++) for (let x = 20; x < 100; x++) map[y * 300 + x] = 0.35; // faint
		expect(findBoxes(map, 300, 100)).toHaveLength(2);
		expect(findBoxes(new Float32Array(300 * 100), 300, 100)).toEqual([]);
	});
});

describe('line for the reading model', () => {
	it('is 48 high, as wide as the line needs, and padded to 320', () => {
		expect(lineSize({ width: 200, height: 80 })).toEqual({ drawn: 120, width: 320 });
		expect(lineSize({ width: 1000, height: 100 })).toEqual({ drawn: 480, width: 480 });
		expect(lineSize({ width: 100000, height: 10 }).drawn).toBe(960);
	});
});

describe('text from the output of the reading model', () => {
	const CHARS = 'AB4';
	// Steps as lists of [class, how sure]; class 0 = nothing, 4 = space
	function output(steps: [number, number][]) {
		const classes = CHARS.length + 2;
		const data = new Float32Array(steps.length * classes);
		steps.forEach(([best, sure], i) => (data[i * classes + best] = sure));
		return { data, classes };
	}
	it('counts a character once per run and skips the gaps', () => {
		const { data, classes } = output([
			[0, 1],
			[3, 0.9],
			[3, 0.8],
			[0, 1],
			[1, 1],
			[1, 1],
			[0, 1],
			[1, 0.7],
			[2, 1]
		]);
		const line = decodeLine(data, 9, classes, CHARS);
		expect(line.text).toBe('4AAB');
		expect(line.confidence).toBeCloseTo((0.9 + 1 + 0.7 + 1) / 4);
	});
	it('reads the last class as a space and trims the ends', () => {
		const { data, classes } = output([
			[4, 1],
			[1, 1],
			[4, 1],
			[2, 1],
			[4, 1]
		]);
		expect(decodeLine(data, 5, classes, CHARS).text).toBe('A B');
	});
	it('gives nothing for an empty line', () => {
		const { data, classes } = output([
			[0, 1],
			[0, 1]
		]);
		expect(decodeLine(data, 2, classes, CHARS)).toEqual({ text: '', confidence: 0 });
	});
});
