import { expect, it } from 'vitest';
import { localeFor, preferredLocale } from './i18n';
import { setSettings } from './settings';

it('picks the first browser language we have texts for', () => {
	expect(preferredLocale('de-DE,de;q=0.9,en;q=0.8')).toBe('de');
	expect(preferredLocale('fr-FR,fr;q=0.9,de;q=0.8')).toBe('de');
	expect(preferredLocale('fr-FR')).toBe('en');
	expect(preferredLocale(null)).toBe('en');
});

it('uses the saved language once there is one, the browser language before', () => {
	const request = new Request('http://localhost/', { headers: { 'accept-language': 'de' } });
	expect(localeFor(request)).toBe('de');
	setSettings({ uiLanguage: 'en' });
	expect(localeFor(request)).toBe('en');
});
