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

async function createDetector(): Promise<BarcodeDetector> {
	const native = (globalThis as { BarcodeDetector?: NativeDetector }).BarcodeDetector;
	if (native) {
		try {
			const supported = await native.getSupportedFormats();
			// Only if it can really read QR codes (some desktop browsers have an empty reader)
			if (supported.includes('qr_code')) {
				return new native({ formats: FORMATS.filter((f) => supported.includes(f)) });
			}
		} catch {
			// fall through to the bundled reader
		}
	}
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

let detector: Promise<BarcodeDetector> | undefined;

// The first code found in a video frame or picture, or null.
export async function readCode(source: ImageBitmapSource): Promise<Code | null> {
	detector ??= createDetector();
	let ready: BarcodeDetector;
	try {
		ready = await detector;
	} catch (err) {
		detector = undefined; // try again next time
		throw err;
	}
	const [hit] = await ready.detect(source);
	return hit ? { text: hit.rawValue, format: hit.format } : null;
}

// Whether a scanned text looks like a web address. It is only ever shown, never opened.
export function looksLikeUrl(text: string) {
	return /^https?:\/\/\S+$/i.test(text.trim());
}
