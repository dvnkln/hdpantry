import { listStock } from '$lib/server/items';
import { getSetting, soonDays } from '$lib/server/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		stock: listStock().map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
		// Today in the time zone of the server (TZ): decides what counts as expired
		today: new Date().toLocaleDateString('sv-SE'),
		soonDays: soonDays(),
		// The list of one place of storage drawn inside its fridge, freezer or cabinet
		scene: getSetting('stockScene') === 'on'
	};
};
