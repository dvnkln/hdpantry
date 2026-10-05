import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { isNotifyMode } from '$lib/reminders';
import { removeChannel, saveChannel, setChannelEnabled } from '$lib/server/channels';
import { serverMessages } from '$lib/server/i18n';
import { notifyUser, prefsFor, sampleMessage, savePrefs } from '$lib/server/notifications';
import {
	addDevice,
	parseSubscription,
	pushPublicKey,
	removeDevice,
	renameDevice,
	setDeviceEnabled
} from '$lib/server/push';
import { soonDays } from '$lib/server/settings';
import { deliver, listTargets, parseTargetKey } from '$lib/server/targets';
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
		targets: listTargets(user.id)
	};
};

export const actions: Actions = {
	// What to be reminded of, how and from which hour – saved the moment a choice is made.
	prefs: async (event) => {
		const user = userOf(event);
		const t = serverMessages(event.locals.locale);
		const data = await event.request.formData();
		const mode = data.get('mode');
		const hour = Number(data.get('hour'));
		if (!isNotifyMode(mode) || !Number.isInteger(hour) || hour < 0 || hour > 23) {
			return fail(400, { error: t.common.invalid });
		}
		savePrefs(user.id, {
			mode,
			hour,
			kinds: {
				soon: data.get('soon') === 'on',
				today: data.get('today') === 'on',
				expired: data.get('expired') === 'on'
			}
		});
		// Look right away instead of at the next full hour: what is due today under the new
		// choice goes out now (in the background; the page does not wait for the services)
		notifyUser(user.id).catch((err) => console.error('Reminders failed', err));
		return {};
	},

	// "This device": called by the page after the browser has subscribed at its push service.
	subscribe: async (event) => {
		const user = userOf(event);
		const t = serverMessages(event.locals.locale).notifications;
		const data = await event.request.formData();
		const sub = parseSubscription(String(data.get('subscription') ?? ''));
		const agent = event.request.headers.get('user-agent') ?? '';
		// replaces: the address this browser had before it renewed its subscription
		const replaces = String(data.get('replaces') ?? '');
		if (!sub || !addDevice(user.id, sub, agent, replaces)) return fail(400, { error: t.refused });
		return { message: t.saved };
	},

	// The switch of a target: off keeps everything about it.
	targetToggle: async (event) => {
		const user = userOf(event);
		const data = await event.request.formData();
		const ref = parseTargetKey(String(data.get('key') ?? ''));
		const enabled = data.get('enabled') === 'on';
		const done =
			ref &&
			(ref.type === 'device'
				? setDeviceEnabled(user.id, ref.id, enabled)
				: setChannelEnabled(user.id, ref.id, enabled));
		if (!done) {
			const t = serverMessages(event.locals.locale).notifications;
			return fail(400, { error: t.channelErrors.unknown });
		}
		return {};
	},

	targetRemove: async (event) => {
		const user = userOf(event);
		const t = serverMessages(event.locals.locale).notifications;
		const ref = parseTargetKey(String((await event.request.formData()).get('key') ?? ''));
		const done =
			ref &&
			(ref.type === 'device' ? removeDevice(user.id, ref.id) : removeChannel(user.id, ref.id));
		if (!done) return fail(400, { error: t.channelErrors.unknown });
		return { message: t.removed };
	},

	// A test message to exactly one target (also one that is switched off): it looks like a
	// real reminder where the stock has something with a date.
	targetTest: async (event) => {
		const user = userOf(event);
		const t = serverMessages(event.locals.locale).notifications;
		const ref = parseTargetKey(String((await event.request.formData()).get('key') ?? ''));
		const [result] = ref ? await deliver(user.id, sampleMessage(user.id), ref) : [];
		if (!result) return fail(400, { error: t.channelErrors.unknown });
		if (result.ok) return { message: t.testSent };
		const reason =
			result.error === 'gone'
				? t.gone
				: !result.error || result.error === 'unreachable'
					? t.unreachable
					: t.testFailed(result.error);
		return fail(502, { error: reason });
	},

	// The name of a device (a device has no other settings).
	deviceRename: async (event) => {
		const user = userOf(event);
		const t = serverMessages(event.locals.locale).notifications;
		const data = await event.request.formData();
		const ref = parseTargetKey(String(data.get('key') ?? ''));
		const done =
			ref?.type === 'device' && renameDevice(user.id, ref.id, String(data.get('name') ?? ''));
		if (!done) return fail(400, { error: t.channelErrors.name });
		return { message: t.saved };
	},

	// Creates or changes a Pushover, ntfy or webhook target (Pushover's keys are checked there first).
	channelSave: async (event) => {
		const user = userOf(event);
		const t = serverMessages(event.locals.locale).notifications;
		const data = await event.request.formData();
		const ref = parseTargetKey(String(data.get('key') ?? ''));
		const text = (name: string) => String(data.get(name) ?? '');
		const result = await saveChannel(user.id, {
			id: ref?.type === 'channel' ? ref.id : null,
			kind: text('kind'),
			name: text('name'),
			fields: {
				token: text('token'),
				user: text('user'),
				devices: text('devices'),
				url: text('url'),
				body: text('body'),
				header: text('header'),
				clearHeader: text('clearHeader'),
				server: text('server'),
				topic: text('topic'),
				icon: text('icon'),
				clearToken: text('clearToken')
			}
		});
		if (!result.ok) {
			const error =
				result.error === 'refused'
					? t.rejected(result.text ?? '')
					: (t.channelErrors[result.error] ?? t.invalid);
			return fail(400, { error });
		}
		return { message: t.saved, key: `channel:${result.id}` };
	}
};
