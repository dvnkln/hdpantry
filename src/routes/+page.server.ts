import { listStock, sinceOf } from '$lib/server/items';
import { productStock } from '$lib/server/products';
import { getSetting, soonDays } from '$lib/server/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	// Containers and products in one list: each entry says where it leads and what kind it is.
	// A product is one entry per place of storage, with the number of its packs there.
	const contents = listStock().map(({ createdAt, storedOn, ...item }) => ({
		...item,
		kind: 'container' as const,
		key: `c${item.id}`,
		href: `/containers/${item.containerId}`,
		dateMonth: false,
		packs: 0,
		shape: null,
		since: sinceOf({ createdAt, storedOn })
	}));
	const packs = productStock().map(({ createdAt, storedOn, productId, ...product }) => ({
		...product,
		kind: 'product' as const,
		key: `p${productId}-${product.location}`,
		href: `/products/${productId}`,
		since: sinceOf({ createdAt, storedOn })
	}));
	return {
		stock: [...contents, ...packs],
		// Today in the time zone of the server (TZ): decides what counts as expired
		today: new Date().toLocaleDateString('sv-SE'),
		soonDays: soonDays(),
		// The list of one place of storage drawn inside its fridge, freezer or cabinet
		scene: getSetting('stockScene') === 'on'
	};
};
