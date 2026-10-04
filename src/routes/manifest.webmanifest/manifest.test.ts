import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GET } from './+server';

async function manifest(locale: 'de' | 'en') {
	const response = await GET({ locals: { locale, user: null } } as Parameters<typeof GET>[0]);
	return { response, data: await response.json() };
}

describe('app manifest', () => {
	it('describes an installable app that starts on the stock page', async () => {
		const { response, data } = await manifest('en');
		expect(response.headers.get('content-type')).toContain('application/manifest+json');
		expect(data).toMatchObject({ name: 'hdpantry', start_url: '/', display: 'standalone' });
		const sizes = data.icons.map(
			(icon: { sizes: string; purpose: string }) => icon.sizes + icon.purpose
		);
		expect(sizes).toEqual(['192x192any', '512x512any', '192x192maskable', '512x512maskable']);
	});
	it('only names icons that exist, all from the own server', async () => {
		const { data } = await manifest('en');
		for (const icon of [...data.icons, ...data.shortcuts[0].icons]) {
			expect(icon.src.startsWith('/')).toBe(true);
			expect(existsSync(`static${icon.src}`)).toBe(true);
		}
	});
	it('speaks the language of the app', async () => {
		expect((await manifest('de')).data.shortcuts[0].name).toBe('Scannen');
		expect((await manifest('en')).data.shortcuts[0].name).toBe('Scan');
	});
});
