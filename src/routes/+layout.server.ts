import { hasAnyUser } from '$lib/server/auth';
import { getSetting } from '$lib/server/settings';
import type { LayoutServerLoad } from './$types';

// Makes the logged-in user and the interface language available to all pages.
export const load: LayoutServerLoad = ({ locals }) => {
	return {
		user: locals.user,
		locale: locals.locale,
		// How food symbols are drawn (see FoodIcon.svelte)
		iconStyle:
			hasAnyUser() && getSetting('iconStyle') === 'line' ? ('line' as const) : ('color' as const)
	};
};
