import { backupDue, runBackup } from './backups';
import { sendDueNotifications } from './notifications';

// What runs by itself in the background (there is no cron in the image): the scheduled backup
// and the reminders. Called once at server start; looks every minute.

// The hour the reminders were last looked at, e.g. "2031-01-31 09"
let remindersRun = '';

function tick() {
	try {
		// A backup that was missed while the server was off is made shortly after the start
		if (backupDue()) void runBackup();
	} catch (err) {
		console.error('Backup scheduler failed', err);
	}
	// Reminders: once in every hour, and once shortly after the start. Whether anything is sent
	// is decided by the settings of the user – with reminders off, a run reads a few settings.
	const hour = new Date().toLocaleString('sv-SE').slice(0, 13);
	if (hour !== remindersRun) {
		remindersRun = hour;
		sendDueNotifications().catch((err) => console.error('Reminders failed', err));
	}
}

export function startScheduler() {
	// During development the server code can be reloaded; never start a second timer
	const g = globalThis as { hdpantryScheduler?: boolean };
	if (g.hdpantryScheduler) return;
	g.hdpantryScheduler = true;
	setTimeout(tick, 30_000).unref();
	setInterval(tick, 60_000).unref();
}
