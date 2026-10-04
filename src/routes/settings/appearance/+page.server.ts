import { rememberTheme } from '$lib/server/theme';
import { getSetting, setSettings } from '$lib/server/settings';
import { DEFAULT_THEME, isTheme } from '$lib/themes';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const theme = getSetting('theme');
	return { theme: isTheme(theme) ? theme : DEFAULT_THEME };
};

export const actions: Actions = {
	// Colour scheme; the login page of this device follows it
	theme: async ({ request, cookies, url }) => {
		const theme = (await request.formData()).get('theme');
		if (isTheme(theme)) {
			setSettings({ theme });
			rememberTheme(cookies, request, url, theme);
		}
		return { done: true };
	},
	// How food symbols are drawn
	iconStyle: async ({ request }) => {
		const style = (await request.formData()).get('style');
		setSettings({ iconStyle: style === 'line' ? 'line' : 'color' });
		return { done: true };
	}
};
