import { fail } from '@sveltejs/kit';
import { isLocale } from '$lib/i18n/index.svelte';
import { serverMessages } from '$lib/server/i18n';
import { getSetting, setSettings, soonDays } from '$lib/server/settings';
import { SOON_CHOICES } from '$lib/stock';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { vibration: getSetting('scanVibration') !== 'off', soonDays: soonDays() };
};

// Every choice is saved the moment it is made (see $lib/autosave); each box is one form.
export const actions: Actions = {
	display: async ({ request, locals }) => {
		const data = await request.formData();
		const language = String(data.get('uiLanguage') ?? '');
		const days = Number(data.get('soonDays'));
		if (!isLocale(language) || !(SOON_CHOICES as readonly number[]).includes(days)) {
			return fail(400, { error: serverMessages(locals.locale).common.invalid });
		}
		setSettings({ uiLanguage: language, soonDays: String(days) });
		return {};
	},
	scanning: async ({ request }) => {
		const on = (await request.formData()).get('scanVibration') === 'on';
		setSettings({ scanVibration: on ? 'on' : 'off' });
		return {};
	}
};
