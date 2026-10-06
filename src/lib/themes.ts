// Colour schemes of the interface. The colours themselves are defined in routes/layout.css,
// in the blocks for [data-theme='…'].
//
// bar: colour of the browser's own bar on phones – [on light devices, on dark devices]
export const THEMES = {
	// Follows the device
	system: { bar: ['#f6f6f0', '#141511'] },
	dark: { bar: ['#141511', '#141511'] },
	light: { bar: ['#f6f6f0', '#f6f6f0'] }
} as const;

export type Theme = keyof typeof THEMES;
export const THEME_KEYS = Object.keys(THEMES) as Theme[];
export const DEFAULT_THEME: Theme = 'system';

export function isTheme(value: unknown): value is Theme {
	return typeof value === 'string' && Object.hasOwn(THEMES, value);
}
