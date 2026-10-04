import { fail } from '@sveltejs/kit';
import {
	changeCode,
	containerOverview,
	deleteAllContainers,
	deleteContainer,
	mergeContainers
} from '$lib/server/containers';
import { serverMessages } from '$lib/server/i18n';
import { setSettings } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { containers: containerOverview() };
};

export const actions: Actions = {
	// How food symbols are drawn
	iconStyle: async ({ request }) => {
		const style = (await request.formData()).get('style');
		setSettings({ iconStyle: style === 'line' ? 'line' : 'color' });
		return { done: true };
	},

	deleteContainer: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (Number.isInteger(id)) deleteContainer(id);
		return { done: true };
	},

	changeCode: async ({ request, locals }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const result = changeCode(id, String(data.get('code') ?? ''));
		if (result !== 'ok') {
			return fail(400, { id, error: serverMessages(locals.locale).settings.codeProblems[result] });
		}
		return { done: true };
	},

	merge: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		const result = mergeContainers(id);
		if (result !== 'ok') {
			return fail(400, { id, error: serverMessages(locals.locale).settings.mergeProblems[result] });
		}
		return { done: true };
	},

	// Everything goes: only with the typed word.
	deleteAll: async ({ request, locals }) => {
		const t = serverMessages(locals.locale).settings;
		if (String((await request.formData()).get('confirm') ?? '').trim() !== t.deleteWord) {
			return fail(400, { id: 0, error: t.wrongWord });
		}
		deleteAllContainers();
		return { done: true };
	}
};
