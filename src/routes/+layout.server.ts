import { hasAnyUser } from '$lib/server/auth';
import { getSetting } from '$lib/server/settings';
import { themeFor } from '$lib/server/theme';
import type { LayoutServerLoad } from './$types';

// Makes the logged-in user and the interface language available to all pages.
export const load: LayoutServerLoad = (event) => {
	const { locals } = event;
	return {
		user: locals.user,
		locale: locals.locale,
		// Colour scheme of this page (also written into the HTML by hooks.server.ts)
		theme: themeFor(event),
		// How food symbols are drawn (see FoodIcon.svelte)
		iconStyle:
			hasAnyUser() && getSetting('iconStyle') === 'line' ? ('line' as const) : ('color' as const),
		// Whether a recognised code makes the phone vibrate (see CameraScanner.svelte)
		scanVibration: !hasAnyUser() || getSetting('scanVibration') !== 'off'
	};
};
