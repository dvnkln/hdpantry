// Starts the built app. ORIGIN in .env may list several addresses, comma-separated:
// adapter-node only supports one, so it gets the first; the full list is checked in hooks.server.ts.
const origins = (process.env.ORIGIN ?? '')
	.split(',')
	.map((o) => o.trim().replace(/\/+$/, ''))
	.filter(Boolean);

process.env.HDPANTRY_ORIGINS = origins.join(',');
if (origins.length) process.env.ORIGIN = origins[0];
else delete process.env.ORIGIN;

// Room for importing an export file (the app itself refuses more than 10 MB)
process.env.BODY_SIZE_LIMIT ??= '12M';

const { server } = await import('./build/index.js');

// Every answer – pages and files alike – says that this app shares nothing with other sites.
// In return the browser lets it compute with several threads, which makes reading the short
// code on a container (src/lib/reader/) several times faster. The app loads nothing from other
// servers anyway, so nothing is lost. Set here and not in hooks.server.ts, because files (the
// scripts of the background threads) do not pass through there.
server.server.prependListener('request', (_request, response) => {
	response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
	response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
});
