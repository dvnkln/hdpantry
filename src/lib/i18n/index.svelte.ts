import type { Unit } from '$lib/items';
import { de, type Messages } from './de';
import { en } from './en';

export type Locale = 'de' | 'en';
export const LOCALES: Locale[] = ['en', 'de'];
export const MESSAGES: Record<Locale, Messages> = { de, en };

export function isLocale(value: string): value is Locale {
	return (LOCALES as string[]).includes(value);
}

// The interface language is one global setting (stored in the DB), set by the root layout.
const current = $state({ locale: 'en' as Locale });

export function setLocale(locale: Locale) {
	current.locale = locale;
}

// Texts in the current language, e.g. m.common.home. Reading through this keeps pages
// reactive: they re-render when the language changes.
export const m = new Proxy({} as Messages, {
	get: (_, key) => MESSAGES[current.locale][key as keyof Messages]
});

// 1.5, 'kg' -> "1,5 kg" / "1.5 kg"; 2, 'servings' -> "2 Portionen"
export function formatAmount(amount: number, unit: Unit) {
	const number = new Intl.NumberFormat(m.locale, { maximumFractionDigits: 2 }).format(amount);
	return `${number} ${m.units[unit](amount)}`;
}

// "2026-10-03" -> "03.10.2026" / "10/03/2026"
export function formatDate(iso: string) {
	return new Intl.DateTimeFormat(m.locale, {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).format(new Date(`${iso.slice(0, 10)}T00:00:00`));
}
