import { fail, redirect } from '@sveltejs/kit';
import { readPackGroups, readProductForm } from '$lib/products';
import { foodMemoryAll, learnFood } from '$lib/server/food';
import { serverMessages } from '$lib/server/i18n';
import { correctPacks, packGroups, productOf, updateProduct } from '$lib/server/products';
import { soonDays } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals }) => {
	const p = productOf(params.id, locals.locale);
	return {
		product: {
			id: p.id,
			name: p.name,
			note: p.note,
			shape: p.shape ?? null,
			icon: p.icon,
			category: p.category ?? ('other' as const),
			location: p.location
		},
		groups: packGroups(p.id),
		soonDays: soonDays(),
		memory: foodMemoryAll(),
		today: new Date().toLocaleDateString('sv-SE')
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
		const t = serverMessages(locals.locale).products;
		const p = productOf(params.id, locals.locale);
		const data = await request.formData();
		const { values } = readProductForm(data);
		if (!values) return fail(400, { error: t.problems.name });
		const groups = readPackGroups(String(data.get('packs') ?? ''));
		if (!groups) return fail(400, { error: t.problems.packs });
		updateProduct(p.id, values);
		correctPacks(p.id, groups);
		learnFood(values.name, values.category, values.icon);
		redirect(303, '/');
	}
};
