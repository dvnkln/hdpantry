import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, clearSessionCookie, deleteSession } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

// Logging out only works by form (POST), never by just opening the address.
export const load: PageServerLoad = () => redirect(303, '/');

export const actions: Actions = {
	default: ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (token) deleteSession(token);
		clearSessionCookie(cookies);
		redirect(303, '/login');
	}
};
