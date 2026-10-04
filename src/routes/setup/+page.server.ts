import { fail, redirect } from '@sveltejs/kit';
import { isLocale } from '$lib/i18n/index.svelte';
import { MIN_PASSWORD_LENGTH, USERNAME_PATTERN } from '$lib/limits';
import { createSession, hasAnyUser, hashPassword, setSessionCookie } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { serverMessages } from '$lib/server/i18n';
import { isHttps } from '$lib/server/origins';
import { setSettings } from '$lib/server/settings';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url, locals }) => {
		// The wizard may only be used once.
		if (hasAnyUser()) redirect(303, '/login');

		const data = await request.formData();
		const chosen = String(data.get('language') ?? '');
		const language = isLocale(chosen) ? chosen : locals.locale;
		const username = String(data.get('username') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const confirm = String(data.get('confirm') ?? '');

		const t = serverMessages(language).auth;
		if (!USERNAME_PATTERN.test(username)) {
			return fail(400, { username, language, error: t.usernameRule });
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, { username, language, error: t.passwordTooShort(MIN_PASSWORD_LENGTH) });
		}
		if (password !== confirm) {
			return fail(400, { username, language, error: t.passwordsDiffer });
		}

		const passwordHash = await hashPassword(password);
		// Check again: another request could have created the account while hashing.
		if (hasAnyUser()) redirect(303, '/login');
		const user = getDb()
			.insert(users)
			.values({ username, passwordHash })
			.returning({ id: users.id })
			.get();
		setSettings({ uiLanguage: language });

		const { token, expiresAt } = createSession(user.id);
		setSessionCookie(cookies, isHttps(request, url), token, expiresAt);
		redirect(303, '/');
	}
};
