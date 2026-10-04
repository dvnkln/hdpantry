import { isLocale } from '$lib/i18n/index.svelte';
import { getSetting, setSettings, soonDays } from '$lib/server/settings';
import { SOON_CHOICES } from '$lib/stock';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { vibration: getSetting('scanVibration') !== 'off', soonDays: soonDays() };
};

// Every choice is saved as soon as it is made; each has its own small form.
export const actions: Actions = {
	language: async ({ request }) => {
		const language = String((await request.formData()).get('language') ?? '');
		if (isLocale(language)) setSettings({ uiLanguage: language });
		return { done: true };
	},
	vibration: async ({ request }) => {
		const on = (await request.formData()).get('vibration') === 'on';
		setSettings({ scanVibration: on ? 'on' : 'off' });
		return { done: true };
	},
	soon: async ({ request }) => {
		const days = Number((await request.formData()).get('days'));
		if ((SOON_CHOICES as readonly number[]).includes(days)) setSettings({ soonDays: String(days) });
		return { done: true };
	}
};
