// Rules for containers shared by browser and server.

// How a container was first read: by the camera, from a photo, or typed by hand
export const CODE_SOURCES = ['camera', 'photo', 'manual'] as const;
export type CodeSource = (typeof CODE_SOURCES)[number];

export function isCodeSource(value: unknown): value is CodeSource {
	return (CODE_SOURCES as readonly unknown[]).includes(value);
}

// "S · AB12" – how a container is called. It has no name of its own: the name a user types
// belongs to what is inside.
export function codeLabel(container: { code: string; size: string | null }) {
	return container.size ? `${container.size.toUpperCase()} · ${container.code}` : container.code;
}
