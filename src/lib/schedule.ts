// When a background task runs – shared by the settings page and the scheduler.

export const FREQUENCIES = ['hourly', 'daily', 'weekly', 'monthly'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

// How many backups can be kept at most; older ones are deleted
export const MAX_KEEP = 100;

export function isKeep(value: number) {
	return Number.isInteger(value) && value >= 1 && value <= MAX_KEEP;
}

// time: "HH:MM" in the time zone of the server (TZ); weekday: 0 = Sunday, only for "weekly"
export type Schedule = { frequency: Frequency; time: string; weekday: number };

export function isFrequency(value: unknown): value is Frequency {
	return (FREQUENCIES as readonly unknown[]).includes(value);
}

export function isTime(value: string) {
	return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

// The most recent planned time at or before `now`. Hourly means the start of every hour,
// monthly the first of the month.
export function latestSlot(schedule: Schedule, now: Date) {
	const [hours, minutes] = schedule.time.split(':').map(Number);
	const slot = new Date(now);
	if (schedule.frequency === 'hourly') {
		slot.setMinutes(0, 0, 0);
		return slot;
	}
	slot.setHours(hours, minutes, 0, 0);
	if (schedule.frequency === 'daily') {
		if (slot > now) slot.setDate(slot.getDate() - 1);
	} else if (schedule.frequency === 'weekly') {
		slot.setDate(slot.getDate() - ((slot.getDay() - schedule.weekday + 7) % 7));
		if (slot > now) slot.setDate(slot.getDate() - 7);
	} else {
		slot.setDate(1);
		if (slot > now) slot.setMonth(slot.getMonth() - 1);
	}
	return slot;
}

// The next planned time after `now`
export function nextSlot(schedule: Schedule, now: Date) {
	const slot = latestSlot(schedule, now);
	if (schedule.frequency === 'hourly') slot.setHours(slot.getHours() + 1);
	else if (schedule.frequency === 'daily') slot.setDate(slot.getDate() + 1);
	else if (schedule.frequency === 'weekly') slot.setDate(slot.getDate() + 7);
	else slot.setMonth(slot.getMonth() + 1);
	return slot;
}

// Due once a planned time has passed since `since` – the last run or the last change of the
// schedule, whichever is later. Several missed times still lead to one run only.
export function isDue(schedule: Schedule, since: Date, now: Date) {
	return latestSlot(schedule, now).getTime() > since.getTime();
}
