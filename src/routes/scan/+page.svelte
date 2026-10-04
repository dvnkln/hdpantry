<script lang="ts">
	import { onMount } from 'svelte';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import CameraScanner from '$lib/components/CameraScanner.svelte';
	import { codeLabel, MAX_CONTAINER_NAME } from '$lib/containers';
	import { m } from '$lib/i18n/index.svelte';
	import { readCode } from '$lib/scanner';
	import { Camera, ImageUp } from '@lucide/svelte';

	type Unknown = { raw: string; code: string; size: string | null };

	let cameraOn = $state(false);
	let manual = $state('');
	let message = $state('');
	let busy = $state(false);
	// A code that belongs to no container yet: shown with the form to add it
	let unknown = $state<Unknown | null>(null);

	// Phones start the camera right away; on a computer it is only a button.
	onMount(() => {
		cameraOn = window.matchMedia('(pointer: coarse)').matches;
	});

	// Asks the server what the code belongs to. Known container: its page opens at once.
	async function found(raw: string) {
		if (busy || unknown) return;
		busy = true;
		message = '';
		try {
			const body = new FormData();
			body.set('raw', raw);
			const response = await fetch('?/found', {
				method: 'POST',
				body,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await response.text());
			if (result.type === 'success') unknown = (result.data?.unknown as Unknown) ?? null;
			else if (result.type === 'failure') message = String(result.data?.error ?? m.scan.failed);
			else await applyAction(result); // redirect to the container
		} catch {
			message = m.scan.failed;
		} finally {
			busy = false;
		}
	}

	// The photo is read here in the browser and never uploaded.
	async function onPhoto(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = ''; // the same file can be chosen again
		if (!file) return;
		message = m.scan.photoReading;
		try {
			const picture = await createImageBitmap(file);
			const code = await readCode(picture);
			picture.close();
			message = code ? '' : m.scan.photoNoCode;
			if (code) await found(code.text);
		} catch (err) {
			console.error('Reading the photo failed', err);
			message = m.scan.photoFailed;
		}
	}

	function onManual(event: SubmitEvent) {
		event.preventDefault();
		if (manual.trim()) found(manual);
	}
</script>

<svelte:head><title>{m.scan.title} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-md px-4 py-6">
	{#if unknown}
		<h1 class="text-xl font-bold">{m.scan.newTitle}</h1>
		<p class="mt-1 text-sm text-muted">{m.scan.newHint}</p>
		<p class="mt-4 rounded-xl border border-line bg-surface p-3 font-mono text-lg font-semibold">
			{codeLabel(unknown)}
		</p>

		<form method="POST" action="?/create" use:enhance class="mt-4 flex flex-col gap-4">
			<input type="hidden" name="raw" value={unknown.raw} />
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">{m.containers.nameOptional}</span>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					name="name"
					maxlength={MAX_CONTAINER_NAME}
					placeholder={m.containers.namePlaceholder}
					autocomplete="off"
					autofocus
				/>
			</label>
			<div class="flex gap-2">
				<button type="button" class="flex-1 btn-secondary" onclick={() => (unknown = null)}>
					{m.common.cancel}
				</button>
				<button class="flex-1 btn-primary">{m.scan.addContainer}</button>
			</div>
		</form>
	{:else}
		<h1 class="text-xl font-bold">{m.scan.title}</h1>
		<p class="mt-1 text-sm text-muted">{m.scan.intro}</p>

		<div class="mt-6 flex flex-col gap-4">
			{#if cameraOn}
				<CameraScanner onscan={(code) => found(code.text)} />
			{:else}
				<button
					type="button"
					class="flex items-center justify-center gap-2 btn-secondary"
					onclick={() => (cameraOn = true)}
				>
					<Camera size={18} />
					{m.scan.startCamera}
				</button>
			{/if}

			{#if message}
				<p class="text-sm text-muted" role="status">{message}</p>
			{/if}

			<form class="flex flex-col gap-1" onsubmit={onManual}>
				<label for="manual" class="text-sm font-medium">{m.scan.manual}</label>
				<div class="flex gap-2">
					<input
						id="manual"
						bind:value={manual}
						autocomplete="off"
						autocapitalize="characters"
						spellcheck="false"
						class="min-w-0 flex-1 font-mono"
					/>
					<button class="btn-primary" disabled={!manual.trim() || busy}>{m.scan.open}</button>
				</div>
			</form>

			<label class="flex cursor-pointer items-center justify-center gap-2 btn-secondary">
				<ImageUp size={18} />
				{m.scan.photo}
				<input type="file" accept="image/*" class="sr-only" onchange={onPhoto} />
			</label>

			<a href="/scan/check" class="self-center btn-quiet">{m.scan.checkLink}</a>
		</div>
	{/if}
</main>
