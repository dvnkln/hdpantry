import { error, redirect } from '@sveltejs/kit';
import { deleteContainer, getContainer, renameContainer } from '$lib/server/containers';
import { serverMessages } from '$lib/server/i18n';
import type { Actions, PageServerLoad } from './$types';

function containerOf(params: { id: string }, notFound: string) {
	const container = /^\d+$/.test(params.id) ? getContainer(Number(params.id)) : undefined;
	if (!container) error(404, notFound);
	return container;
}

export const load: PageServerLoad = ({ params, locals }) => {
	const c = containerOf(params, serverMessages(locals.locale).containers.notFound);
	return {
		container: {
			id: c.id,
			code: c.code,
			size: c.size,
			name: c.name,
			rawContent: c.rawContent,
			createdAt: c.createdAt.toISOString()
		}
	};
};

export const actions: Actions = {
	rename: async ({ params, request, locals }) => {
		const c = containerOf(params, serverMessages(locals.locale).containers.notFound);
		renameContainer(c.id, String((await request.formData()).get('name') ?? ''));
		return { saved: true };
	},
	delete: ({ params, locals }) => {
		const c = containerOf(params, serverMessages(locals.locale).containers.notFound);
		deleteContainer(c.id);
		redirect(303, '/containers');
	}
};
