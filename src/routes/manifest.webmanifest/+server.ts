import { serverMessages } from '$lib/server/i18n';
import { getSetting } from '$lib/server/settings';
import { appColor, isTheme } from '$lib/themes';
import type { RequestHandler } from './$types';

// Tells the browser how to install hdpantry as an app. Reachable without being logged in
// (see PUBLIC_PATHS in hooks.server.ts): the browser fetches it without the login cookie.
export const GET: RequestHandler = ({ locals }) => {
	const t = serverMessages(locals.locale).app;
	// The background of the chosen colour scheme: the bar at the bottom of the installed app
	// (and its start screen) match the page. A browser takes a change over when it next checks
	// the manifest, not at once.
	const stored = getSetting('theme');
	const color = appColor(isTheme(stored) ? stored : 'system');
	const manifest = {
		id: '/',
		name: 'hdpantry',
		short_name: 'hdpantry',
		description: t.description,
		lang: locals.locale,
		start_url: '/',
		scope: '/',
		display: 'standalone',
		background_color: color,
		theme_color: color,
		icons: [
			{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
			{
				src: '/icons/icon-maskable-192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable'
			},
			{
				src: '/icons/icon-maskable-512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable'
			},
			{ src: '/icons/badge-96.png', sizes: '96x96', type: 'image/png', purpose: 'monochrome' }
		],
		// Long press on the app icon
		shortcuts: [
			{
				name: t.scan,
				url: '/scan',
				icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
			}
		]
	};
	return new Response(JSON.stringify(manifest), {
		headers: {
			'content-type': 'application/manifest+json; charset=utf-8',
			// The language can change in the settings
			'cache-control': 'no-cache'
		}
	});
};
