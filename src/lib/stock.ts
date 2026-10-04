// The stock list: what is about to expire, and in which order things are shown.
import { LOCATIONS, type Location } from './items';

// "Expires soon" means: within this many days from today
export const SOON_DAYS = 3;
// What can be chosen in the settings
export const SOON_CHOICES = [1, 2, 3, 5, 7, 14] as const;

export type ExpiryLevel = 'expired' | 'soon' | 'fine' | 'none';

// Whole days from `today` to `date` (both YYYY-MM-DD); negative = in the past
export function daysUntil(date: string, today: string) {
	return Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000);
}

// How urgent a best-before date is. No date: nothing to say.
export function expiry(
	bestBefore: string | null,
	today: string,
	soonDays: number = SOON_DAYS
): { level: ExpiryLevel; days: number | null } {
	if (!bestBefore) return { level: 'none', days: null };
	const days = daysUntil(bestBefore, today);
	return { level: days < 0 ? 'expired' : days <= soonDays ? 'soon' : 'fine', days };
}

export const SORT_KEYS = ['date', 'name', 'location'] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export function isSortKey(value: unknown): value is SortKey {
	return (SORT_KEYS as readonly unknown[]).includes(value);
}

type Sortable = { name: string; location: Location; bestBefore: string | null };

// A new, sorted list. By date: what expires first comes first; things without a date always
// come last, whatever the direction. Equal entries are ordered by date, then by name.
export function sortStock<T extends Sortable>(
	list: T[],
	key: SortKey,
	descending = false,
	locale = 'en'
) {
	const byName = (a: T, b: T) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' });
	const byDate = (a: T, b: T) => (a.bestBefore ?? '').localeCompare(b.bestBefore ?? '');
	const flip = descending ? -1 : 1;
	return [...list].sort((a, b) => {
		if (key === 'date') {
			if (!a.bestBefore || !b.bestBefore) {
				return a.bestBefore ? -1 : b.bestBefore ? 1 : byName(a, b);
			}
			return flip * byDate(a, b) || byName(a, b);
		}
		const main =
			key === 'name' ? byName(a, b) : LOCATIONS.indexOf(a.location) - LOCATIONS.indexOf(b.location);
		if (main) return flip * main;
		// same place (or same name): the more urgent one first
		if (a.bestBefore && b.bestBefore) return byDate(a, b) || byName(a, b);
		return a.bestBefore ? -1 : b.bestBefore ? 1 : byName(a, b);
	});
}
