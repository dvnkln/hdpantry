import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BACKUP_DIR, isBackupName } from '$lib/server/backups';
import type { RequestHandler } from './$types';

// Download of a backup file. Only reachable when logged in (see hooks.server.ts), and only
// for files the app wrote itself.
export const GET: RequestHandler = async ({ params }) => {
	if (!isBackupName(params.name)) error(404);
	let file: Buffer;
	try {
		file = await readFile(join(BACKUP_DIR, params.name));
	} catch {
		error(404);
	}
	return new Response(new Uint8Array(file), {
		headers: {
			'content-type': 'application/vnd.sqlite3',
			'content-disposition': `attachment; filename="${params.name}"`,
			'content-length': String(file.length),
			'cache-control': 'no-store'
		}
	});
};
