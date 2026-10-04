// Runs before every test file: an empty database in a temporary folder and no network.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeEach, vi } from 'vitest';

const dir = mkdtempSync(join(tmpdir(), 'hdpantry-test-'));
process.env.DATA_DIR = dir;
// (SECRET of the tests is set in vite.config.ts.)

// hdpantry never talks to the outside: any request fails the test.
beforeEach(() => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: unknown) => {
			throw new Error(`Unexpected request in a test: ${String(url)}`);
		})
	);
});

// Imported only now, so the modules see the settings above.
const { getDb, runMigrations } = await import('$lib/server/db');
runMigrations();

afterAll(() => {
	getDb().$client.close();
	rmSync(dir, { recursive: true, force: true });
});
