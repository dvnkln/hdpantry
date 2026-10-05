import { fail } from '@sveltejs/kit';
import { KEEP_CHOICES, isFrequency, isTime } from '$lib/schedule';
import {
	backupSettings,
	backupState,
	databaseSize,
	deleteBackup,
	listBackups,
	nextBackup,
	runBackup,
	saveBackupSettings
} from '$lib/server/backups';
import { serverMessages } from '$lib/server/i18n';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	...backupSettings(),
	...backupState(),
	next: nextBackup(),
	files: listBackups(),
	databaseSize: databaseSize()
});

export const actions: Actions = {
	// Switch and schedule belong together: saved with one button. Only what is valid is changed.
	save: async ({ request, locals }) => {
		const t = serverMessages(locals.locale);
		const data = await request.formData();
		const frequency = data.get('frequency');
		const time = String(data.get('time') ?? '');
		const weekday = data.has('weekday') ? Number(data.get('weekday')) : NaN;
		const keep = Number(data.get('keep'));
		if (
			!isFrequency(frequency) ||
			!isTime(time) ||
			!(KEEP_CHOICES as readonly number[]).includes(keep)
		) {
			return fail(400, { error: t.common.invalid });
		}
		saveBackupSettings({
			enabled: data.get('enabled') === 'on',
			frequency,
			time,
			keep,
			...(Number.isInteger(weekday) && weekday >= 0 && weekday <= 6 && { weekday })
		});
		return { message: t.settings.saved };
	},

	run: async () => {
		const error = await runBackup();
		return error ? fail(500, { error }) : { message: '' };
	},

	delete: async ({ request }) => {
		deleteBackup(String((await request.formData()).get('name') ?? ''));
		return { done: true };
	}
};
