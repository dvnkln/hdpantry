import { fail, redirect } from '@sveltejs/kit';
import { readPackForm } from '$lib/products';
import { serverMessages } from '$lib/server/i18n';
import { addPacks, productOf } from '$lib/server/products';
import type { Actions, PageServerLoad } from './$types';

// Today in the time zone of the server (TZ)
const today = () => new Date().toLocaleDateString('sv-SE');

export const load: PageServerLoad = ({ params, locals }) => {
	const p = productOf(params.id, locals.locale);
	return {
		product: {
			id: p.id,
			name: p.name,
			icon: p.icon,
			category: p.category ?? ('other' as const),
			location: p.location
		},
		today: today()
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
		const t = serverMessages(locals.locale);
		const p = productOf(params.id, locals.locale);
		const pack = readPackForm(await request.formData(), today());
		if (!pack.values) return fail(400, { error: t.products.problems[pack.problem] });
		addPacks(p.id, pack.values);
		redirect(303, '/');
	}
};
