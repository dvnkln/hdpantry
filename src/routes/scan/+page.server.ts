import { fail, redirect } from '@sveltejs/kit';
import { parseCode } from '$lib/codes';
import { addContainer, findContainerByCode } from '$lib/server/containers';
import { serverMessages } from '$lib/server/i18n';
import type { Actions } from './$types';

export const actions: Actions = {
	// A code was read: known containers open right away, unknown ones are offered to be added.
	found: async ({ request, locals }) => {
		const raw = String((await request.formData()).get('raw') ?? '');
		const parsed = parseCode(raw);
		if (!parsed) return fail(400, { error: serverMessages(locals.locale).scan.unreadable });

		const known = findContainerByCode(parsed.id);
		if (known) redirect(303, `/containers/${known.id}`);
		return { unknown: { raw: raw.trim(), code: parsed.id, size: parsed.size } };
	},

	create: async ({ request, locals }) => {
		const data = await request.formData();
		const container = addContainer(String(data.get('raw') ?? ''), String(data.get('name') ?? ''));
		if (!container) return fail(400, { error: serverMessages(locals.locale).scan.unreadable });
		redirect(303, `/containers/${container.id}`);
	}
};
