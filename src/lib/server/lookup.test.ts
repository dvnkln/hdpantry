import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDb } from './db';
import { productLookups } from './db/schema';
import { LOOKUP_URL, lookupProduct, readAnswer } from './lookup';
import { setSettings } from './settings';

// Invented numbers and products
const CODE = '9991234567890';
const answer = (product: Record<string, unknown>) =>
	new Response(JSON.stringify({ code: CODE, status: 1, product }), { status: 200 });
const notFound = () =>
	new Response(JSON.stringify({ code: CODE, status: 0, status_verbose: 'product not found' }), {
		status: 404
	});

beforeEach(() => {
	getDb().delete(productLookups).run();
	setSettings({ productLookup: 'on' });
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('asking the product database', () => {
	it('switched off (the default): nothing leaves the server', async () => {
		setSettings({ productLookup: 'off' });
		expect(await lookupProduct(CODE, 'de')).toBeNull();
		expect(fetch).not.toHaveBeenCalled();
	});

	it('sends only the barcode, says who asks, follows no redirect, waits not for ever', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(answer({ product_name: 'Quixo Peas' }));
		await lookupProduct(CODE, 'de');
		const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
		expect(url.startsWith(`${LOOKUP_URL}${CODE}?fields=`)).toBe(true);
		expect(new URL(url).host).toBe('world.openfoodfacts.org');
		expect((init.headers as Record<string, string>)['User-Agent']).toMatch(/^hdpantry\//);
		expect(init.redirect).toBe('error');
		expect(init.signal).toBeInstanceOf(AbortSignal);
		expect(init.body).toBeUndefined();
	});

	it('name in the language of the app; description and kinds as hints; frozen', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			answer({
				product_name: 'Quixo Peas',
				product_name_de: 'Junge Erbsen',
				brands: 'Quixo, Quixo Foods',
				generic_name_de: 'Junge Erbsen, tiefgefroren',
				packaging_shapes_tags: ['en:bag'],
				packaging: 'Kunststoffbeutel',
				categories_tags: [
					'en:plant-based-foods',
					'en:frozen-foods',
					'en:frozen-vegetables',
					'fr:petits-pois'
				]
			})
		);
		expect(await lookupProduct(CODE, 'de')).toEqual({
			name: 'Junge Erbsen',
			brand: 'Quixo',
			hints: [
				'Junge Erbsen, tiefgefroren',
				'frozen vegetables',
				'frozen foods',
				'plant based foods'
			],
			frozen: true,
			shape: 'bag'
		});
	});

	it('asks once per barcode – also when the product is not known', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(answer({ product_name: 'Quixo Peas' }));
		await lookupProduct(CODE, 'en');
		expect((await lookupProduct(CODE, 'en'))?.name).toBe('Quixo Peas');
		vi.mocked(fetch).mockResolvedValueOnce(notFound());
		expect(await lookupProduct('99123451', 'en')).toBeNull();
		expect(await lookupProduct('99123451', 'en')).toBeNull();
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('without an answer (no connection, too slow, server trouble) asks again next time', async () => {
		vi.mocked(fetch).mockRejectedValueOnce(new Error('timeout'));
		expect(await lookupProduct(CODE, 'en')).toBeNull();
		vi.mocked(fetch).mockResolvedValueOnce(new Response('busy', { status: 503 }));
		expect(await lookupProduct(CODE, 'en')).toBeNull();
		vi.mocked(fetch).mockResolvedValueOnce(answer({ product_name: 'Quixo Peas' }));
		expect((await lookupProduct(CODE, 'en'))?.name).toBe('Quixo Peas');
		expect(fetch).toHaveBeenCalledTimes(3);
	});
});

it('an answer kept before the maker was taken along is asked once more', async () => {
	getDb()
		.insert(productLookups)
		.values({ barcode: CODE, found: true, name: 'Nut mix', brand: null, hints: null })
		.run();
	vi.mocked(fetch).mockResolvedValueOnce(answer({ product_name: 'Nut mix', brands: 'Quixo' }));
	expect((await lookupProduct(CODE, 'en'))?.brand).toBe('Quixo');
	expect((await lookupProduct(CODE, 'en'))?.brand).toBe('Quixo');
	expect(fetch).toHaveBeenCalledTimes(1);
});

describe('reading the answer', () => {
	it('takes nothing that is not what was expected', () => {
		expect(readAnswer(null, 'en')).toBeNull();
		expect(readAnswer({ status: 0 }, 'en')).toBeNull();
		expect(readAnswer({ status: 1, product: 'x' }, 'en')).toBeNull();
		expect(
			readAnswer({ status: 1, product: { product_name: 42, categories_tags: 'en:x' } }, 'en')
		).toEqual({ name: null, brand: null, hints: [], frozen: false, shape: null });
	});
	it('keeps names short and on one line', () => {
		const long = `Quixo\n${'x'.repeat(300)}`;
		expect(readAnswer({ status: 1, product: { product_name: long } }, 'en')?.name).toHaveLength(80);
	});
});
