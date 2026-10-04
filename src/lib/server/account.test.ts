import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { changePassword, changeUsername } from './account';
import {
	countOtherSessions,
	createSession,
	deleteOtherSessions,
	hashPassword,
	validateSession,
	verifyPassword
} from './auth';
import { getDb } from './db';
import { users } from './db/schema';

let userId: number;
beforeAll(async () => {
	const user = getDb()
		.insert(users)
		.values({ username: 'demo', passwordHash: await hashPassword('correct horse') })
		.returning()
		.get();
	userId = user.id;
});

const stored = () => getDb().select().from(users).where(eq(users.id, userId)).get()!;

describe('other devices', () => {
	it('logs out every device but this one', () => {
		const here = createSession(userId).token;
		const phone = createSession(userId).token;
		const tablet = createSession(userId).token;
		expect(countOtherSessions(userId, here)).toBe(2);
		expect(deleteOtherSessions(userId, here)).toBe(2);
		expect(countOtherSessions(userId, here)).toBe(0);
		expect(validateSession(here)?.user.username).toBe('demo');
		expect(validateSession(phone)).toBeNull();
		expect(validateSession(tablet)).toBeNull();
	});
});

describe('changing the username', () => {
	it('needs a valid new name and the current password', async () => {
		expect(await changeUsername(userId, 'demo', 'a b', 'correct horse')).toBe('usernameRule');
		expect(await changeUsername(userId, 'demo', 'demo', 'correct horse')).toBe('same');
		expect(await changeUsername(userId, 'demo', 'other', 'wrong')).toBe('wrongPassword');
		expect(stored().username).toBe('demo');
	});
	it('saves the new name and keeps the login', async () => {
		const here = createSession(userId).token;
		expect(await changeUsername(userId, 'demo', 'pantry.owner', 'correct horse')).toBe('ok');
		expect(stored().username).toBe('pantry.owner');
		expect(validateSession(here)?.user.username).toBe('pantry.owner');
	});
});

describe('changing the password', () => {
	it('checks the new password before the current one', async () => {
		const here = createSession(userId).token;
		expect(await changePassword(userId, here, 'wrong', 'short', 'short')).toBe('tooShort');
		expect(await changePassword(userId, here, 'wrong', 'long enough 1', 'long enough 2')).toBe(
			'differ'
		);
		expect(await changePassword(userId, here, 'wrong', 'long enough 1', 'long enough 1')).toBe(
			'wrongPassword'
		);
		expect(await verifyPassword('correct horse', stored().passwordHash)).toBe(true);
	});
	it('saves the new password and logs out the other devices', async () => {
		const here = createSession(userId).token;
		const phone = createSession(userId).token;
		expect(
			await changePassword(userId, here, 'correct horse', 'long enough 1', 'long enough 1')
		).toBe('ok');
		expect(await verifyPassword('long enough 1', stored().passwordHash)).toBe(true);
		expect(await verifyPassword('correct horse', stored().passwordHash)).toBe(false);
		expect(validateSession(here)).not.toBeNull();
		expect(validateSession(phone)).toBeNull();
	});
});
