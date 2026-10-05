// What hdpantry can remind of – shared by the settings page and the server.

// soon: the content reaches the "expires soon" threshold · today: its best-before date is
// today · expired: the date has passed (told once, the day after)
export const REMINDER_KINDS = ['soon', 'today', 'expired'] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

// off · single: one message per content · digest: one message a day
export const NOTIFY_MODES = ['off', 'single', 'digest'] as const;
export type NotifyMode = (typeof NOTIFY_MODES)[number];

export function isNotifyMode(value: unknown): value is NotifyMode {
	return (NOTIFY_MODES as readonly unknown[]).includes(value);
}
