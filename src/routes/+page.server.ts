import { listStock } from '$lib/server/items';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { stock: listStock() };
};
