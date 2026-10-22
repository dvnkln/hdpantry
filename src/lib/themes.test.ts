import { describe, expect, it } from 'vitest';
import { THEMES, appColor } from './themes';

describe('colour of the installed app', () => {
	it('the background of the scheme; "system" takes the dark one (one colour only)', () => {
		expect(appColor('light')).toBe(THEMES.light.bar[0]);
		expect(appColor('dark')).toBe(THEMES.dark.bar[0]);
		expect(appColor('system')).toBe(THEMES.dark.bar[0]);
	});
});
