import { fail } from '@sveltejs/kit';
import { serverMessages } from '$lib/server/i18n';
import { rememberTheme } from '$lib/server/theme';
import { getSetting, setSettings } from '$lib/server/settings';
import { DEFAULT_THEME, isTheme } from '$lib/themes';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const theme = getSetting('theme');
	return { theme: isTheme(theme) ? theme : DEFAULT_THEME };
};

// Every choice is saved the moment it is made (see $lib/autosave)
export const actions: Actions = {
	// Colour scheme; the login page of this device follows it
	theme: async ({ request, cookies, url, locals }) => {
		const theme = (await request.formData()).get('theme');
		if (!isTheme(theme)) return fail(400, { error: serverMessages(locals.locale).common.invalid });
		setSettings({ theme });
		rememberTheme(cookies, request, url, theme);
		return {};
	},
	// How food symbols are drawn
	iconStyle: async ({ request }) => {
		const style = (await request.formData()).get('style');
		setSettings({ iconStyle: style === 'line' ? 'line' : 'color' });
		return {};
	}
};
