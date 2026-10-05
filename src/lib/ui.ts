// Shared class lists for the settings pages, so they look the same.
export const ui = {
	pageTitle: 'text-xl font-bold',
	// One box per topic
	card: 'mt-6 rounded-xl border border-line bg-surface/50 p-4',
	// Heading of a box: a symbol (size 20, muted) and the title
	heading: 'flex items-center gap-2 text-lg font-semibold',
	// A field with its name above it and, if needed, a hint below
	label: 'flex flex-col gap-1',
	labelText: 'text-sm font-medium',
	hint: 'text-xs text-muted',
	// A row of buttons, with the answer of the server next to them
	actions: 'flex flex-wrap items-center gap-3',
	// A choice out of a few: a row with the round mark of a radio button in front
	option:
		'flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm transition-colors hover:border-accent has-checked:border-accent has-focus-visible:outline-2 has-focus-visible:outline-accent',
	radio: 'size-4 shrink-0 accent-accent',
	// Link to a guide in the wiki (opens only when tapped)
	link: 'underline underline-offset-2 transition-colors hover:text-accent'
};

export const REPO = 'https://github.com/dvnkln/hdpantry';
export const WIKI = `${REPO}/wiki`;
