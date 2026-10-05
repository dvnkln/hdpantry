import { randomBytes } from 'node:crypto';
import { fail } from '@sveltejs/kit';
import pkg from '../../../../package.json';
import { connectionOf } from '$lib/server/auth';
import { serverOverview } from '$lib/server/overview';
import { serverMessages } from '$lib/server/i18n';
import { PROXY_KEY_HEADER, parseProxies } from '$lib/server/proxy';
import { getSetting, setSettings } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => ({
	// Is everything fine, plus a few facts
	overview: { ...serverOverview(event), version: pkg.version },
	// What hdpantry sees of this request, and the proxies entered so far
	connection: connectionOf(event),
	trustedProxies: parseProxies(getSetting('trustedProxies')).entries.join(', '),
	proxyKey: getSetting('proxyKey'),
	proxyKeyHeader: PROXY_KEY_HEADER
});

export const actions: Actions = {
	// Reverse proxies whose forwarded visitor address is believed (see $lib/server/proxy.ts)
	proxies: async ({ request, locals }) => {
		const t = serverMessages(locals.locale).settings;
		const text = String((await request.formData()).get('proxies') ?? '');
		const { entries, invalid } = parseProxies(text);
		if (invalid.length || entries.length > 20) {
			return fail(400, {
				proxies: text,
				error: invalid.length ? t.proxiesInvalid(invalid.join(', ')) : t.proxiesTooMany
			});
		}
		setSettings({ trustedProxies: entries.join(',') });
		return { saved: true };
	},

	// The secret a reverse proxy sends to prove itself: create (or replace) it, or remove it
	proxyKey: async ({ request }) => {
		const remove = (await request.formData()).get('remove') === '1';
		setSettings({ proxyKey: remove ? '' : randomBytes(32).toString('base64url') });
		return { done: true };
	}
};
