import { serverMessages } from '$lib/server/i18n';
import type { RequestHandler } from './$types';

// Colour of the logo: shown while the installed app starts, before the page and its own
// colour scheme are there. Fits light and dark devices alike.
const BRAND = '#1f7a5c';

// Tells the browser how to install hdpantry as an app. Reachable without being logged in
// (see PUBLIC_PATHS in hooks.server.ts): the browser fetches it without the login cookie.
export const GET: RequestHandler = ({ locals }) => {
	const t = serverMessages(locals.locale).app;
	const manifest = {
		id: '/',
		name: 'hdpantry',
		short_name: 'hdpantry',
		description: t.description,
		lang: locals.locale,
		start_url: '/',
		scope: '/',
		display: 'standalone',
		background_color: BRAND,
		theme_color: BRAND,
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
			}
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
