// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Locale } from '$lib/i18n/index.svelte';
import type { SessionUser } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
			// Interface language of this request (see localeFor in src/lib/server/i18n.ts)
			locale: Locale;
		}
	}
}

export {};
