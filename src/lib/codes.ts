// Turns the raw content of a scanned (or typed) code into the ID of a container.
//
// What manufacturers put into their codes differs, so the rules are kept in one place and are
// easy to extend. The raw content is always stored with the container, so containers can be
// re-read if a rule changes later.

export type ParsedCode = {
	// Identifies the container. Also what is shown as its short code.
	id: string;
	// Size given by the code ('s', 'm', 'l', …), if any
	size: string | null;
	// Further code of the manufacturer (meaning unknown, possibly the product type); kept as is
	typeCode: string | null;
};

// Codes that are an address with parameters, e.g. "app://something/in/?tc=11AA11&s=m&cc=AB12":
// which parameter holds what. The address in front of the parameters does not matter.
const PARAMETER_RULES = [{ id: 'cc', size: 's', typeCode: 'tc' }];

// A short code as printed on a container: letters and digits only. Typed by hand it may come
// in lower case, so these are stored in upper case.
const SHORT_CODE = /^[A-Za-z0-9]{2,12}$/;
const SIZE = /^[A-Za-z]{1,3}$/;

export const MAX_CODE_LENGTH = 500;

function parameters(text: string) {
	try {
		return new URL(text).searchParams;
	} catch {
		return null; // not an address
	}
}

// Returns null for empty or overlong content.
export function parseCode(raw: string): ParsedCode | null {
	const text = raw.trim();
	if (!text || text.length > MAX_CODE_LENGTH) return null;

	const params = parameters(text);
	if (params) {
		for (const rule of PARAMETER_RULES) {
			const id = params.get(rule.id)?.trim() ?? '';
			if (!SHORT_CODE.test(id)) continue;
			const size = params.get(rule.size)?.trim() ?? '';
			return {
				id: id.toUpperCase(),
				size: SIZE.test(size) ? size.toLowerCase() : null,
				typeCode: params.get(rule.typeCode)?.trim() || null
			};
		}
	}

	// Any other code: its whole content is the ID.
	return { id: SHORT_CODE.test(text) ? text.toUpperCase() : text, size: null, typeCode: null };
}
