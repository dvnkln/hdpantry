// What the page for scanning and typing offers below its field: products and containers in one
// list, the ones used last first – and what typing into that field will do. Shared by browser
// and tests; the server sends the two lists (containersToPick, productsToPick).
import { parseCode, parseProductCode } from './codes';
import { codeLabel, type CodeSource, type Pick } from './containers';
import type { Category } from './food/categories';
import { MAX_ITEM_NAME, type FillLevel } from './items';
import type { PackShape } from './products';

export type ContainerTile = Pick & {
	kind: 'container';
	source: CodeSource | null;
	// Fill level of what is in it now (null: empty)
	fill: FillLevel | null;
	// When it was last used (ms): filled, emptied or added
	used: number;
};
export type ProductTile = {
	kind: 'product';
	id: number;
	name: string;
	icon: string | null;
	category: Category | null;
	barcode: string | null;
	// Packs in stock now
	packs: number;
	shape: PackShape;
	used: number;
};
export type Tile = ContainerTile | ProductTile;

// Both lists as one, the ones used last first
export function mixTiles(containers: ContainerTile[], products: ProductTile[]): Tile[] {
	return [...containers, ...products].sort((a, b) => b.used - a.used);
}

const simple = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

// The tiles that fit what is typed: first those whose name or code begins with it, then those
// whose name or code contains it, then those where it is in what a container holds (now or
// last) or in the barcode of a product. Upper and lower case do not matter; within each group
// the order of the list stays. Nothing typed: all.
export function matchTiles<T extends Tile>(list: readonly T[], typed: string): T[] {
	const wanted = simple(typed);
	if (!wanted) return [...list];
	const groups: T[][] = [[], [], []];
	for (const tile of list) {
		const title = (tile.kind === 'product' ? tile.name : codeLabel(tile)).toLowerCase();
		const more =
			tile.kind === 'product'
				? /^\d+$/.test(wanted)
					? (tile.barcode ?? '')
					: ''
				: (tile.content ?? tile.last ?? '').toLowerCase();
		const code = tile.kind === 'container' ? tile.code.toLowerCase() : '';
		if (title.startsWith(wanted) || code.startsWith(wanted)) groups[0].push(tile);
		else if (title.includes(wanted)) groups[1].push(tile);
		else if (more.includes(wanted)) groups[2].push(tile);
	}
	return groups.flat();
}

// What can be added from what is typed, the likelier first: a product of that name, a product
// with that barcode, or a container with that short code
export type NewFromTyped = 'name' | 'barcode' | 'container';

// What the field will do with what is typed:
// - `open`: exactly this one is meant (its barcode, its short code, its very name) – a tap opens
//   it like a scan would;
// - `create`: nothing is meant exactly – what could be added, the likelier first;
// - null: nothing (usable) typed.
// Codes are read the way the server reads them (short codes in capitals; of a scanned and a
// typed container with the same code, the scanned one).
export function typedAction(
	list: readonly Tile[],
	typed: string
): { open: Tile; create?: undefined } | { create: NewFromTyped[]; open?: undefined } | null {
	const text = typed.trim().replace(/\s+/g, ' ');
	if (!text) return null;
	const containers = list.filter((t): t is ContainerTile => t.kind === 'container');
	const products = list.filter((t): t is ProductTile => t.kind === 'product');

	const barcode = parseProductCode(text);
	const id = parseCode(text)?.id;
	const sameCode = containers.filter((c) => c.code === id);
	const container = sameCode.find((c) => !c.manual) ?? sameCode[0];
	// A container recorded with a barcode before products existed stays that container
	if (container) return { open: container };
	if (barcode) {
		const product = products.find((p) => p.barcode === barcode);
		return product ? { open: product } : { create: ['barcode'] };
	}
	const named = products.find((p) => simple(p.name) === simple(text));
	if (named) return { open: named };

	// The whole content of a code (an address with the short code in it, as the camera reads it)
	// is a container, never a name
	if (
		(id !== undefined && id !== text && id !== text.toUpperCase()) ||
		/^[a-z][a-z0-9+.-]*:\/\//i.test(text)
	) {
		return { create: ['container'] };
	}
	const create: NewFromTyped[] = [];
	const codeLike = /^[A-Za-z0-9]{2,12}$/.test(text);
	const nameLike = !/^\d+$/.test(text) && text.length <= MAX_ITEM_NAME;
	// With a digit in it, a short code is likelier ("AB12"); otherwise a name ("Brot")
	if (codeLike && /\d/.test(text)) create.push('container');
	if (nameLike) create.push('name');
	if (codeLike && !create.includes('container')) create.push('container');
	return create.length ? { create } : null;
}
