import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { settings } from './db/schema';

// Default values, used until the user changes them.
const DEFAULTS = {
	uiLanguage: 'en', // interface language: 'en' | 'de' (chosen in the first-run wizard)
	iconStyle: 'color', // food symbols: 'color' (Twemoji) | 'line' (line icons)
	// Reverse proxies whose X-Forwarded-For header is believed (see proxy.ts): addresses or
	// ranges, comma-separated. Empty = none.
	trustedProxies: '',
	// Secret a reverse proxy sends to prove itself where addresses do not help (see proxy.ts)
	proxyKey: ''
} as const;

export type SettingKey = keyof typeof DEFAULTS;

// The saved value, or undefined if the setting was never saved.
export function getStoredSetting(key: SettingKey): string | undefined {
	return getDb().select().from(settings).where(eq(settings.key, key)).get()?.value;
}

export function getSetting(key: SettingKey): string {
	return getStoredSetting(key) ?? DEFAULTS[key];
}

// Saves several settings at once.
export function setSettings(values: Partial<Record<SettingKey, string>>) {
	getDb().transaction((tx) => {
		for (const [key, value] of Object.entries(values)) {
			tx.insert(settings)
				.values({ key, value })
				.onConflictDoUpdate({ target: settings.key, set: { value } })
				.run();
		}
	});
}
