// The arithmetic around the two text models (PP-OCRv5: one finds lines of text in a picture,
// one reads a line) – kept free of browser and model code, so it can be tested.

export type Size = { width: number; height: number };

// A line of text found in a picture: a rectangle that may be turned. `width` is always the long
// side, `angle` (radians) the direction it runs in.
export type Box = {
	x: number;
	y: number;
	width: number;
	height: number;
	angle: number;
	score: number;
};

// How many pixels the finding model gets by default. Its time grows with the pixels; this is
// what the measurements settled on (see CLAUDE.md).
export const FINDING_PIXELS = 450_000;
// A camera frame gets fewer: the code is held up close there, and every frame counts
export const CAMERA_PIXELS = 330_000;
const STEP = 32;

// The size a picture is scaled to for the finding model: about `pixels` in all, never larger
// than the picture, both sides multiples of 32 (the model needs that).
export function findingSize(source: Size, pixels = FINDING_PIXELS): Size {
	const scale = Math.min(1, Math.sqrt(pixels / (source.width * source.height)));
	const round = (value: number) => Math.max(STEP, Math.round((value * scale) / STEP) * STEP);
	return { width: round(source.width), height: round(source.height) };
}

// What of a camera frame is searched: what the page shows of it – the middle square, the sides
// of the frame are cut off there – and a little more on both sides, so that a line at the edge
// of the visible picture is still whole.
const BEYOND = 0.05;
export function searchedPart(source: Size) {
	const side = Math.min(source.width, source.height);
	const long = Math.min(Math.max(source.width, source.height), Math.round(side * (1 + 2 * BEYOND)));
	const width = source.width >= source.height ? long : side;
	const height = source.width >= source.height ? side : long;
	return {
		x: Math.floor((source.width - width) / 2),
		y: Math.floor((source.height - height) / 2),
		width,
		height
	};
}

// Whether a found line lies wholly in the picture. One that touches the edge is cut off there,
// and a cut-off character is read as another one with full confidence – measured: a "4" cut in
// half came out as "I", 100 % sure. Such lines are never read.
export function wholeInPicture(box: Box, picture: Size) {
	const margin = Math.min(picture.width, picture.height) * 0.01;
	const cos = Math.abs(Math.cos(box.angle));
	const sin = Math.abs(Math.sin(box.angle));
	const halfWidth = (box.width * cos + box.height * sin) / 2;
	const halfHeight = (box.width * sin + box.height * cos) / 2;
	return (
		box.x - halfWidth >= margin &&
		box.y - halfHeight >= margin &&
		box.x + halfWidth <= picture.width - margin &&
		box.y + halfHeight <= picture.height - margin
	);
}

// Whether a found line has the shape of a short code: a few characters in one row – clearly
// wider than high, but no long line of text. Only such lines are read; that saves most of the
// reading time in pictures with other print on them.
export function codeShaped(box: Size) {
	const ratio = box.width / box.height;
	return ratio >= 1.4 && ratio <= 6;
}

// How far the shape of a line is from that of a printed short code. Measured on real pictures:
// the four characters come out 2.2 to 2.5 times as wide as high, while what else looks like
// text there (patterns in the food, embossed print) has other shapes. The lines closest to it
// are read first – so the code is usually the first one read, and the reading ends there.
const CODE_RATIO = 2.4;
export function offCodeShape(box: Size) {
	return Math.abs(Math.log(box.width / box.height / CODE_RATIO));
}

const THRESHOLD = 0.3; // a pixel belongs to text from here on
const MIN_SCORE = 0.5; // how sure the model has to be of a whole line
const UNCLIP = 1.6; // the model marks the core of a line; this widens it to the whole letters
const MIN_PIXELS = 9;

