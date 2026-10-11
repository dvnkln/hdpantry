import { fail } from '@sveltejs/kit';
import { diagnosticsOn } from '$lib/server/diagnostics';
import type { Actions, PageServerLoad } from './$types';

const MAX_LENGTH = 6000;

export const load: PageServerLoad = () => ({ diagnostics: diagnosticsOn() });

export const actions: Actions = {
	log: async ({ request }) => {
		if (!diagnosticsOn()) return fail(404);
		const text = String((await request.formData()).get('summary') ?? '').slice(0, MAX_LENGTH);
		let summary: unknown;
		try {
			summary = JSON.parse(text);
		} catch {
			return fail(400);
		}
		// One line, so it can be found and read with `docker logs`
		console.log(`[check] ${JSON.stringify(summary)}`);
		return { logged: true };
	}
};
