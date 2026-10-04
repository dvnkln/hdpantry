import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { settings } from './db/schema';

// Default values, used until the user changes them.
const DEFAULTS = {
	uiLanguage: 'en' // interface language: 'en' | 'de' (chosen in the first-run wizard)
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
