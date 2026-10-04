import type { Handle, ServerInit } from '@sveltejs/kit';
import { getSecret } from '$lib/server/config';
import { runMigrations } from '$lib/server/db';
import { localeFor } from '$lib/server/i18n';
import { allowedOrigins, isAllowedOrigin } from '$lib/server/origins';

// Runs once when the server starts, before the first request is handled.
export const init: ServerInit = () => {
	getSecret(); // fail fast if SECRET is missing
	if (allowedOrigins().length === 0 && process.env.NODE_ENV === 'production') {
		console.warn('ORIGIN is not set in .env – login and all forms will fail (HTTP 403).');
	}
	runMigrations();
	console.log('Database migrations applied');
};

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Sent with every answer: no embedding in other pages, no guessing of file types, the address
// of a page is not passed on to other sites, and of the device's sensors only the camera may
// be used (for the scanner), and only by our own pages. (What the browser may load at all is
// set in vite.config.ts, `csp`.)
const SECURITY_HEADERS = {
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'same-origin',
	'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()'
};

export const handle: Handle = async (input) => {
	const response = await respond(input);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
	return response;
};

// Runs for every request: checks the origin of form posts and sets the interface language.
const respond: Handle = async ({ event, resolve }) => {
	const { url, request } = event;
	if (url.pathname === '/health') return resolve(event);

	if (!SAFE_METHODS.includes(request.method)) {
		if (!isAllowedOrigin(request.headers.get('origin'), url)) {
			return new Response('Cross-site POST form submissions are forbidden', { status: 403 });
		}
	}

	event.locals.locale = localeFor(request);
	// Fills in the placeholder of app.html
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.locale)
	});
};
