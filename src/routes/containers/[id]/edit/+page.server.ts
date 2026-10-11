import { fail, redirect } from '@sveltejs/kit';
import { readItemForm } from '$lib/items';
import { containerOf } from '$lib/server/containers';
import { foodMemoryAll, learnFood } from '$lib/server/food';
import { serverMessages } from '$lib/server/i18n';
import { activeItem, sinceOf, updateActiveItem } from '$lib/server/items';
import type { Actions, PageServerLoad } from './$types';

// Today in the time zone of the server (TZ)
const today = () => new Date().toLocaleDateString('sv-SE');

export const load: PageServerLoad = ({ params, locals }) => {
	const c = containerOf(params.id, locals.locale);
	const item = activeItem(c.id);
	// Nothing to correct in an empty container
	if (!item) redirect(303, `/containers/${c.id}`);
	return {
		container: { id: c.id, source: c.source },
		today: today(),
		memory: foodMemoryAll(),
		item: {
			name: item.name,
			note: item.note,
			vacuumed: item.vacuumed,
			location: item.location,
			bestBefore: item.bestBefore,
			dateManual: item.dateManual,
			// Suggested dates count from the day the content went in
			storedOn: sinceOf(item),
			category: item.category ?? ('other' as const),
			icon: item.icon,
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
		const { values, problem } = readItemForm(await request.formData(), today());
		if (!values) return fail(400, { error: t.item.problems[problem] });
		updateActiveItem(c.id, values);
		learnFood(values.name, values.category, values.icon);
		redirect(303, '/');
	}
};
