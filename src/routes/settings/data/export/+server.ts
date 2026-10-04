import { backupFileName } from '$lib/backup';
import { exportBackup } from '$lib/server/backup';
import type { RequestHandler } from './$types';

// The export as a download. Only reachable when logged in (see hooks.server.ts).
export const GET: RequestHandler = () => {
	const now = new Date();
	// Day in the time zone of the server (TZ)
	const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
	return new Response(JSON.stringify(exportBackup(now), null, '\t'), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'content-disposition': `attachment; filename="${backupFileName(day)}"`,
			'cache-control': 'no-store'
		}
	});
};
