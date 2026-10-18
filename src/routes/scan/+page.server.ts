import { fail, redirect } from '@sveltejs/kit';
import { isPrintedCode, parseProductCode } from '$lib/codes';
import { codeLabel, isCodeSource, type CodeSource } from '$lib/containers';
import {
	addScanned,
	containersToPick,
	convertToScanned,
	openScanned,
	openTyped,
	type Container
} from '$lib/server/containers';
import { mixTiles } from '$lib/picks';
import { diagnosticsOn } from '$lib/server/diagnostics';
import { serverMessages } from '$lib/server/i18n';
import { activeItem, containerHistory } from '$lib/server/items';
import {
	attachBarcode,
	findProduct,
	getProduct,
	productOfCode,
	productsToPick
} from '$lib/server/products';
import type { Actions, PageServerLoad } from './$types';

// A full container shows its content; an empty one asks right away what goes in.
function pageOf(container: Container) {
	return activeItem(container.id)
		? `/containers/${container.id}`
		: `/containers/${container.id}/add`;
}

async function read(request: Request) {
	const data = await request.formData();
	const source = data.get('source');
	return {
		raw: String(data.get('raw') ?? ''),
		source: (isCodeSource(source) ? source : null) as CodeSource | null,
		twinId: Number(data.get('twin')),
		// Scanning to give a product recorded without a code its barcode (?attach=)
		attach: Number(data.get('attach'))
	};
}

// What there is to choose from below the field: products and containers in one list, the ones
// used last first. Tapping one is like scanning it.
export const load: PageServerLoad = ({ url }) => ({
	// Test container only: figures of each attempt go to the server log
	diagnostics: diagnosticsOn(),
	// Giving a product its barcode: which one
	attach: attachingTo(url),
	tiles: mixTiles(containersToPick(), productsToPick())
});

function attachingTo(url: URL) {
	const id = Number(url.searchParams.get('attach'));
	const product = id > 0 ? getProduct(id) : undefined;
	return product && !product.barcode ? { id: product.id, name: product.name } : null;
}

export const actions: Actions = {
	// A code was read. It leads on without any question – except when a scanned code was
	// typed in by hand before: then the user says whether the two are the same container.
	found: async ({ request, locals }) => {
		const { raw, source, attach } = await read(request);
		const t = serverMessages(locals.locale);
		const unreadable = () => fail(400, { error: t.scan.unreadable });

		if (attach) {
			const product = getProduct(attach);
			const barcode = parseProductCode(raw);
			if (!product) return fail(404, { error: t.products.notFound });
			if (!barcode || source === 'printed') return fail(400, { error: t.products.notProduct });
			if (attachBarcode(product.id, barcode) === 'taken') {
				return fail(409, { error: t.products.taken(findProduct(barcode)!.name) });
			}
			redirect(303, `/products/${product.id}`);
		}
		const product = productOfCode(raw, source);
		if (product) {
			redirect(
				303,
				product.known
					? `/products/${product.known.id}/add`
					: `/products/new?barcode=${product.barcode}`
			);
		}

		if (source === 'manual') {
			const container = openTyped(raw);
			if (!container) return unreadable();
			redirect(303, pageOf(container));
		}
		// A printed short code read from the picture works like the scanned code – but only a
		// text of exactly that form is taken for one
		if (source === 'printed' && !isPrintedCode(raw.trim())) return unreadable();
		const result = openScanned(raw, source);
		if (!result) return unreadable();
		// `?printed`: the next page says, quietly, how the container was recognised
		if (result.container) {
			redirect(303, pageOf(result.container) + (source === 'printed' ? '?printed' : ''));
		}
		const twin = result.twin;
		return {
			twin: {
				id: twin.id,
				label: codeLabel(twin),
				content: activeItem(twin.id)?.name ?? null,
				history: containerHistory(twin.id, 1000).length
			}
		};
	},

	// "The same container": the typed one becomes the scanned one.
	merge: async ({ request, locals }) => {
		const { raw, source, twinId } = await read(request);
		const container = convertToScanned(twinId, raw, source) ?? addScanned(raw, source);
		if (!container) return fail(400, { error: serverMessages(locals.locale).scan.unreadable });
		redirect(303, pageOf(container));
	},

	// "Not the same": the scanned code gets its own container.
	separate: async ({ request, locals }) => {
		const { raw, source } = await read(request);
		const container = addScanned(raw, source);
		if (!container) return fail(400, { error: serverMessages(locals.locale).scan.unreadable });
		redirect(303, pageOf(container));
	}
};
