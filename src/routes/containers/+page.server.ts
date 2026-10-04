import { listContainers } from '$lib/server/containers';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		containers: listContainers().map((c) => ({
			id: c.id,
			code: c.code,
			size: c.size,
			name: c.name
		}))
	};
};
