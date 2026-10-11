/// <reference lib="webworker" />
// Reads printed text from a picture – in a background thread, so the camera picture stays
// smooth. Two models (PP-OCRv5) run on ONNX Runtime Web: one finds the lines of text, one reads
// each line. Runtime and models come from the own server; the picture never leaves the browser.
import * as ort from 'onnxruntime-web/wasm';
import { CHARACTERS } from './characters';
import {
	CAMERA_PIXELS,
	codeShaped,
	decodeLine,
	findBoxes,
	findingSize,
	LINE_HEIGHT,
	lineSize,
	offCodeShape,
	searchedPart,
	wholeInPicture,
	type Box
} from './geometry';
import type { Files, Line, ReadOptions, Reading, Request, Reply } from './engine';
import { SURE } from './tally';

// Where runtime and models lie on the own server is told by the page (engine.ts): that way the
// files exist once, under one address, and what was fetched in the background is what is used.

// Lines the reading model looks at per picture, the surest first – a picture full of text
// (a label, a newspaper) must not keep the phone busy for seconds
const MAX_LINES = 4;

// The surroundings of a line, for a second look: so far to each side that the line is still
// whole in there after the hand has moved a little. Always drawn at the same size – the models
// are much slower the first time they see a new size, so the sizes are few and all are tried
// once when the reader is made ready.
const AROUND = { width: 352, height: 256 };
function around(box: Box, picture: { width: number; height: number }) {
	const shape = AROUND.width / AROUND.height;
	const width = Math.min(box.width * 2.4, picture.width, picture.height * shape);
	const height = width / shape;
	const x = Math.max(0, Math.min(picture.width - width, box.x - width / 2));
	const y = Math.max(0, Math.min(picture.height - height, box.y - height / 2));
	return {
		x: Math.round(x),
		y: Math.round(y),
		width: Math.round(width),
		height: Math.round(height)
	};
}

// For measuring: how often the reading model ran for the picture at hand
let runsOfReading = 0;
// … and how long drawing the lines for it took
let drawing = 0;

type Models = { find: ort.InferenceSession; read: ort.InferenceSession };

// A real picture has been handed in (see the warming up in prepare())
let asked = false;

// A model can only do one thing at a time: everything that runs one waits its turn here
let turn: Promise<unknown> = Promise.resolve();
function inTurn<T>(work: () => Promise<T>): Promise<T> {
	const mine = turn.then(work, work);
	turn = mine.catch(() => {});
	return mine;
}

let models: Promise<Models> | undefined;

