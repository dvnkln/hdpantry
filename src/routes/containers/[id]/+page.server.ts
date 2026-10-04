import { redirect } from '@sveltejs/kit';
import { containerOf } from '$lib/server/containers';
import { activeItem, removeActiveItem } from '$lib/server/items';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals }) => {
	const c = containerOf(params.id, locals.locale);
	const item = activeItem(c.id);
	return {
		item: item
			? {
					name: item.name,
					note: item.note,
					vacuumed: item.vacuumed,
					location: item.location,
					bestBefore: item.bestBefore,
					category: item.category,
					fill: item.fill,
					amount: item.amount,
					unit: item.unit,
					createdAt: item.createdAt.toISOString()
				}
			: null,
		container: {
			id: c.id,
			code: c.code,
			size: c.size,
			source: c.source,
			manual: c.manual
		}
	};
};

export const actions: Actions = {
	// Eaten: the container is empty again
	eaten: ({ params, locals }) => {
		const c = containerOf(params.id, locals.locale);
		removeActiveItem(c.id);
		redirect(303, '/');
	}
};
