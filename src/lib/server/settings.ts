import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { SOON_CHOICES, SOON_DAYS } from '$lib/stock';
import { settings } from './db/schema';

// Default values, used until the user changes them.
const DEFAULTS = {
	uiLanguage: 'en', // interface language: 'en' | 'de' (chosen in the first-run wizard)
	iconStyle: 'color', // food symbols: 'color' (Twemoji) | 'line' (line icons)
	theme: 'system', // colour scheme, see $lib/themes ('system' follows the device)
	scanVibration: 'on', // short vibration when a code is recognised: 'on' | 'off'
	soonDays: '3', // "expires soon" means within this many days
	// Reverse proxies whose X-Forwarded-For header is believed (see proxy.ts): addresses or
	// ranges, comma-separated. Empty = none.
	trustedProxies: '',
	// Secret a reverse proxy sends to prove itself where addresses do not help (see proxy.ts)
	proxyKey: '',
	// Backups (see backups.ts): this many are kept, older ones are deleted. When they are made
	// is the schedule of the task (table `tasks`).
	backupKeep: '7',
	// Key pair of this installation for push notifications (VAPID), created on first use. The
	// public part goes to the browsers, the private part signs every message (see push.ts).
	vapidPublicKey: '',
	vapidPrivateKey: '',
	// Reminders about what expires (see notifications.ts): 'off' | 'single' (one message per
	// content) | 'digest' (one message a day)
	notifyMode: 'off',
	notifyHour: '9', // from this hour of the day on (0–23) the day's messages are sent
	notifyFrom: '', // day the reminders were switched on: nothing older is announced
	// Which occasions are announced
	notifySoon: 'on',
	notifyToday: 'on',
	notifyExpired: 'off',
	// 'once' | 'daily': how often "expires soon" is told
	notifySoonRepeat: 'once'
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

// "Expires soon" means within this many days (one of SOON_CHOICES).
export function soonDays(): number {
	const days = Number(getSetting('soonDays'));
	return (SOON_CHOICES as readonly number[]).includes(days) ? days : SOON_DAYS;
}
