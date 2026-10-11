// What the reader found over several pictures of a camera: one look can be off, so a line only
// counts as read once it came out the same, and sure, more than once.

// From here on the reader counts as sure of a line. Measured: right readings came with 0.99 and
// more, wrong ones (patterns in the food, embossed print) stayed below 0.85.
export const SURE = 0.9;
// How often a line has to be read sure before it is believed
export const TIMES = 2;

export type Seen = {
	text: string;
	// The highest confidence it was read with
	best: number;
	// In how many pictures it was read at all, and in how many of them sure
	times: number;
	sure: number;
};

// Adds the lines of one picture to what was seen so far. The surest come first.
export function addLines(seen: readonly Seen[], lines: { text: string; confidence: number }[]) {
	const next = new Map(seen.map((entry) => [entry.text, { ...entry }]));
	// A line that shows twice in one picture still counts once for that picture
	const inPicture = new Map<string, number>();
	for (const line of lines) {
		if (!line.text) continue;
		inPicture.set(line.text, Math.max(inPicture.get(line.text) ?? 0, line.confidence));
	}
	for (const [text, confidence] of inPicture) {
		const entry = next.get(text) ?? { text, best: 0, times: 0, sure: 0 };
		entry.best = Math.max(entry.best, confidence);
		entry.times++;
		if (confidence >= SURE) entry.sure++;
		next.set(text, entry);
	}
	return [...next.values()].sort((a, b) => b.sure - a.sure || b.best - a.best);
}

// The line that counts as read, if there is one: read sure often enough. `fits` narrows it
// down, e.g. to the form of a short code.
export function surelyRead(seen: readonly Seen[], fits: (text: string) => boolean = () => true) {
	return seen.find((entry) => entry.sure >= TIMES && fits(entry.text)) ?? null;
}
