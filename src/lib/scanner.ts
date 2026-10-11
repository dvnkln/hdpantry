// Reads QR codes and barcodes from a camera picture or a photo – entirely in the browser.
//
// Browsers with a built-in reader (Chrome on Android) use that one: nothing is downloaded.
// All others get the same interface from zxing-wasm, loaded only when a scan is needed. Its
// program file is bundled with the app: by default the library would fetch it from a foreign
// server, which hdpantry never does (and the CSP would block).
import type { BarcodeDetector, BarcodeFormat } from 'barcode-detector/ponyfill';

export type Code = { text: string; format: string };

// QR for the containers; the common barcodes cost nothing extra to recognise.
const FORMATS: BarcodeFormat[] = ['qr_code', 'data_matrix', 'ean_13', 'ean_8', 'code_128'];

type NativeDetector = typeof BarcodeDetector;

// The two readers there are: the one built into the browser, and the one that comes with the app.
export const READERS = ['native', 'bundled'] as const;
export type Reader = (typeof READERS)[number];

// The reader built into the browser, or null if it has none that can read QR codes (some
// desktop browsers have an empty one).
async function createNative(): Promise<BarcodeDetector | null> {
	const native = (globalThis as { BarcodeDetector?: NativeDetector }).BarcodeDetector;
	if (!native) return null;
	try {
		const supported = await native.getSupportedFormats();
		if (!supported.includes('qr_code')) return null;
		return new native({ formats: FORMATS.filter((f) => supported.includes(f)) });
	} catch {
		return null;
	}
}

async function createBundled(): Promise<BarcodeDetector> {
	const [{ BarcodeDetector: Bundled, prepareZXingModule }, { default: wasmUrl }] =
		await Promise.all([
			import('barcode-detector/ponyfill'),
			import('zxing-wasm/reader/zxing_reader.wasm?url')
		]);
	prepareZXingModule({
		overrides: {
			locateFile: (path: string, prefix: string) =>
				path.endsWith('.wasm') ? wasmUrl : prefix + path
		}
	});
	return new Bundled({ formats: FORMATS });
}

const detectors: { native?: Promise<BarcodeDetector | null>; bundled?: Promise<BarcodeDetector> } =
	{};

// One of the two readers, created on first use. null: the browser has no built-in one.
function detectorOf(reader: Reader): Promise<BarcodeDetector | null> {
	if (reader === 'native') return (detectors.native ??= createNative());
	const ready = (detectors.bundled ??= createBundled());
	// Loading failed (e.g. no connection to the own server): try again next time
	ready.catch(() => (detectors.bundled = undefined));
	return ready;
}

async function detectWith(detector: BarcodeDetector, source: ImageBitmapSource) {
	const [hit] = await detector.detect(source);
	return hit ? { text: hit.rawValue, format: hit.format } : null;
}

// The first code found in a video frame or picture, or null. Read by the reader of the
// browser where there is one, else by the one that comes with the app.
export async function readCode(source: ImageBitmapSource): Promise<Code | null> {
	const detector = (await detectorOf('native')) ?? (await detectorOf('bundled'));
	return detector ? detectWith(detector, source) : null;
}

// The same with one particular reader, and how long it took – for comparing the two
// ("check a code"). 'unavailable': this browser has no such reader.
export async function readWith(
	reader: Reader,
	source: ImageBitmapSource
): Promise<{ code: Code | null; ms: number } | 'unavailable'> {
	const detector = await detectorOf(reader);
	if (!detector) return 'unavailable';
	const start = performance.now();
	const code = await detectWith(detector, source);
	return { code, ms: performance.now() - start };
}

// What a running camera can do – shown on "check a code"
export type CameraInfo = {
	width: number;
	height: number;
	light: boolean;
	tapFocus: boolean;
	focusModes: string[];
};

type Size = { width: number; height: number };

// Where a tap on the visible camera picture lies in the whole frame of the camera, as shares
// from 0 to 1 – that is how a camera takes the point to focus on. The picture fills its box and
// is cut off at the sides or at top and bottom (object-fit: cover), so the tap has to be moved
// by what is cut off.
export function pointInFrame(tap: { x: number; y: number }, box: Size, frame: Size) {
	if (!box.width || !box.height || !frame.width || !frame.height) return { x: 0.5, y: 0.5 };
	const scale = Math.max(box.width / frame.width, box.height / frame.height);
	const shown = { width: frame.width * scale, height: frame.height * scale };
	const share = (value: number) => Math.min(1, Math.max(0, value));
	return {
		x: share((tap.x + (shown.width - box.width) / 2) / shown.width),
		y: share((tap.y + (shown.height - box.height) / 2) / shown.height)
	};
}

// Whether a scanned text looks like a web address. It is only ever shown, never opened.
export function looksLikeUrl(text: string) {
	return /^https?:\/\/\S+$/i.test(text.trim());
}
