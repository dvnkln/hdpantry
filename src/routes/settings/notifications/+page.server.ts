import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { REMINDER_KINDS, isNotifyMode, type ReminderKind } from '$lib/reminders';
import { serverMessages } from '$lib/server/i18n';
import { notifyUser, prefsFor, sampleMessage, savePrefs } from '$lib/server/notifications';
import {
	addDevice,
	listDevices,
	parseSubscription,
	pushPublicKey,
	removeDevice,
	removeEndpoint,
	renameDevice,
	sendPush
} from '$lib/server/push';
import { soonDays } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

function userOf(event: RequestEvent) {
	if (!event.locals.user) redirect(303, '/login');
	return event.locals.user;
}

export const load: PageServerLoad = (event) => {
	const user = userOf(event);
	return {
		publicKey: pushPublicKey(),
		prefs: prefsFor(user.id),
		soonDays: soonDays(),
		devices: listDevices(user.id).map((device) => ({
			...device,
			createdAt: device.createdAt.toISOString(),
			lastOkAt: device.lastOkAt?.toISOString() ?? null
		}))
	};
};

export const actions: Actions = {
	// Called by the page after the browser has subscribed at its push service.
	subscribe: async (event) => {
		const user = userOf(event);
		const t = serverMessages(event.locals.locale).notifications;
		const data = await event.request.formData();
		const sub = parseSubscription(String(data.get('subscription') ?? ''));
		const agent = event.request.headers.get('user-agent') ?? '';
		if (!sub || !addDevice(user.id, sub, agent)) {
			return fail(400, { section: 'device', error: t.refused });
		}
		// The browser made a new subscription in place of an older one: that address is dead now
		const replaces = String(data.get('replaces') ?? '');
		if (replaces && replaces !== sub.endpoint) removeEndpoint(user.id, replaces);
		return { section: 'device', message: t.enabled };
	},

	// Removes a device (the page also ends the subscription in the browser).
	unsubscribe: async (event) => {
		const user = userOf(event);
		const t = serverMessages(event.locals.locale).notifications;
		const id = Number((await event.request.formData()).get('id'));
		if (!Number.isInteger(id) || !removeDevice(user.id, id)) {
			return fail(400, { section: 'devices', error: t.invalid });
		}
		return { section: 'devices', message: t.removed };
	},

	rename: async (event) => {
		const user = userOf(event);
		const t = serverMessages(event.locals.locale).notifications;
		const data = await event.request.formData();
		const id = Number(data.get('id'));
		if (!Number.isInteger(id) || !renameDevice(user.id, id, String(data.get('label') ?? ''))) {
			return fail(400, { section: 'devices', error: t.invalid });
		}
		return { section: 'devices', message: t.renamed };
	},

	// What to be reminded of, how and from which hour. Every choice is saved as soon as it is
	// made, so only what was sent and is valid is changed.
	prefs: async (event) => {
		const user = userOf(event);
		const data = await event.request.formData();
		const mode = data.get('mode');
		const hour = data.has('hour') ? Number(data.get('hour')) : NaN;
		const kind = data.get('kind');
		const isKind = (REMINDER_KINDS as readonly unknown[]).includes(kind);
		savePrefs(user.id, {
			...(isNotifyMode(mode) && { mode }),
			...(Number.isInteger(hour) && hour >= 0 && hour <= 23 && { hour }),
			...(isKind && { kind: kind as ReminderKind, on: data.get('on') === 'on' })
		});
		// Look right away instead of at the next full hour: what is due today under the new
		// choice goes out now (in the background; the page does not wait for the push service)
		notifyUser(user.id).catch((err) => console.error('Reminders failed', err));
		return { section: 'prefs' };
	},

	// A test message to all devices
	test: async (event) => {
		const user = userOf(event);
		const t = serverMessages(event.locals.locale).notifications;
		// Looks like the real thing where the stock has something with a date
		const message = sampleMessage(user.id) ?? {
			title: t.testTitle,
			body: t.testBody,
			url: '/settings/notifications',
			tag: 'test',
			icon: '/icons/notify.png'
		};
		const results = await sendPush(user.id, message);
		if (results.length === 0) return fail(400, { section: 'test', error: t.noDevices });
		const names = (list: typeof results) => list.map((r) => r.label).join(', ');
		const reached = results.filter((r) => r.ok);
		const gone = results.filter((r) => r.gone);
		const failed = results.filter((r) => !r.ok && !r.gone);
		// What happened, device by device: reached, no longer there (removed), not delivered
		const text = [
			reached.length ? t.testSent(reached.length) : '',
			gone.length ? t.testGone(names(gone)) : '',
			failed.length ? t.testFailed(names(failed)) : ''
		]
			.filter(Boolean)
			.join(' · ');
		if (reached.length === 0) return fail(502, { section: 'test', error: text });
		return { section: 'test', message: text };
	}
};
