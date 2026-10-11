// Reading printed text from a picture, e.g. the short code below a QR code that is too creased
// to scan. The work happens in a background thread (worker.ts); this is the part pages talk to.
// Everything runs in the browser, with files from the own server.
import glueUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url';
import runtimeUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import { CAMERA_PIXELS, searchedPart, type Box } from './geometry';
import findUrl from './models/det.onnx?url';
import readUrl from './models/rec.onnx?url';

// The large files of the reader (about 27 MB, 15 MB on the wire). They are fetched in the
// background once the app is open (warmReader()), so nobody waits for them in front of a
// container – and kept by the browser across updates of the app (see service-worker.ts).
// The small file that starts the runtime keeps its name from version to version. A browser that
// stored it before the server sent the two headers (start.js) would hand it out without them,
// and the background threads would never start – so it is asked for under an address of its own.
const GLUE = `${glueUrl}?shut-off`;
export const READER_FILES = [GLUE, runtimeUrl, findUrl, readUrl];
// The same for the background thread, which is told where they lie
export type Files = {
	glue: string;
	runtime: string;
	find: string;
	read: string;
	// At most this many threads (the browser may allow fewer, see worker.ts)
	threads: number;
};
const filesFor = (threads: number): Files => ({
	glue: GLUE,
	runtime: runtimeUrl,
	find: findUrl,
	read: readUrl,
	threads
});

// One line of text found in a picture
// `turned`: it was read upside down (the container was held that way)
export type Line = { text: string; confidence: number; box: Box; turned: boolean };
export type Reading = {
	lines: Line[];
	// How many threads computed (1 unless the browser allows more, see worker.ts)
	threads: number;
	// How long it took: getting the models ready (only the first time), finding, reading
	ms: { loading: number; finding: number; reading: number };
	// Where the time went and how much there was to do (for measuring): the finding model
	// itself, turning its answer into lines, lines found, and runs of the reading model
	detail: { model: number; boxes: number; found: number; runs: number; draw: number };
};

// How a picture is read. The defaults are what the app uses; the rest is for measuring.
export type ReadOptions = {
	// A camera frame: only what the page shows of it is searched (and a little beyond)
	square?: boolean;
	// Pixels for the finding model (default FINDING_PIXELS)
	pixels?: number;
	// Read every line found, not only those shaped like a short code
	everyLine?: boolean;
	// Looking for a short code: as soon as a line reads as one, for sure, the rest of the picture
	// is left unread. (A pattern, because a function cannot be handed to the background thread.)
	code?: string;
	// A second look: search only the surroundings of this place (where a short code was just
	// read in the frame before) – a fraction of the time of searching the whole picture
	at?: Box;
	// … and which way up it stood there
	atTurned?: boolean;
};

export type Request =
	| { id: number; type: 'prepare'; files: Files }
	| { id: number; type: 'read'; files: Files; picture: ImageBitmap; options: ReadOptions };
export type Reply =
	{ id: number; ok: true; reading?: Reading } | { id: number; ok: false; error: string };

let worker: Worker | undefined;
let nextId = 1;
const waiting = new Map<number, { resolve: (reply: Reply) => void }>();

function ask(request: Request, transfer: Transferable[] = []) {
	if (!worker) {
		worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
		worker.onmessage = (event: MessageEvent<Reply>) => {
			waiting.get(event.data.id)?.resolve(event.data);
			waiting.delete(event.data.id);
		};
		worker.onerror = () => {
			// The thread died: tell everyone who waits, and start a new one next time
			for (const [id, { resolve }] of waiting) resolve({ id, ok: false, error: 'worker failed' });
			waiting.clear();
			worker?.terminate();
			worker = undefined;
		};
	}
	return new Promise<Reply>((resolve) => {
		waiting.set(request.id, { resolve });
		worker!.postMessage(request, transfer);
	});
}

