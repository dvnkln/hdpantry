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

// Narrows the containers down to what is typed: first those whose code fits, then those
// whose content (now or last) fits. Upper and lower case do not matter; nothing typed: all.
export function matchContainers<T extends Pick>(list: readonly T[], typed: string): T[] {
	const wanted = typed.trim().toLowerCase();
	if (!wanted) return [...list];
	const byCode: T[] = [];
	const byContent: T[] = [];
	for (const container of list) {
		if (codeLabel(container).toLowerCase().includes(wanted)) byCode.push(container);
		else if ((container.content ?? container.last ?? '').toLowerCase().includes(wanted)) {
			byContent.push(container);
		}
	}
	return [...byCode, ...byContent];
}
