import { listStock, sinceOf } from '$lib/server/items';
import { getSetting, soonDays } from '$lib/server/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		stock: listStock().map(({ createdAt, storedOn, ...item }) => ({
			...item,
			since: sinceOf({ createdAt, storedOn })
		})),
		// Today in the time zone of the server (TZ): decides what counts as expired
		today: new Date().toLocaleDateString('sv-SE'),
		soonDays: soonDays(),
		// The list of one place of storage drawn inside its fridge, freezer or cabinet
		scene: getSetting('stockScene') === 'on'
	};
};