// Turns the map of the finding model (one value from 0 to 1 per pixel: "this is text") into
// rectangles, in the coordinates of the map. The surest ones first.
export function findBoxes(map: Float32Array, width: number, height: number): Box[] {
	// Text pixels, widened by one pixel to the right and down so that letters of a line join
	const text = new Uint8Array(width * height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const here = y * width + x;
			if (
				map[here] > THRESHOLD ||
				(x > 0 && map[here - 1] > THRESHOLD) ||
				(y > 0 && map[here - width] > THRESHOLD) ||
				(x > 0 && y > 0 && map[here - width - 1] > THRESHOLD)
			) {
				text[here] = 1;
			}
		}
	}

	const boxes: Box[] = [];
	const stack: number[] = [];
	for (let start = 0; start < text.length; start++) {
		if (text[start] !== 1) continue;
		// One patch of connected text pixels
		const pixels: number[] = [];
		text[start] = 2;
		stack.push(start);
		while (stack.length) {
			const here = stack.pop()!;
			pixels.push(here);
			const x = here % width;
			const y = (here - x) / width;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
					const next = ny * width + nx;
					if (text[next] === 1) {
						text[next] = 2;
						stack.push(next);
					}
				}
			}
		}
		if (pixels.length < MIN_PIXELS) continue;

		let sumX = 0;
		let sumY = 0;
		let sure = 0;
		for (const here of pixels) {
			sumX += here % width;
			sumY += Math.floor(here / width);
			sure += map[here];
		}
		const score = sure / pixels.length;
		if (score < MIN_SCORE) continue;
		const meanX = sumX / pixels.length;
		const meanY = sumY / pixels.length;

		// The direction the patch runs in: the axis along which its pixels spread most
		let xx = 0;
		let yy = 0;
		let xy = 0;
		for (const here of pixels) {
			const dx = (here % width) - meanX;
			const dy = Math.floor(here / width) - meanY;
			xx += dx * dx;
			yy += dy * dy;
			xy += dx * dy;
		}
		const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		let minAlong = Infinity;
		let maxAlong = -Infinity;
		let minAcross = Infinity;
		let maxAcross = -Infinity;
		for (const here of pixels) {
			const dx = (here % width) - meanX;
			const dy = Math.floor(here / width) - meanY;
			const along = dx * cos + dy * sin;
			const across = -dx * sin + dy * cos;
			if (along < minAlong) minAlong = along;
			if (along > maxAlong) maxAlong = along;
			if (across < minAcross) minAcross = across;
			if (across > maxAcross) maxAcross = across;
		}
		let long = maxAlong - minAlong + 1;
		let short = maxAcross - minAcross + 1;
		if (Math.min(long, short) < 3) continue;
		const midAlong = (minAlong + maxAlong) / 2;
		const midAcross = (minAcross + maxAcross) / 2;
		const grow = (long * short * UNCLIP) / (2 * (long + short));
		long += 2 * grow;
		short += 2 * grow;
		boxes.push({
			x: meanX + midAlong * cos - midAcross * sin,
			y: meanY + midAlong * sin + midAcross * cos,
			width: Math.max(long, short),
			height: Math.min(long, short),
			angle: long >= short ? angle : angle + Math.PI / 2,
			score
		});
	}
	return boxes.sort((a, b) => b.score - a.score);
}

// The reading model takes a line 48 pixels high; its width follows the line, 320 at least.
export const LINE_HEIGHT = 48;
const LINE_WIDTH = 320;
const MAX_LINE_WIDTH = 960;

// How wide a found line is drawn for the reading model, and how wide the picture around it is
export function lineSize(box: Size) {
	const drawn = Math.min(
		MAX_LINE_WIDTH,
		Math.max(1, Math.ceil((LINE_HEIGHT * box.width) / box.height))
	);
	return { drawn, width: Math.max(LINE_WIDTH, drawn) };
}

// What the reading model says, as text. It gives, for each step along the line, how likely each
// character is (the first entry means "nothing here", the last one a space); the same character
// in neighbouring steps counts once. Confidence: how sure it was of the characters it kept, on
// average.
export function decodeLine(output: Float32Array, steps: number, classes: number, chars: string) {
	let text = '';
	let sure = 0;
	let kept = 0;
	let before = 0;
	for (let step = 0; step < steps; step++) {
		let best = 0;
		let bestValue = -Infinity;
		const offset = step * classes;
		for (let c = 0; c < classes; c++) {
			if (output[offset + c] > bestValue) {
				bestValue = output[offset + c];
				best = c;
			}
		}
		if (best !== 0 && best !== before) {
			text += best <= chars.length ? chars[best - 1] : ' ';
			sure += bestValue;
			kept++;
		}
		before = best;
	}
	return { text: text.trim(), confidence: kept ? sure / kept : 0 };
}