// Several threads are much faster, but must not be able to hang the reader: if they are not
// ready after a while (or fail), the background thread is thrown away and started again with
// one thread, for as long as this page lives.
const READY_MS = 20_000;
// Four at most: more gain little and take the phone's fast cores from the camera picture
const THREADS = 4;
let threads = THREADS;
let ready: Promise<void> | undefined;

async function getReady(): Promise<void> {
	const reply = await Promise.race([
		ask({ id: nextId++, type: 'prepare', files: filesFor(threads) }),
		new Promise<Reply>((resolve) =>
			setTimeout(() => resolve({ id: 0, ok: false, error: 'not ready in time' }), READY_MS)
		)
	]);
	if (reply.ok) return;
	worker?.terminate();
	worker = undefined;
	for (const [id, { resolve }] of waiting) resolve({ id, ok: false, error: reply.error });
	waiting.clear();
	if (threads === 1) throw new Error(reply.error);
	threads = 1;
	return getReady();
}

// Loads runtime and models and makes them ready, so the first reading does not have to wait.
export function prepareReader() {
	ready ??= getReady();
	// Failed for good (e.g. no connection to the own server): try again next time
	ready.catch(() => (ready = undefined));
	return ready;
}

// The text in a camera frame or picture. The picture stays in the browser.
export async function readText(
	source: ImageBitmapSource & {
		width?: number;
		height?: number;
		videoWidth?: number;
		videoHeight?: number;
	},
	options: ReadOptions = {}
): Promise<Reading> {
	// The copy is taken first: the caller may give the picture back while the reader gets ready
	let picture: ImageBitmap;
	if (options.square) {
		const width = source.videoWidth ?? source.width ?? 0;
		const height = source.videoHeight ?? source.height ?? 0;
		const part = searchedPart({ width, height });
		picture = part.width
			? await createImageBitmap(source, part.x, part.y, part.width, part.height)
			: await createImageBitmap(source);
	} else {
		picture = await createImageBitmap(source);
	}
	try {
		await prepareReader();
	} catch (err) {
		picture.close();
		throw err;
	}
	if (options.square && !options.pixels) options = { ...options, pixels: CAMERA_PIXELS };
	const reply = await ask(
		{ id: nextId++, type: 'read', files: filesFor(threads), picture, options },
		[picture]
	);
	if (!reply.ok || !reply.reading) throw new Error(reply.ok ? 'no reading' : reply.error);
	return reply.reading;
}

const WARM_KEY = 'hdpantry_reader';

// Whether this device has the files of the reader already (see warmReader): then making it
// ready costs no download and can begin at once.
export function readerAtHand() {
	try {
		return localStorage.getItem(WARM_KEY) === READER_FILES.join('|');
	} catch {
		return false;
	}
}

// Fetches the files of the reader in the background, once per device and version of the reader,
// and then makes the reader ready – so that it is there the moment a code cannot be scanned,
// instead of starting to load in front of the freezer. Skipped while the device asks to save
// data; then all of it happens when first needed. Never throws.
export async function warmReader() {
	const mark = READER_FILES.join('|');
	try {
		const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
		if (connection?.saveData) return;
		if (localStorage.getItem(WARM_KEY) !== mark) {
			// On the very first visit the service worker is still settling in: wait for it (not
			// for ever), so the files land in its lasting store and not only in the browser's own
			if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
				await Promise.race([
					new Promise((resolve) =>
						navigator.serviceWorker.addEventListener('controllerchange', resolve, {
							once: true
						})
					),
					new Promise((resolve) => setTimeout(resolve, 8000))
				]);
			}
			for (const url of READER_FILES) {
				const response = await fetch(url);
				if (!response.ok) return;
				// Read to the end: only then the browser keeps the file
				await response.arrayBuffer();
			}
			localStorage.setItem(WARM_KEY, mark);
		}
		await prepareReader();
	} catch {
		// no connection, no storage: next time
	}
}
