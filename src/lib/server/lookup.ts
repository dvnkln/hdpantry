// The name of a new product, asked of Open Food Facts – a free product database kept by its
// users (https://world.openfoodfacts.org). Only if the user switched it on (setting
// `productLookup`, off by default): it is the one connection to the outside besides
// notifications, and it goes from the server, never from the browser. Only the barcode is sent.
// Each barcode is asked once; the answer (also "not known") is kept in `product_lookups`.
import { eq } from 'drizzle-orm';
import type { Locale } from '$lib/i18n/index.svelte';
import { looksFrozen, shapeFromDatabase, type Lookup } from '$lib/products';
import pkg from '../../../package.json';
import { getDb } from './db';
import { productLookups } from './db/schema';
import { getSetting } from './settings';

export const LOOKUP_URL = 'https://world.openfoodfacts.org/api/v2/product/';
// The database asks every app to say who it is
const AGENT = `hdpantry/${pkg.version} (+https://github.com/dvnkln/hdpantry)`;
// Whoever scans waits for the name: an answer that takes longer is not waited for
const WAIT_MS = 4000;

export function lookupOn() {
	return getSetting('productLookup') === 'on';
}

// A kind as the database writes it ("en:frozen-vegetables") as words ("frozen vegetables").
// Only English and German ones: those are the languages the dictionary knows.
function words(tag: string) {
	const match = /^(en|de):(.+)$/.exec(tag);
	return match ? match[2].replace(/-/g, ' ').trim() : '';
}

const text = (value: unknown, max = 200) =>
	typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

// What the answer says, read carefully: it comes from outside
export function readAnswer(data: unknown, locale: Locale): Lookup | null {
	if (typeof data !== 'object' || data === null) return null;
	const product = (data as { product?: unknown }).product;
	if ((data as { status?: unknown }).status !== 1 || typeof product !== 'object' || !product) {
		return null;
	}
	const p = product as Record<string, unknown>;
	const tags = Array.isArray(p.categories_tags)
		? p.categories_tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 40)
		: [];
	// The most specific kinds come last in the list
	const kinds = tags.map(words).filter(Boolean).reverse();
	const description = [text(p[`generic_name_${locale}`]), text(p.generic_name)].filter(Boolean);
	const name =
		text(p[`product_name_${locale}`], 80) ||
		text(p.product_name, 80) ||
		text(p[`generic_name_${locale}`], 80) ||
		null;
	// Several makers or brands are listed with commas: the first is the one on the pack
	const brand = text(p.brands, 200).split(',')[0].trim().slice(0, 40) || null;
	return {
		name,
		brand,
		hints: [...new Set([...description, ...kinds])].slice(0, 20),
		frozen: tags.some(looksFrozen),
		shape: shapeFromDatabase(
			Array.isArray(p.packaging_shapes_tags)
				? p.packaging_shapes_tags.filter((tag): tag is string => typeof tag === 'string')
				: [],
			text(p.packaging, 500)
		)
	};
}

// What the database knows about a barcode, or null (switched off, not known, no answer).
// Never throws: without an answer the product is simply recorded by hand.
export async function lookupProduct(barcode: string, locale: Locale): Promise<Lookup | null> {
	if (!lookupOn()) return null;
	const db = getDb();
	const kept = db.select().from(productLookups).where(eq(productLookups.barcode, barcode)).get();
	// Kept before the maker was taken along (no maker recorded at all): asked once more
	if (kept && !(kept.found && kept.brand === null)) {
		return kept.found
			? {
					name: kept.name,
					brand: kept.brand || null,
					hints: kept.hints?.split('\n') ?? [],
					frozen: kept.frozen,
					shape: kept.shape
				}
			: null;
	}
	const fields = [
		'product_name',
		`product_name_${locale}`,
		'generic_name',
		`generic_name_${locale}`,
		'brands',
		'packaging',
		'packaging_shapes_tags',
		'categories_tags'
	].join(',');
	let answer: Lookup | null;
	try {
		const response = await fetch(`${LOOKUP_URL}${barcode}?fields=${fields}`, {
			headers: { 'User-Agent': AGENT, Accept: 'application/json' },
			redirect: 'error',
			signal: AbortSignal.timeout(WAIT_MS)
		});
		// 404: the database does not know it – kept, so it is not asked again
		if (!response.ok && response.status !== 404) return null;
		answer = readAnswer(await response.json(), locale);
	} catch (err) {
		console.error(`Product lookup failed: ${err instanceof Error ? err.message : String(err)}`);
		return null;
	}
	db.insert(productLookups)
		.values({
			barcode,
			found: answer !== null,
			name: answer?.name ?? null,
			brand: answer?.brand ?? '',
			hints: answer?.hints.join('\n') || null,
			frozen: answer?.frozen ?? false,
			shape: answer?.shape ?? null
		})
		.onConflictDoUpdate({
			target: productLookups.barcode,
			set: {
				found: answer !== null,
				name: answer?.name ?? null,
				brand: answer?.brand ?? '',
				hints: answer?.hints.join('\n') || null,
				frozen: answer?.frozen ?? false,
				shape: answer?.shape ?? null,
				lookedAt: new Date()
			}
		})
		.run();
	return answer;
}
