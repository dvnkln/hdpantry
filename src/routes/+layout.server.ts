import type { LayoutServerLoad } from './$types';

// Makes the interface language available to all pages.
export const load: LayoutServerLoad = ({ locals }) => {
	return { locale: locals.locale };
};
