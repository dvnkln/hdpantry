import { setSettings } from '$lib/server/settings';
import type { Actions } from './$types';

export const actions: Actions = {
	// How food symbols are drawn
	iconStyle: async ({ request }) => {
		const style = (await request.formData()).get('style');
		setSettings({ iconStyle: style === 'line' ? 'line' : 'color' });
		return { done: true };
	}
};
