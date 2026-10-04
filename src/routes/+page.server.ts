import { listStock } from '$lib/server/items';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		stock: listStock().map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
		// Today in the time zone of the server (TZ): decides what counts as expired
		today: new Date().toLocaleDateString('sv-SE')
	};
};
