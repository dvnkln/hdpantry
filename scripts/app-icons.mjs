// Writes the icons a browser needs to install hdpantry as an app (static/icons/ and
// static/apple-touch-icon.png) from the logo in src/lib/assets/favicon.svg.
// Run it after changing the logo:
//
//   npm install --no-save playwright && npx playwright install chromium
//   node scripts/app-icons.mjs
//
// A browser draws the pictures, so they look exactly like the logo. Playwright is only needed
// for this and is deliberately not a dependency of the project. The written files are
// committed.
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const logo = readFileSync(join(root, 'src/lib/assets/favicon.svg'), 'utf8');
// The jar alone: everything after the green background of the logo
const jar = logo
	.slice(logo.indexOf('/>') + 2, logo.lastIndexOf('</svg>'))
	.replace(/<!--.*?-->/gs, '');
const GREEN = /fill="(#[0-9a-f]{6})"/.exec(logo)[1];

// The logo as it is (rounded square), or a full square with the jar drawn smaller: phones
// cut such an icon to their own shape, so the jar has to stay inside the middle.
function svg(size, jarScale, badge = false) {
	if (badge) {
		// lid and glass in full white, the content a little lighter
		const white = jar.replace(/fill="#(?!fff)[0-9a-f]{3,6}"/g, 'fill="#fff" opacity=".6"');
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 3 24 26" width="${size}" height="${size}">${white}</svg>`;
	}
	if (!jarScale) return logo.replace('<svg ', `<svg width="${size}" height="${size}" `);
	const offset = (32 - 32 * jarScale) / 2;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
	<rect width="32" height="32" fill="${GREEN}" />
	<g transform="translate(${offset} ${offset}) scale(${jarScale})">${jar}</g>
</svg>`;
}

const browser = await chromium.launch();
async function write(file, size, jarScale, badge = false, drawing = '') {
	const page = await browser.newPage({ viewport: { width: size, height: size } });
	await page.setContent(
		`<body style="margin:0;background:transparent">${(drawing || svg(size, jarScale, badge)).replace('<svg ', '<svg style="display:block" ')}</body>`
	);
	await page.screenshot({ path: join(root, 'static', file), omitBackground: true });
	await page.close();
	console.log(file);
}

mkdirSync(join(root, 'static/icons'), { recursive: true });
await write('icons/icon-192.png', 192);
await write('icons/icon-512.png', 512);
await write('icons/icon-maskable-192.png', 192, 0.72);
await write('icons/icon-maskable-512.png', 512, 0.72);
// iPhone and iPad round the corners themselves
await write('apple-touch-icon.png', 180, 0.86);
// Shown by Android in the status bar when a notification arrives: one colour only, so the
// jar alone in white on transparent (a colourful icon would become a white box)
await write('icons/badge-96.png', 96, 0, true);
// The picture of a notification, next to its text – built like the one of hdtracker, in our
// colours: a small calendar with a clock (Lucide "calendar-clock", ISC licence) in the two
// colours of the wordmark, in the middle of a square in the dark background of the app. So it
// does not repeat the app icon the phone shows anyway.
await write(
	'icons/notify.png',
	192,
	0,
	false,
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="192" height="192">
	<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22"><stop offset="0" stop-color="#8fae7c"/><stop offset="1" stop-color="#ece3b7"/></linearGradient></defs>
	<rect width="48" height="48" fill="#141511"/>
	<g transform="translate(12.1 12.1) scale(0.95)" fill="none" stroke="url(#g)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M16 14v2.2l1.6 1"/><path d="M16 2v3"/><path d="M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338"/><path d="M3 9h5.859"/><path d="M8 2v3"/><circle cx="16" cy="16" r="6"/>
	</g>
</svg>`
);
await browser.close();
