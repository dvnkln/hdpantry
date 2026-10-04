// Rules for containers shared by browser and server.
export const MAX_CONTAINER_NAME = 60;

type Coded = { code: string; size: string | null };
type Labelled = Coded & { name: string | null };

// "S · AB12" – how a container is called when it has no name of its own.
export function codeLabel(container: Coded) {
	return container.size ? `${container.size.toUpperCase()} · ${container.code}` : container.code;
}

export function containerLabel(container: Labelled) {
	return container.name || codeLabel(container);
}
