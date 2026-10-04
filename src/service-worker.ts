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
