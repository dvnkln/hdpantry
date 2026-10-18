import { redirect } from '@sveltejs/kit';
import { sinceOf } from '$lib/server/items';
import { eatPack, packsOf, productHistory, productOf } from '$lib/server/products';
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
			category: p.category,
			barcode: p.barcode,
			location: p.location
		},
		// In stock, the one to eat first first
		packs: packsOf(p.id).map((pack) => ({
			id: pack.id,
			bestBefore: pack.bestBefore,
			dateMonth: pack.dateMonth,
			location: pack.location,
			since: sinceOf(pack)
		})),
		history: productHistory(p.id).map((pack) => ({
			id: pack.id,
			name: pack.name,
			eaten: pack.removedAt!.toLocaleDateString('sv-SE')
		})),
		// Today in the time zone of the server (TZ): decides what counts as expired
		today: new Date().toLocaleDateString('sv-SE'),
		soonDays: soonDays()
	};
};

export const actions: Actions = {
	// One pack eaten: the one chosen, else the one to eat first
	eaten: async ({ params, request, locals }) => {
		const p = productOf(params.id, locals.locale);
		const pack = Number((await request.formData()).get('pack'));
		eatPack(p.id, pack > 0 ? pack : undefined);
		redirect(303, '/');
	}
};
