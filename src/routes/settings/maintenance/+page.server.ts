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
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	...backupSettings(),
	...backupState(),
	next: nextBackup(),
	files: listBackups(),
	databaseSize: databaseSize()
});

// Every choice is saved as soon as it is made
export const actions: Actions = {
	toggle: async ({ request }) => {
		saveBackupSettings({ enabled: (await request.formData()).get('enabled') === 'on' });
		return { done: true };
	},

	// Only what was sent and is valid is changed
	schedule: async ({ request }) => {
		const data = await request.formData();
		const frequency = data.get('frequency');
		const time = String(data.get('time') ?? '');
		const weekday = data.has('weekday') ? Number(data.get('weekday')) : NaN;
		const keep = data.has('keep') ? Number(data.get('keep')) : NaN;
		saveBackupSettings({
			...(isFrequency(frequency) && { frequency }),
			...(isTime(time) && { time }),
			...(Number.isInteger(weekday) && weekday >= 0 && weekday <= 6 && { weekday }),
			...((KEEP_CHOICES as readonly number[]).includes(keep) && { keep })
		});
		return { done: true };
	},

	run: async () => {
		const error = await runBackup();
		return error ? fail(500, { error }) : { done: true };
	},

	delete: async ({ request }) => {
		deleteBackup(String((await request.formData()).get('name') ?? ''));
		return { done: true };
	}
};
