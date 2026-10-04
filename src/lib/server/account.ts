import { eq } from 'drizzle-orm';
import { MIN_PASSWORD_LENGTH, USERNAME_PATTERN } from '$lib/limits';
import { deleteOtherSessions, hashPassword, verifyPassword } from './auth';
import { getDb } from './db';
import { users } from './db/schema';

// Changing the account from the settings. What was typed is checked first, the current
// password last – so a typo in the new values never counts as a wrong password.

async function passwordMatches(userId: number, password: string) {
	const user = getDb().select().from(users).where(eq(users.id, userId)).get();
	return !!user && (await verifyPassword(password, user.passwordHash));
}

export type UsernameResult = 'ok' | 'usernameRule' | 'same' | 'wrongPassword';

export async function changeUsername(
	userId: number,
	current: string,
	username: string,
	password: string
): Promise<UsernameResult> {
	if (!USERNAME_PATTERN.test(username)) return 'usernameRule';
	if (username === current) return 'same';
	if (!(await passwordMatches(userId, password))) return 'wrongPassword';
	getDb().update(users).set({ username }).where(eq(users.id, userId)).run();
	return 'ok';
}

export type PasswordResult = 'ok' | 'tooShort' | 'differ' | 'wrongPassword';

// `token` is the login of this device: it stays, every other device is logged out.
export async function changePassword(
	userId: number,
	token: string,
	current: string,
	next: string,
	confirm: string
): Promise<PasswordResult> {
	if (next.length < MIN_PASSWORD_LENGTH) return 'tooShort';
	if (next !== confirm) return 'differ';
	if (!(await passwordMatches(userId, current))) return 'wrongPassword';
	const passwordHash = await hashPassword(next);
	getDb().update(users).set({ passwordHash }).where(eq(users.id, userId)).run();
	deleteOtherSessions(userId, token);
	return 'ok';
}
