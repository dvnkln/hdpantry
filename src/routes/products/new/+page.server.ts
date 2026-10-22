import { fail, redirect } from '@sveltejs/kit';
import { parseProductCode } from '$lib/codes';
import { MAX_ITEM_NAME, oneLine } from '$lib/items';
import { readPackForm, readProductForm, suggestedName, tidyBrand } from '$lib/products';
import { foodMemoryAll, learnFood } from '$lib/server/food';
import { serverMessages } from '$lib/server/i18n';
import { lastLocation, recentNames } from '$lib/server/items';
import { lookupOn, lookupProduct } from '$lib/server/lookup';
import { addPacks, createProduct, findProduct, knownBrands } from '$lib/server/products';
import type { Actions, PageServerLoad } from './$types';

// Today in the time zone of the server (TZ)
const today = () => new Date().toLocaleDateString('sv-SE');

// A product comes here with its barcode (scanned or typed, ?barcode=) or with a name only
// (typed under "record", ?name=) – a product without a code, such as bread from the baker.
function barcodeOf(url: URL) {
	return parseProductCode(url.searchParams.get('barcode') ?? '');
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const barcode = barcodeOf(url);
	// Known meanwhile (scanned twice, the back button): just add packs
	const known = barcode ? findProduct(barcode) : undefined;
	if (known) redirect(303, `/products/${known.id}/add`);
	// What the product database knows, if it may be asked. Waited for (mostly well below a
	// second, at most a few): with a name the page starts at its second step, like a known
	// product – nothing to type, the name can still be changed there.
	const found = barcode ? await lookupProduct(barcode, locals.locale) : null;
	const suggested = suggestedName(found);
	const brands = knownBrands();
	return {
		barcode,
		found,
		fromDatabase: !!suggested,
		// The maker the database names, spelled as known already
		brand: tidyBrand(found?.brand ?? null, brands),
		brands,
		lookupOn: lookupOn(),
		name: suggested ?? oneLine(url.searchParams.get('name'), MAX_ITEM_NAME),
		example: Math.random(),
		location: lastLocation(),
		today: today(),
		memory: foodMemoryAll(),
		recent: recentNames()
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const t = serverMessages(locals.locale);
		const data = await request.formData();
		const product = readProductForm(data);
		if (!product.values) return fail(400, { error: t.products.problems.name });
		const pack = readPackForm(data, today());
		if (!pack.values) return fail(400, { error: t.products.problems[pack.problem] });
		const barcode = barcodeOf(url);
		const created =
			(barcode && findProduct(barcode)) ||
			createProduct({ ...product.values, barcode, location: pack.values.location });
		addPacks(created.id, pack.values);
		learnFood(product.values.name, product.values.category, product.values.icon);
		redirect(303, '/');
	}
};
