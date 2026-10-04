import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { MIN_PASSWORD_LENGTH } from '$lib/limits';
import { changePassword, changeUsername } from '$lib/server/account';
import {
	SESSION_COOKIE,
	clearLoginFailures,
	clientAddress,
	countOtherSessions,
	deleteOtherSessions,
	loginLockedFor,
	recordLoginFailure
} from '$lib/server/auth';
import { serverMessages } from '$lib/server/i18n';
import type { Actions, PageServerLoad } from './$types';

// Who is asking: the account and the login of this device
function session(event: RequestEvent) {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!event.locals.user || !token) redirect(303, '/login');
	return { user: event.locals.user, token };
}

export const load: PageServerLoad = (event) => {
	const { user, token } = session(event);
	return { otherDevices: countOtherSessions(user.id, token) };
};

export const actions: Actions = {
	username: async (event) => {
		const { user } = session(event);
		const t = serverMessages(event.locals.locale);
		const ip = clientAddress(event);
		const data = await event.request.formData();
		const username = String(data.get('username') ?? '').trim();

		// A wrong current password counts like a wrong login, with the same lock
		const locked = loginLockedFor(ip);
		if (locked > 0) return fail(429, { nameError: t.auth.tooManyAttempts(locked), username });

		const result = await changeUsername(
			user.id,
			user.username,
			username,
			String(data.get('password') ?? '')
		);
		if (result === 'usernameRule') return fail(400, { nameError: t.auth.usernameRule, username });
		if (result === 'same') return fail(400, { nameError: t.settings.accountNameSame, username });
		if (result === 'wrongPassword') {
			recordLoginFailure(ip);
			return fail(400, { nameError: t.settings.accountWrongPassword, username });
		}
		clearLoginFailures(ip);
		return { nameDone: true };
	},

	password: async (event) => {
		const { user, token } = session(event);
		const t = serverMessages(event.locals.locale);
		const ip = clientAddress(event);
		const data = await event.request.formData();

		const locked = loginLockedFor(ip);
		if (locked > 0) return fail(429, { passwordError: t.auth.tooManyAttempts(locked) });

		const result = await changePassword(
			user.id,
			token,
			String(data.get('current') ?? ''),
			String(data.get('password') ?? ''),
			String(data.get('confirm') ?? '')
		);
		if (result === 'tooShort') {
			return fail(400, { passwordError: t.auth.passwordTooShort(MIN_PASSWORD_LENGTH) });
		}
		if (result === 'differ') return fail(400, { passwordError: t.auth.passwordsDiffer });
		if (result === 'wrongPassword') {
			recordLoginFailure(ip);
			return fail(400, { passwordError: t.settings.accountWrongPassword });
		}
		clearLoginFailures(ip);
		return { passwordDone: true };
	},

	logoutOthers: async (event) => {
		const { user, token } = session(event);
		deleteOtherSessions(user.id, token);
		return { devicesDone: true };
	}
};
