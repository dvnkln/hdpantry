import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

// The release workflow takes the notes of a version from CHANGELOG.md and fails without them –
// after the image is published. These checks fail earlier, with every push.
const changelog = readFileSync('CHANGELOG.md', 'utf8');
const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
const headings = changelog.split('\n').filter((line) => line.startsWith('## '));

it('has a section for the version in package.json, as a heading of its own', () => {
	const released = headings.filter((line) => line.startsWith(`## ${version} – `));
	expect(released).toHaveLength(1);
	expect(released[0]).toMatch(/^## \d+\.\d+\.\d+ – \d{4}-\d{2}-\d{2}$/);
});

it('keeps the explanatory comment closed and free of headings', () => {
	const start = changelog.indexOf('<!--');
	const end = changelog.indexOf('-->');
	expect(start).toBeGreaterThan(-1);
	expect(end).toBeGreaterThan(start);
	// Nothing that looks like a heading inside it: a search for a heading must not land there
	expect(changelog.slice(start, end)).not.toMatch(/##/);
	// … and the first heading comes after it
	expect(changelog.indexOf('\n## ')).toBeGreaterThan(end);
});

it('lists versions newest first, each once', () => {
	const versions = headings
		.map((line) => /^## (\d+)\.(\d+)\.(\d+) /.exec(line))
		.filter((match) => match !== null)
		.map((match) => match.slice(1).map(Number));
	expect(versions.length).toBeGreaterThan(0);
	for (let i = 1; i < versions.length; i++) {
		const [a, b] = [versions[i - 1], versions[i]];
		const newer = a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2];
		expect(newer, `${a.join('.')} before ${b.join('.')}`).toBe(true);
	}
});
