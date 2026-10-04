import { MESSAGES, LOCALES, isLocale, type Locale } from '$lib/i18n/index.svelte';
import { getStoredSetting } from './settings';

// The first language of the browser's Accept-Language header that we have texts for.
export function preferredLocale(acceptLanguage: string | null): Locale {
	for (const part of (acceptLanguage ?? '').split(',')) {
		const code = part.split(';')[0].trim().slice(0, 2).toLowerCase();
		if (isLocale(code)) return code;
	}
	return LOCALES[0];
}

// The interface language of a request: the saved setting; before the first-run wizard has
// saved one, the language of the browser.
export function localeFor(request: Request): Locale {
	const stored = getStoredSetting('uiLanguage');
	return stored && isLocale(stored)
		? stored
		: preferredLocale(request.headers.get('accept-language'));
}

// Texts for messages created on the server (form errors).
export function serverMessages(locale: Locale) {
	return MESSAGES[locale];
}
