import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import {
	clearLoginFailures,
	clientAddress,
	createSession,
	deleteExpiredSessions,
	loginLockedFor,
	recordLoginFailure,
	setSessionCookie,
	verifyDummy,
	verifyPassword
} from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { serverMessages } from '$lib/server/i18n';
import { isHttps } from '$lib/server/origins';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, url, locals } = event;
		const ip = clientAddress(event);
		const data = await request.formData();
		const username = String(data.get('username') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const t = serverMessages(locals.locale).auth;

		const locked = loginLockedFor(ip);
		if (locked > 0) return fail(429, { username, error: t.tooManyAttempts(locked) });

		const user = getDb().select().from(users).where(eq(users.username, username)).get();
		const ok = user
			? await verifyPassword(password, user.passwordHash)
			: await verifyDummy(password);

		if (!user || !ok) {
			recordLoginFailure(ip);
			return fail(400, { username, error: t.wrongCredentials });
		}

		clearLoginFailures(ip);
		deleteExpiredSessions();
		const { token, expiresAt } = createSession(user.id);
		setSessionCookie(cookies, isHttps(request, url), token, expiresAt);
		redirect(303, '/');
	}
};
