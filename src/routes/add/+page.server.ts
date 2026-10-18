import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// "Record" became "type in" on the page for scanning (one field and one list for products and
// containers): old bookmarks and installed shortcuts lead there.
export const load: PageServerLoad = () => redirect(308, '/scan?manual');
