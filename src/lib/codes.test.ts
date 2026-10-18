import { describe, expect, it } from 'vitest';
import { MAX_CODE_LENGTH, parseCode, parseProductCode, isPrintedCode } from './codes';

describe('codes with parameters', () => {
	it('takes ID, size and type code from the parameters, whatever the address', () => {
		expect(parseCode('vendor://app/storage/in/?tc=11AA11&s=s&cc=AB12')).toEqual({
			id: 'AB12',
			size: 's',
			typeCode: '11AA11',
			vacuum: true
		});
		expect(parseCode('https://links.example.com/storage?tc=22BB22&s=L&cc=x9y8')).toEqual({
			id: 'X9Y8',
			size: 'l',
			typeCode: '22BB22',
			vacuum: true
		});
	});
	it('two shapes of code for the same container give the same ID', () => {
		const a = parseCode('vendor://app/storage/in/?tc=11AA11&s=m&cc=AB12');
		const b = parseCode('https://links.example.com/storage?cc=AB12');
		expect(a?.id).toBe(b?.id);
	});
	it('size and type code are optional', () => {
		expect(parseCode('https://example.com/?cc=AB12')).toEqual({
			id: 'AB12',
			size: null,
			typeCode: null,
			vacuum: true
		});
		expect(parseCode('https://example.com/?cc=AB12&s=12345')?.size).toBeNull();
	});
	it('an address without a usable ID parameter counts as a whole', () => {
		expect(parseCode('https://example.com/item/77')?.id).toBe('https://example.com/item/77');
		expect(parseCode('https://example.com/?cc=a b')?.id).toBe('https://example.com/?cc=a b');
	});
});

describe('any other code', () => {
	it('a typed short code finds the container of the scanned code', () => {
		expect(parseCode(' ab12 ')).toEqual({ id: 'AB12', size: null, typeCode: null, vacuum: false });
		expect(parseCode('ab12')?.id).toBe(parseCode('vendor://app/in/?cc=AB12')?.id);
	});
	it('other content is kept exactly, only trimmed', () => {
		expect(parseCode('  Bag L 3 ')?.id).toBe('Bag L 3');
		expect(parseCode('4012345678901')?.id).toBe('4012345678901');
	});
	it('refuses empty and overlong content', () => {
		expect(parseCode('   ')).toBeNull();
		expect(parseCode('x'.repeat(MAX_CODE_LENGTH + 1))).toBeNull();
	});
});

describe('whether a code says that its container is a vacuum container', () => {
	it('only a code of a known form does', () => {
		expect(parseCode('vendor://app/storage/in/?tc=11AA11&s=m&cc=AB12')?.vacuum).toBe(true);
		// typed short code, a product barcode, any other address or text
		expect(parseCode('AB12')?.vacuum).toBe(false);
		expect(parseCode('9991234567890')?.vacuum).toBe(false);
		expect(parseCode('https://example.com/item/77')?.vacuum).toBe(false);
		expect(parseCode('jar on the top shelf')?.vacuum).toBe(false);
	});
});

it('knows the form of a printed short code', () => {
	expect(isPrintedCode('AB12')).toBe(true);
	expect(isPrintedCode('ZQ77')).toBe(true);
	// Too short, too long, lower case, other characters: not a short code
	for (const text of ['AB1', 'AB123', 'ab12', 'AB 2', 'A-12', 'PRESS', '']) {
		expect(isPrintedCode(text)).toBe(false);
	}
});

// Invented numbers with correct check digits
describe('product barcodes', () => {
	it('takes EAN-13 and EAN-8 with a correct check digit', () => {
		expect(parseProductCode('9991234567890')).toBe('9991234567890');
		expect(parseProductCode(' 99123451 ')).toBe('99123451');
	});
	it('keeps UPC-A as EAN-13, so both readings are the same product', () => {
		expect(parseProductCode('009998887778')).toBe('0009998887778');
		expect(parseProductCode('0009998887778')).toBe('0009998887778');
	});
	it('refuses a wrong check digit, other lengths and anything not made of digits', () => {
		expect(parseProductCode('9991234567891')).toBeNull();
		expect(parseProductCode('99123452')).toBeNull();
		expect(parseProductCode('1234')).toBeNull();
		expect(parseProductCode('99912345678900')).toBeNull();
		expect(parseProductCode('AB12')).toBeNull();
		expect(parseProductCode('https://example.com/?cc=AB12')).toBeNull();
		expect(parseProductCode('')).toBeNull();
	});
});
