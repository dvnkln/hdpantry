import type { LayoutServerLoad } from './$types';

// Makes the logged-in user and the interface language available to all pages.
export const load: LayoutServerLoad = ({ locals }) => {
	return { user: locals.user, locale: locals.locale };
};
