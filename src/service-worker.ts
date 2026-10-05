/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Makes the app installable ("add to home screen") and keeps the app's own files (scripts,
// styles, fonts, symbols) in the browser, so it starts faster. Pages and data always come
// from the server – nothing about the stock is stored here, and nothing is ever fetched from
// anywhere but the own server.
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `hdpantry-${version}`;
// Scripts and styles are stored right away. The many food symbols and the large fallback
// scanner (only needed by browsers without a built-in one) are stored once they are used.
const ASSETS = new Set([...build, ...files]);
const FIRST = build.filter((file) => !file.endsWith('.wasm'));

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FIRST)));
	sw.skipWaiting();
});

// Remove what older versions stored
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== sw.location.origin) return;
	if (!ASSETS.has(url.pathname)) return; // everything else: straight to the server
	event.respondWith(
		caches.open(CACHE).then(async (cache) => {
			const hit = await cache.match(url.pathname);
			if (hit) return hit;
			const response = await fetch(event.request);
			if (response.ok) void cache.put(url.pathname, response.clone());
			return response;
		})
	);
});

// ---- Push notifications (see src/lib/server/push.ts) ----

// The server sends { title, body, url, tag, icon }; show it. Messages with the same tag
// replace each other, so a content never piles up several notifications.
// Android draws the badge as a small symbol in the status bar – always in one colour: it must
// be a white shape on transparent, a colourful icon becomes a white box.
sw.addEventListener('push', (event) => {
	let message: { title?: string; body?: string; url?: string; tag?: string; icon?: string } = {};
	try {
		message = event.data?.json() ?? {};
	} catch {
		// not ours: show a plain notification below
	}
	event.waitUntil(
		sw.registration.showNotification(message.title ?? 'hdpantry', {
			body: message.body ?? '',
			icon: message.icon ?? '/icons/notify.png',
			badge: '/icons/badge-96.png',
			tag: message.tag,
			data: { url: message.url ?? '/' }
		})
	);
});

// The browser replaced the subscription of this device (some do that from time to time):
// subscribe again with the same key and tell the server, so messages keep arriving. Without
// this the device would silently drop out of the list. The server only accepts it while the
// login of this browser is still valid.
sw.addEventListener('pushsubscriptionchange', (event) => {
	const change = event as ExtendableEvent & { oldSubscription?: PushSubscription | null };
	const key = change.oldSubscription?.options.applicationServerKey;
	if (!key) return;
	change.waitUntil(
		sw.registration.pushManager
			.subscribe({ userVisibleOnly: true, applicationServerKey: key })
			.then((subscription) => {
				const body = new FormData();
				body.set('subscription', JSON.stringify(subscription));
				body.set('replaces', change.oldSubscription?.endpoint ?? '');
				return fetch('/settings/notifications?/subscribe', {
					method: 'POST',
					body,
					headers: { 'x-sveltekit-action': 'true' }
				});
			})
			.catch(() => null)
	);
});

// Tapped: bring an open window of the app to the page, or open a new one.
sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = new URL(String(event.notification.data?.url ?? '/'), sw.location.origin);
	if (url.origin !== sw.location.origin) return;
	event.waitUntil(
		sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
			const open = windows[0];
			if (!open) return void (await sw.clients.openWindow(url.href));
			await open.focus();
			if ('navigate' in open) await open.navigate(url.href).catch(() => null);
		})
	);
});
