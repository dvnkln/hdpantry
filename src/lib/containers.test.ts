import { describe, expect, it } from 'vitest';
import { matchContainers, type Pick } from './containers';

const pick = (code: string, content: string | null, last: string | null = null): Pick => ({
	id: 0,
	code,
	size: null,
	manual: true,
	content,
	last
});

describe('containers offered while typing', () => {
	const list = [
		pick('JAR1', null, 'Provolone'),
		pick('JAR2', 'Carrots'),
		pick('BOX7', 'Jar of honey'),
		{ ...pick('AB12', null), size: 'm', manual: false }
	];
	const codes = (typed: string) => matchContainers(list, typed).map((c) => c.code);

	it('nothing typed: all of them, in their order', () => {
		expect(codes('  ')).toEqual(['JAR1', 'JAR2', 'BOX7', 'AB12']);
	});
	it('the code first, then what is or was in it', () => {
		expect(codes('jar')).toEqual(['JAR1', 'JAR2', 'BOX7']);
		expect(codes('prov')).toEqual(['JAR1']);
		expect(codes('carr')).toEqual(['JAR2']);
	});
	it('finds a scanned one by its name with the size', () => {
		expect(codes('m · ab')).toEqual(['AB12']);
		expect(codes('zzz')).toEqual([]);
	});
});
