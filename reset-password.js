// Sets a new temporary password – for when the password (or username) was forgotten.
// Needs access to the server, so it is not reachable from the web:
//
//   docker exec hdpantry node reset-password.js
//
// All devices are logged out; the app does not need a restart.
import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';

function fail(message) {
	console.error(message);
	process.exit(1);
}

const dbPath = resolve(process.env.DATA_DIR ?? './data', 'hdpantry.db');
if (!existsSync(dbPath)) fail(`No database found at ${dbPath}.`);

const db = new Database(dbPath);
const user = db.prepare('SELECT id, username FROM users ORDER BY id LIMIT 1').get();
if (!user) fail('There is no account yet. Open hdpantry in your browser to create one.');

// Must stay the same format as hashPassword() in src/lib/server/auth.ts:
// scrypt$<salt hex>$<hash hex>, 16 byte salt, 64 byte hash.
const password = randomBytes(12).toString('base64url');
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
const passwordHash = `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;

db.transaction(() => {
	db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id);
	db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
})();
db.close();

console.log(`
Password reset – all devices were logged out.

  Username:           ${user.username}
  Temporary password: ${password}
`);
