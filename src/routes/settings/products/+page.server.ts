import { lookupOn } from '$lib/server/lookup';
import { fail } from '@sveltejs/kit';
import { serverMessages } from '$lib/server/i18n';
import { deleteAllProducts, deleteProduct, productOverview } from '$lib/server/products';
import { setSettings } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ products: productOverview(), lookup: lookupOn() });

export const actions: Actions = {
	// Asking Open Food Facts for the name of a new product (see lookup.ts): off by default
	lookup: async ({ request }) => {
		const on = (await request.formData()).get('productLookup') === 'on';
		setSettings({ productLookup: on ? 'on' : 'off' });
		return { done: true };
	},

	// Everything goes: only with the typed word (the page asks for it too).
	deleteAll: async ({ request, locals }) => {
		const t = serverMessages(locals.locale).settings;
		if (String((await request.formData()).get('confirm') ?? '').trim() !== t.deleteWord) {
			return fail(400, { error: t.wrongWord });
		}
		deleteAllProducts();
		return { done: true };
	},

	deleteProduct: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (Number.isInteger(id)) deleteProduct(id);
		return { done: true };
	}
};