async function load(url: string) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Loading ${url} failed (${response.status})`);
	return ort.InferenceSession.create(new Uint8Array(await response.arrayBuffer()), {
		executionProviders: ['wasm'],
		graphOptimizationLevel: 'all'
	});
}

function prepare(files: Files) {
	if (!models) {
		// The runtime would fetch its program file from a foreign server by default – never
		// remove this
		const own = (path: string) => new URL(path, self.location.origin).href;
		ort.env.wasm.wasmPaths = { mjs: own(files.glue), wasm: own(files.runtime) };
		// Several threads where the browser allows them: only on pages that are shut off from
		// other sites (the two headers set in start.js) and reached over https. Otherwise, or if
		// the page found that they do not start (engine.ts), one – slower, but it works.
		ort.env.wasm.numThreads = self.crossOriginIsolated
			? Math.max(1, Math.min(files.threads, navigator.hardwareConcurrency || 1))
			: 1;
		models = Promise.all([load(files.find), load(files.read)]).then(([find, read]) => {
			// The first run of a model is much slower than the following ones (it sets itself up
			// for the size of the picture). So each size is run once with an empty picture, in
			// the background and in turn with everything else (see `inTurn`) – but only while
			// nobody waits: once a real picture has come, its own search is the first run.
			// Getting ready does not wait for this; whoever opens the app to scan at once is
			// not held up by it (measured: that cost seconds).
			const empty = (width: number, height: number) =>
				new ort.Tensor('float32', new Float32Array(3 * width * height), [1, 3, height, width]);
			const once = (run: () => Promise<unknown>) =>
				void inTurn(() => (asked ? Promise.resolve() : run())).catch(() => {});
			// A camera frame of a phone held upright, a line, and the second look. A frame
			// held sideways is not prepared for: its first search is simply a slower one.
			const size = findingSize(searchedPart({ width: 1080, height: 1920 }), CAMERA_PIXELS);
			once(() => find.run({ [find.inputNames[0]]: empty(size.width, size.height) }));
			once(() =>
				read.run({
					[read.inputNames[0]]: empty(lineSize({ width: 4, height: 1 }).width, LINE_HEIGHT)
				})
			);
			once(() => find.run({ [find.inputNames[0]]: empty(AROUND.width, AROUND.height) }));
			return { find, read };
		});
		// Failed (e.g. no connection to the own server): try again next time
		models.catch(() => (models = undefined));
	}
	return models;
}

// A drawn picture as the numbers the models take: blue, green, red (in this order), each from
// -1 to 1, one colour after the other
function toTensor(pixels: Uint8ClampedArray, width: number, height: number, tensorWidth = width) {
	const area = tensorWidth * height;
	const data = new Float32Array(3 * area); // what is not drawn stays 0: middle grey
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const from = (y * width + x) * 4;
			const to = y * tensorWidth + x;
			data[to] = pixels[from + 2] / 127.5 - 1;
			data[area + to] = pixels[from + 1] / 127.5 - 1;
			data[2 * area + to] = pixels[from] / 127.5 - 1;
		}
	}
	return new ort.Tensor('float32', data, [1, 3, height, tensorWidth]);
}

function canvas(width: number, height: number) {
	const surface = new OffscreenCanvas(width, height);
	const context = surface.getContext('2d', { willReadFrequently: true });
	if (!context) throw new Error('No drawing surface in this browser');
	return context;
}

// Reads one found line. `turned`: the line upside down – a container is not always held upright.
async function readLine(
	read: ort.InferenceSession,
	picture: ImageBitmap,
	box: Box,
	turned: boolean
) {
	runsOfReading++;
	const beforeDrawing = performance.now();
	const { drawn, width } = lineSize(box);
	const context = canvas(drawn, LINE_HEIGHT);
	context.fillStyle = '#808080';
	context.fillRect(0, 0, drawn, LINE_HEIGHT);
	// Draw the picture so that the line lies flat and fills the surface
	context.translate(drawn / 2, LINE_HEIGHT / 2);
	context.scale(drawn / box.width, LINE_HEIGHT / box.height);
	context.rotate(-(box.angle + (turned ? Math.PI : 0)));
	context.drawImage(picture, -box.x, -box.y);
	const pixels = context.getImageData(0, 0, drawn, LINE_HEIGHT).data;
	const tensor = toTensor(pixels, drawn, LINE_HEIGHT, width);
	drawing += performance.now() - beforeDrawing;
	const result = await read.run({ [read.inputNames[0]]: tensor });
	const output = result[read.outputNames[0]];
	const [, steps, classes] = output.dims;
	return decodeLine(output.data as Float32Array, steps, classes, CHARACTERS);
}

async function readPicture(
	picture: ImageBitmap,
	files: Files,
	options: ReadOptions
): Promise<Reading> {
	const started = performance.now();
	const { find, read } = await prepare(files);
	const loaded = performance.now();

	const detail = { model: 0, boxes: 0, found: 0, runs: 0, draw: 0 };
	runsOfReading = 0;
	drawing = 0;
	// What of the picture is searched: all of it – or, for a second look, only the surroundings
	// of the place where a short code was just read. The hand moves between two frames, so the
	// code is looked for again there; that still takes only a fraction of a full search.
	const part = options.at
		? around(options.at, picture)
		: { x: 0, y: 0, width: picture.width, height: picture.height };
	const size = options.at ? AROUND : findingSize(part, options.pixels);
	const context = canvas(size.width, size.height);
	context.drawImage(
		picture,
		part.x,
		part.y,
		part.width,
		part.height,
		0,
		0,
		size.width,
		size.height
	);
	const pixels = context.getImageData(0, 0, size.width, size.height).data;
	const beforeModel = performance.now();
	const found = await find.run({
		[find.inputNames[0]]: toTensor(pixels, size.width, size.height)
	});
	detail.model = Math.round(performance.now() - beforeModel);
	const map = found[find.outputNames[0]];
	const [, , mapHeight, mapWidth] = map.dims;
	const scaleX = part.width / mapWidth;
	const scaleY = part.height / mapHeight;
	const scale = (scaleX + scaleY) / 2;
	const beforeBoxes = performance.now();
	const all = findBoxes(map.data as Float32Array, mapWidth, mapHeight);
	detail.boxes = Math.round(performance.now() - beforeBoxes);
	detail.found = all.length;
	let boxes = all
		// Never a line that is cut off at the edge: its characters would be read wrong
		.filter((box) => wholeInPicture(box, { width: mapWidth, height: mapHeight }))
		.filter((box) => options.everyLine || codeShaped(box))
		// Looking for a short code: the lines shaped most like one first
		.sort((a, b) => (options.code ? offCodeShape(a) - offCodeShape(b) : 0))
		.slice(0, options.everyLine ? 12 : MAX_LINES)
		.map((box) => ({
			...box,
			x: part.x + box.x * scaleX,
			y: part.y + box.y * scaleY,
			width: box.width * scale,
			height: box.height * scale
		}));
	// A second look takes only the lines nearest to where the code stood (the second one only
	// if the first is not it)
	if (options.at) {
		const from = options.at;
		const far = (box: Box) => Math.hypot(box.x - from.x, box.y - from.y);
		boxes = boxes.sort((a, b) => far(a) - far(b)).slice(0, 2);
	}
	const foundAt = performance.now();

	// Read the lines – first as they stand. A container is not always held upright: what was not
	// read for sure is read once more upside down, and the surer of the two readings is kept.
	// When a short code is looked for, the first line that is one for sure ends the reading:
	// most pictures then cost a single run of the reading model.
	const form = options.code ? new RegExp(options.code) : null;
	const isIt = (line: { text: string; confidence: number }) =>
		!!form && line.confidence >= SURE && form.test(line.text);
	const lines: Line[] = [];
	let gotIt = false;
	// A second look reads the way up that worked the first time, and nothing else
	const first = options.at ? !!options.atTurned : false;
	for (const box of boxes) {
		const line = await readLine(read, picture, box, first);
		lines.push({ ...line, box, turned: first });
		if ((gotIt = isIt(line))) break;
	}
	if (!gotIt && !options.at) {
		for (const line of lines) {
			if (line.confidence >= SURE) continue;
			const turned = await readLine(read, picture, line.box, true);
			if (turned.confidence > line.confidence) Object.assign(line, turned, { turned: true });
			if (isIt(line)) break;
		}
	}
	const kept = lines.filter((line) => line.text);
	const done = performance.now();
	detail.runs = runsOfReading;
	detail.draw = Math.round(drawing);
	return {
		lines: kept,
		detail,
		threads: ort.env.wasm.numThreads ?? 1,
		ms: {
			loading: Math.round(loaded - started),
			finding: Math.round(foundAt - loaded),
			reading: Math.round(done - foundAt)
		}
	};
}

self.onmessage = async (event: MessageEvent<Request>) => {
	const request = event.data;
	const reply = (message: Reply) => self.postMessage(message);
	try {
		if (request.type === 'prepare') {
			await prepare(request.files);
			reply({ id: request.id, ok: true });
		} else {
			asked = true;
			// Ready first (outside the queue: getting ready puts its own work into it)
			await prepare(request.files);
			const reading = await inTurn(() =>
				readPicture(request.picture, request.files, request.options)
			);
			request.picture.close();
			reply({ id: request.id, ok: true, reading });
		}
	} catch (err) {
		reply({ id: request.id, ok: false, error: err instanceof Error ? err.message : String(err) });
	}
};
