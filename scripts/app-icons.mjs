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
function svg(size, jarScale) {
	if (!jarScale) return logo.replace('<svg ', `<svg width="${size}" height="${size}" `);
	const offset = (32 - 32 * jarScale) / 2;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
	<rect width="32" height="32" fill="${GREEN}" />
	<g transform="translate(${offset} ${offset}) scale(${jarScale})">${jar}</g>
</svg>`;
}

const browser = await chromium.launch();
async function write(file, size, jarScale) {
	const page = await browser.newPage({ viewport: { width: size, height: size } });
	await page.setContent(
		`<body style="margin:0;background:transparent">${svg(size, jarScale).replace('<svg ', '<svg style="display:block" ')}</body>`
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
await browser.close();
