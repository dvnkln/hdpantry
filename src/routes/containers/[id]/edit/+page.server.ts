import { fail, redirect } from '@sveltejs/kit';
import { readItemForm } from '$lib/items';
import { containerOf } from '$lib/server/containers';
import { serverMessages } from '$lib/server/i18n';
import { activeItem, updateActiveItem } from '$lib/server/items';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals }) => {
	const c = containerOf(params.id, locals.locale);
	const item = activeItem(c.id);
	// Nothing to correct in an empty container
	if (!item) redirect(303, `/containers/${c.id}`);
	return {
		container: { id: c.id, source: c.source },
		item: {
			name: item.name,
			note: item.note,
			vacuumed: item.vacuumed,
			location: item.location,
			bestBefore: item.bestBefore,
			fill: item.fill,
			amount: item.amount,
			unit: item.unit
		}
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
		const t = serverMessages(locals.locale);
		const c = containerOf(params.id, locals.locale);
		const { values, problem } = readItemForm(await request.formData());
		if (!values) return fail(400, { error: t.item.problems[problem] });
		updateActiveItem(c.id, values);
		redirect(303, `/containers/${c.id}`);
	}
};
