// Writes the symbol files under static/food/ from the list in src/lib/food/icons.ts.
// Run it after changing that list:
//
//   npm install --no-save @iconify-json/twemoji @iconify-json/lucide @iconify-json/tabler
//   node scripts/food-icons.mjs
//
// The three packages are only needed for this and are deliberately not dependencies of the
// project. The written files are committed.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { ICONS, lineFile } from '../src/lib/food/icons.ts';

const require = createRequire(import.meta.url);
const load = (set) =>
	JSON.parse(readFileSync(require.resolve(`@iconify-json/${set}/icons.json`), 'utf8'));
const sets = { twemoji: load('twemoji'), lucide: load('lucide'), tabler: load('tabler') };

function svg(set, name, { black = false } = {}) {
	const data = sets[set];
	const icon = data.icons[name] ?? data.icons[data.aliases?.[name]?.parent];
	if (!icon) throw new Error(`No icon "${name}" in ${set}`);
	const width = icon.width ?? data.width ?? 16;
	const height = icon.height ?? data.height ?? 16;
	// Line icons are used as a mask: their own colour does not matter, black is fine
	const body = black ? icon.body.replaceAll('currentColor', '#000') : icon.body;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${body}</svg>\n`;
}

const out = new URL('../static/food/', import.meta.url);
rmSync(out, { recursive: true, force: true });
mkdirSync(new URL('color/', out), { recursive: true });
mkdirSync(new URL('line/', out), { recursive: true });

const lines = new Set();
for (const key of ICONS) {
	writeFileSync(new URL(`color/${key}.svg`, out), svg('twemoji', key));
	lines.add(lineFile(key));
}
for (const file of lines) {
	const [set, ...name] = file.split('-');
	writeFileSync(new URL(`line/${file}.svg`, out), svg(set, name.join('-'), { black: true }));
}

writeFileSync(
	new URL('LICENSE.txt', out),
	`Symbols in this folder

color/  Twemoji – Copyright Twitter, Inc and other contributors.
        Graphics licensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
        https://github.com/jdecked/twemoji

line/   lucide-*  Lucide – ISC License, Copyright Lucide Contributors. https://lucide.dev
        tabler-*  Tabler Icons – MIT License, Copyright Paweł Kuna. https://tabler.io/icons
`
);
console.log(`${ICONS.length} colour symbols, ${lines.size} line symbols written to static/food/`);
