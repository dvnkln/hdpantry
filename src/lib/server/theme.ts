import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { DEFAULT_THEME, isTheme, type Theme } from '$lib/themes';
import { hasAnyUser } from './auth';
import { isHttps } from './origins';
import { getSetting } from './settings';

// Remembers the colour scheme last used on this device, so the login page can show it before
// anybody is logged in. Holds only the name of the scheme.
const THEME_COOKIE = 'hdpantry_theme';
const YEAR_SECONDS = 365 * 24 * 60 * 60;

// The scheme chosen in the settings.
export function savedTheme(): Theme {
	if (!hasAnyUser()) return DEFAULT_THEME;
	const theme = getSetting('theme');
	return isTheme(theme) ? theme : DEFAULT_THEME;
}

// The scheme a page is drawn in: logged in -> the chosen one; logged out -> the one last used
// on this device, otherwise the device decides (never the account's choice: the login page
// should not tell strangers anything).
export function themeFor(event: RequestEvent): Theme {
	if (event.locals.user) return savedTheme();
	const remembered = event.cookies.get(THEME_COOKIE);
	return isTheme(remembered) ? remembered : DEFAULT_THEME;
}

// Called when the scheme is changed and after logging in.
export function rememberTheme(cookies: Cookies, request: Request, url: URL, theme = savedTheme()) {
	cookies.set(THEME_COOKIE, theme, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: isHttps(request, url),
		maxAge: YEAR_SECONDS
	});
}
