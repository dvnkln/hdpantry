import { fail, redirect } from '@sveltejs/kit';
import { codeLabel, isCodeSource, type CodeSource } from '$lib/containers';
import {
	addScanned,
	containersToPick,
	convertToScanned,
	openScanned,
	openTyped,
	type Container
} from '$lib/server/containers';
import { serverMessages } from '$lib/server/i18n';
import { activeItem, containerHistory } from '$lib/server/items';
import type { Actions, PageServerLoad } from './$types';

// A full container shows its content; an empty one asks right away what goes in.
function pageOf(container: Container) {
	return activeItem(container.id)
		? `/containers/${container.id}`
		: `/containers/${container.id}/add`;
}

async function read(request: Request) {
	const data = await request.formData();
	const source = data.get('source');
	return {
		raw: String(data.get('raw') ?? ''),
		source: (isCodeSource(source) ? source : null) as CodeSource | null,
		twinId: Number(data.get('twin'))
	};
}

// The containers there are, to choose from when recording without the camera. Tapping one is
// like scanning it: a full one shows its content, an empty one asks what goes in.
export const load: PageServerLoad = () => ({
	containers: containersToPick().map((c) => ({
		...c,
		href: c.content === null ? `/containers/${c.id}/add` : `/containers/${c.id}`
	}))
});

export const actions: Actions = {
	// A code was read. It leads on without any question – except when a scanned code was
	// typed in by hand before: then the user says whether the two are the same container.
	found: async ({ request, locals }) => {
		const { raw, source } = await read(request);
		const unreadable = () => fail(400, { error: serverMessages(locals.locale).scan.unreadable });

		if (source === 'manual') {
			const container = openTyped(raw);
			if (!container) return unreadable();
			redirect(303, pageOf(container));
		}
		const result = openScanned(raw, source);
		if (!result) return unreadable();
		if (result.container) redirect(303, pageOf(result.container));
		const twin = result.twin;
		return {
			twin: {
				id: twin.id,
				label: codeLabel(twin),
				content: activeItem(twin.id)?.name ?? null,
				history: containerHistory(twin.id, 1000).length
			}
		};
	},

	// "The same container": the typed one becomes the scanned one.
	merge: async ({ request, locals }) => {
		const { raw, source, twinId } = await read(request);
		const container = convertToScanned(twinId, raw, source) ?? addScanned(raw, source);
		if (!container) return fail(400, { error: serverMessages(locals.locale).scan.unreadable });
		redirect(303, pageOf(container));
	},

	// "Not the same": the scanned code gets its own container.
	separate: async ({ request, locals }) => {
		const { raw, source } = await read(request);
		const container = addScanned(raw, source);
		if (!container) return fail(400, { error: serverMessages(locals.locale).scan.unreadable });
		redirect(303, pageOf(container));
	}
};
