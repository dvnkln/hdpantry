import { expect, it } from 'vitest';
import {
	addContainer,
	deleteContainer,
	findContainerByCode,
	getContainer,
	listContainers,
	renameContainer
} from './containers';

it('adds a container from a code and keeps the raw content', () => {
	const raw = 'vendor://app/storage/in/?tc=11AA11&s=m&cc=AB12';
	const added = addContainer(` ${raw} `, '  Bag   M 1 ');
	expect(added).toMatchObject({
		code: 'AB12',
		size: 'm',
		typeCode: '11AA11',
		name: 'Bag M 1',
		rawContent: raw
	});
});

it('the same container is never added twice – whatever shape the code has', () => {
	const first = findContainerByCode('AB12');
	expect(addContainer('https://links.example.com/storage?cc=AB12', 'other name')?.id).toBe(
		first?.id
	);
	expect(addContainer('ab12')?.id).toBe(first?.id);
	expect(getContainer(first!.id)?.name).toBe('Bag M 1'); // untouched
});

it('a name is optional and can be changed or removed', () => {
	const plain = addContainer('ZZ99')!;
	expect(plain.name).toBeNull();
	renameContainer(plain.id, 'Box 1');
	expect(getContainer(plain.id)?.name).toBe('Box 1');
	renameContainer(plain.id, '   ');
	expect(getContainer(plain.id)?.name).toBeNull();
	renameContainer(plain.id, 'x'.repeat(200));
	expect(getContainer(plain.id)?.name).toHaveLength(60);
	renameContainer(plain.id, '');
});

it('lists named containers first, by name, then the others by code', () => {
	addContainer('CC33', 'apple box');
	addContainer('AA11');
	expect(listContainers().map((c) => c.name ?? c.code)).toEqual([
		'apple box',
		'Bag M 1',
		'AA11',
		'ZZ99'
	]);
});

it('refuses content that cannot be a code', () => {
	expect(addContainer('   ')).toBeNull();
});

it('deletes a container', () => {
	const gone = findContainerByCode('ZZ99')!;
	deleteContainer(gone.id);
	expect(getContainer(gone.id)).toBeUndefined();
});
