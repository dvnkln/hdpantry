import { describe, expect, it } from 'vitest';
import { matchTiles, mixTiles, typedAction, type ContainerTile, type ProductTile } from './picks';

// Invented codes and numbers
const box = (code: string, used: number, more: Partial<ContainerTile> = {}): ContainerTile => ({
	kind: 'container',
	id: used,
	code,
	size: null,
	manual: false,
	source: 'camera',
	content: null,
	last: null,
	fill: null,
	used,
	...more
});
const product = (name: string, used: number, more: Partial<ProductTile> = {}): ProductTile => ({
	kind: 'product',
	id: used,
	name,
	icon: null,
	category: null,
	barcode: null,
	packs: 0,
	shape: 'box',
	used,
	...more
});

const list = mixTiles(
	[
		box('AB12', 5, { content: 'Lentil soup', size: 's' }),
		box('JAR7', 2, { manual: true, last: 'Pea soup' }),
		box('9991234567890', 1)
	],
	[product('Peas', 4, { barcode: '99123451' }), product('Pea soup', 3), product('Bread', 6)]
);
const titles = (typed: string) =>
	matchTiles(list, typed).map((t) => (t.kind === 'product' ? t.name : t.code));

describe('one list of products and containers', () => {
	it('the ones used last first, both kinds mixed', () => {
		expect(titles('')).toEqual(['Bread', 'AB12', 'Peas', 'Pea soup', 'JAR7', '9991234567890']);
	});
	it('beginning with it first, then containing it, then in the content or the barcode', () => {
		expect(titles('pea')).toEqual(['Peas', 'Pea soup', 'JAR7']);
		expect(titles('soup')).toEqual(['Pea soup', 'AB12', 'JAR7']);
		expect(titles('ab')).toEqual(['AB12']);
		expect(titles('S · AB')).toEqual(['AB12']);
		expect(titles('2345')).toEqual(['9991234567890', 'Peas']);
		expect(titles('zzz')).toEqual([]);
	});
});

describe('what typing does', () => {
	const action = (typed: string) => {
		const result = typedAction(list, typed);
		if (!result) return null;
		if (result.open)
			return result.open.kind === 'product'
				? `open ${result.open.name}`
				: `open ${result.open.code}`;
		return `create ${result.create.join(', ')}`;
	};
	it('opens exactly what is meant: short code, barcode, the very name', () => {
		expect(action('ab12')).toBe('open AB12');
		expect(action('99123451')).toBe('open Peas');
		expect(action('  pea   SOUP ')).toBe('open Pea soup');
		// a container recorded with a barcode stays that container
		expect(action('9991234567890')).toBe('open 9991234567890');
	});
	it('offers to add what is not there, the likelier first', () => {
		expect(action('Rolls')).toBe('create name, container');
		expect(action('CD34')).toBe('create container, name');
		expect(action('1234')).toBe('create container');
		expect(action('Chili con carne')).toBe('create name');
		expect(action('9991234567906')).toBe('create barcode');
		// the whole content of a code: a container, as if scanned
		expect(action('https://example.com/?cc=EF56&s=m')).toBe('create container');
		expect(action('vendor://app/x')).toBe('create container');
		expect(action('https://example.com/?cc=ab12')).toBe('open AB12');
		expect(action('   ')).toBeNull();
	});
});
