import { fail } from '@sveltejs/kit';
import { serverMessages } from '$lib/server/i18n';
import { rememberTheme } from '$lib/server/theme';
import { getSetting, setSettings } from '$lib/server/settings';
import { DEFAULT_THEME, isTheme } from '$lib/themes';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const theme = getSetting('theme');
	return {
		theme: isTheme(theme) ? theme : DEFAULT_THEME,
		scene: getSetting('stockScene') === 'on'
	};
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
	// The stock list of a place of storage drawn inside its fridge, freezer or cabinet
	scene: async ({ request }) => {
		const on = (await request.formData()).get('stockScene') === 'on';
		setSettings({ stockScene: on ? 'on' : 'off' });
		return {};
	},
	// How food symbols are drawn
	iconStyle: async ({ request }) => {
		const style = (await request.formData()).get('style');
		setSettings({ iconStyle: style === 'line' ? 'line' : 'color' });
		return {};
	}
};
