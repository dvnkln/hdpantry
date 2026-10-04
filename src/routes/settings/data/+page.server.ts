import { fail } from '@sveltejs/kit';
import { backupCounts, parseBackup } from '$lib/backup';
import { importBackup, stockCounts } from '$lib/server/backup';
import { serverMessages } from '$lib/server/i18n';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ counts: stockCounts() });

export const actions: Actions = {
	// Replaces the whole stock – only with the typed word, and only if the whole file is usable
	import: async ({ request, locals }) => {
		const t = serverMessages(locals.locale).settings;
		const data = await request.formData();

		const result = parseBackup(String(data.get('backup') ?? ''));
		if (!result.ok) {
			const { problem } = result;
			const error =
				problem.kind === 'invalid'
					? t.dataProblems.invalid(problem.where)
					: t.dataProblems[problem.kind];
			return fail(400, { error });
		}
		if (String(data.get('confirm') ?? '').trim() !== t.dataWord) {
			return fail(400, { error: t.dataWrongWord });
		}

		importBackup(result.backup);
		return { imported: backupCounts(result.backup) };
	}
};
