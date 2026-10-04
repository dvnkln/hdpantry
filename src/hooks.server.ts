import type { Handle, ServerInit } from '@sveltejs/kit';
import {
	SESSION_COOKIE,
	clearSessionCookie,
	deleteExpiredSessions,
	hasAnyUser,
	setSessionCookie,
	validateSession
} from '$lib/server/auth';
import { getSecret } from '$lib/server/config';
import { runMigrations } from '$lib/server/db';
import { localeFor } from '$lib/server/i18n';
import { allowedOrigins, isAllowedOrigin, isHttps } from '$lib/server/origins';
import { themeFor } from '$lib/server/theme';
import { THEMES } from '$lib/themes';

// Runs once when the server starts, before the first request is handled.
export const init: ServerInit = () => {
	getSecret(); // fail fast if SECRET is missing
	if (allowedOrigins().length === 0 && process.env.NODE_ENV === 'production') {
		console.warn('ORIGIN is not set in .env – login and all forms will fail (HTTP 403).');
	}
	runMigrations();
	console.log('Database migrations applied');
	deleteExpiredSessions();
};

// Pages reachable without being logged in.
const PUBLIC_PATHS = ['/health', '/login', '/setup'];

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function redirectTo(location: string) {
	return new Response(null, { status: 303, headers: { location } });
}

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

// Runs for every request: checks the origin of form posts, loads the logged-in user and
// redirects to /setup or /login if needed.
const respond: Handle = async ({ event, resolve }) => {
	const { url, request } = event;
	const path = url.pathname;
	if (path === '/health') return resolve(event);

	if (!SAFE_METHODS.includes(request.method)) {
		if (!isAllowedOrigin(request.headers.get('origin'), url)) {
			return new Response('Cross-site POST form submissions are forbidden', { status: 403 });
		}
	}

	event.locals.user = null;
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const session = validateSession(token);
		if (session) {
			event.locals.user = session.user;
			if (session.renewedUntil) {
				setSessionCookie(event.cookies, isHttps(request, url), token, session.renewedUntil);
			}
		} else {
			clearSessionCookie(event.cookies);
		}
	}

	event.locals.locale = localeFor(request);
	// Fills in the placeholders of app.html: language and colour scheme. The scheme is set on
	// the server, so a page never flashes in the wrong colours while loading.
	const render = () => {
		const theme = themeFor(event);
		const [light, dark] = THEMES[theme].bar;
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%lang%', event.locals.locale)
					.replace('%theme%', theme)
					.replace('%themeColor%', light)
					.replace('%themeColorDark%', dark)
		});
	};

	// No account yet: everything leads to the first-run wizard.
	if (!hasAnyUser()) return path === '/setup' ? render() : redirectTo('/setup');
	if (path === '/setup') return redirectTo('/');

	if (!event.locals.user && !PUBLIC_PATHS.includes(path)) return redirectTo('/login');
	if (event.locals.user && path === '/login') return redirectTo('/');

	return render();
};
