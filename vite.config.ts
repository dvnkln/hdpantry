import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Tests must not depend on (or use) the real .env: a fixed value, set before SvelteKit reads
// the environment.
if (process.env.VITEST) {
	process.env.SECRET = 'test-secret-test-secret-test-secret-0123';
}

export default defineConfig({
	// npm test: every test file gets its own empty database, no network (see src/tests/setup.ts)
	test: { environment: 'node', include: ['src/**/*.test.ts'], setupFiles: ['src/tests/setup.ts'] },
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// Our own origin check in hooks.server.ts replaces this, because ORIGIN may list several addresses.
			csrf: { trustedOrigins: ['*'] },
			// The browser only loads from our own server and runs only our own scripts: no foreign
			// scripts, fonts or images. Inline styles are needed for style="…" attributes;
			// 'wasm-unsafe-eval' lets the bundled code reader (WebAssembly, see scanner.ts) run.
			csp: {
				directives: {
					'default-src': ['self'],
					'script-src': ['self', 'wasm-unsafe-eval'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:'],
					'font-src': ['self'],
					'connect-src': ['self'],
					'media-src': ['self', 'blob:'],
					'worker-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none']
				}
			},
			typescript: {
				config: (config) => {
					// Also type-check the migration config
					config.include.push('../drizzle.config.ts');
				}
			}
		})
	]
});
