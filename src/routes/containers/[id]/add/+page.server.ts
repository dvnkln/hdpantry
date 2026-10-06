import { fail, redirect } from '@sveltejs/kit';
import { readItemForm } from '$lib/items';
import { containerOf } from '$lib/server/containers';
import { foodMemoryAll, learnFood } from '$lib/server/food';
import { serverMessages } from '$lib/server/i18n';
import {
	activeItem,
	addItem,
	containerHistory,
	lastLocation,
	recentNames,
	replaceItem
} from '$lib/server/items';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals, url }) => {
	const c = containerOf(params.id, locals.locale);
	// A full container is shown, not filled a second time – unless its content is to be
	// replaced (?replace=1): then the old one stays until the new one is saved
	const current = activeItem(c.id);
	const replacing = current && url.searchParams.has('replace') ? current.name : null;
	if (current && !replacing) redirect(303, `/containers/${c.id}`);
	return {
		replacing,
		// Picks the example name in the empty field, a different one each time
		example: Math.random(),
		container: { id: c.id, source: c.source },
		location: lastLocation(),
		// Today in the time zone of the server (TZ): suggested dates count from here
		today: new Date().toLocaleDateString('sv-SE'),
		memory: foodMemoryAll(),
		recent: recentNames(),
		history: containerHistory(c.id).map((item) => ({
			id: item.id,
			name: item.name,
			note: item.note,
			vacuumed: item.vacuumed,
			category: item.category ?? ('other' as const),
			icon: item.icon,
			location: item.location,
			fill: item.fill,
			amount: item.amount,
			unit: item.unit,
			createdAt: item.createdAt.toISOString()
		}))
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals, url }) => {
		const t = serverMessages(locals.locale);
		const c = containerOf(params.id, locals.locale);
		const { values, problem } = readItemForm(await request.formData());
		if (!values) return fail(400, { error: t.item.problems[problem] });
		if (url.searchParams.has('replace')) replaceItem(c.id, values);
		else if (!addItem(c.id, values)) return fail(409, { error: t.item.alreadyFull });
		learnFood(values.name, values.category, values.icon);
		redirect(303, '/');
	}
};
