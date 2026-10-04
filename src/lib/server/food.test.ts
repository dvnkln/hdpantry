import { expect, it } from 'vitest';
import { foodMemoryAll, learnFood } from './food';

it('remembers a correction for a name, whatever its spelling', () => {
	learnFood('Provolone', 'cheese_soft', null); // the dictionary says hard cheese
	expect(foodMemoryAll()).toEqual({ provolone: { category: 'cheese_soft', icon: null } });
	learnFood('  PROVOLONE! ', 'cured', 'bacon');
	expect(foodMemoryAll()).toEqual({ provolone: { category: 'cured', icon: 'bacon' } });
});

it('does not store what the dictionary says anyway, and forgets a correction taken back', () => {
	learnFood('Lachs', 'fish_raw', null);
	expect(foodMemoryAll().lachs).toBeUndefined();
	learnFood('Provolone', 'cheese_hard', null);
	expect(foodMemoryAll().provolone).toBeUndefined();
});

it('a chosen symbol is remembered even with the suggested kind of food', () => {
	learnFood('Lachs', 'fish_raw', 'sushi');
	expect(foodMemoryAll().lachs).toEqual({ category: 'fish_raw', icon: 'sushi' });
});

it('remembers names the dictionary does not know', () => {
	learnFood('Omas Spezial', 'leftovers', null);
	expect(foodMemoryAll()['omas spezial'].category).toBe('leftovers');
	learnFood('   ', 'leftovers', null);
	expect(Object.keys(foodMemoryAll())).not.toContain('');
});
