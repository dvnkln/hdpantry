// Rules for containers shared by browser and server.

// How a container was first read: by the camera, from a photo, typed by hand – or 'printed':
// its code could not be scanned (creased, frosted over) and the short code printed below it was
// read from the picture instead. Such a container knows only its short code until its code is
// scanned for real.
export const CODE_SOURCES = ['camera', 'photo', 'manual', 'printed'] as const;
export type CodeSource = (typeof CODE_SOURCES)[number];

export function isCodeSource(value: unknown): value is CodeSource {
	return (CODE_SOURCES as readonly unknown[]).includes(value);
}

// "S · AB12" – how a container is called. It has no name of its own: the name a user types
// belongs to what is inside.
export function codeLabel(container: { code: string; size: string | null }) {
	return container.size ? `${container.size.toUpperCase()} · ${container.code}` : container.code;
}

// A container as it is offered when recording without the camera
export type Pick = {
	id: number;
	code: string;
	size: string | null;
	manual: boolean;
	// What is in it now, and what was taken out of it last (null: nothing)
	content: string | null;
	last: string | null;
};
