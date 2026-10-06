<script lang="ts">
	import { onMount } from 'svelte';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { page } from '$app/state';
	import CameraScanner from '$lib/components/CameraScanner.svelte';
	import type { CodeSource } from '$lib/containers';
	import { m } from '$lib/i18n/index.svelte';
	import { readCode } from '$lib/scanner';
	import { Camera, ImageUp } from '@lucide/svelte';

	let cameraOn = $state(false);
	let manual = $state('');
	let message = $state('');
	let busy = $state(false);
	// Typing a code and reading a photo only appear on request
	// (asked for right away with /scan?manual, e.g. from the empty stock)
	let otherWays = $state(page.url.searchParams.has('manual'));

	// A scanned code that was typed in by hand before: the typed container, and what was scanned
	type Twin = { id: number; label: string; content: string | null; history: number };
	let twin = $state<(Twin & { raw: string; source: CodeSource }) | null>(null);

	// Phones start the camera right away; on a computer it is only a button.
	onMount(() => {
		cameraOn = !otherWays && window.matchMedia('(pointer: coarse)').matches;
	});

	// Hands the code to the server, which leads on to the container – no question in between.
	async function found(raw: string, source: CodeSource) {
		if (busy || twin) return;
		busy = true;
		message = '';
		try {
			const body = new FormData();
			body.set('raw', raw);
			body.set('source', source);
			const response = await fetch('?/found', {
				method: 'POST',
				body,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await response.text());
			if (result.type === 'success' && result.data?.twin) {
				twin = { ...(result.data.twin as Twin), raw, source };
			} else if (result.type === 'failure') message = String(result.data?.error ?? m.scan.failed);
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
			if (code) await found(code.text, 'photo');
		} catch (err) {
			console.error('Reading the photo failed', err);
			message = m.scan.photoFailed;
		}
	}

	function onManual(event: SubmitEvent) {
		event.preventDefault();
		if (manual.trim()) found(manual, 'manual');
	}
</script>

<svelte:head><title>{m.scan.title} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-md px-4 py-6">
	{#if twin}
		<h1 class="text-xl font-bold">{m.scan.twinTitle}</h1>
		<p class="mt-2">{m.scan.twinText(twin.label, twin.content, twin.history)}</p>
		<p class="mt-2 text-sm text-muted">{m.scan.twinHint}</p>
		<form method="POST" use:enhance class="mt-4 flex flex-col gap-2">
			<input type="hidden" name="raw" value={twin.raw} />
			<input type="hidden" name="source" value={twin.source} />
			<input type="hidden" name="twin" value={twin.id} />
			<button formaction="?/merge" class="btn-primary">{m.scan.twinMerge}</button>
			<button formaction="?/separate" class="btn-secondary">{m.scan.twinSeparate}</button>
			<button type="button" class="self-center btn-quiet" onclick={() => (twin = null)}>
				{m.common.cancel}
			</button>
		</form>
	{:else}
		<h1 class="text-xl font-bold">{m.scan.title}</h1>
		<p class="mt-1 text-sm text-muted">{m.scan.intro}</p>

		<div class="mt-6 flex flex-col gap-4">
			{#if cameraOn}
				<CameraScanner onscan={(code) => found(code.text, 'camera')} />
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

			{#if !otherWays}
				<!-- Scanning comes first; typing and photos are one step away -->
				<button type="button" class="self-center btn-quiet" onclick={() => (otherWays = true)}>
					{m.scan.other}
				</button>
			{:else}
				<form class="flex flex-col gap-1" onsubmit={onManual}>
					<label for="manual" class="text-sm font-medium">{m.scan.manual}</label>
					<div class="flex gap-2">
						<!-- svelte-ignore a11y_autofocus -->
						<input
							id="manual"
							bind:value={manual}
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
							autofocus
							class="min-w-0 flex-1 font-mono"
						/>
						<button class="btn-primary" disabled={!manual.trim() || busy}>{m.scan.open}</button>
					</div>
					<p class="text-xs text-muted">{m.scan.manualHint}</p>
				</form>

				<label class="flex cursor-pointer items-center justify-center gap-2 btn-secondary">
					<ImageUp size={18} />
					{m.scan.photo}
					<input type="file" accept="image/*" class="sr-only" onchange={onPhoto} />
				</label>

				<a href="/scan/check" class="self-center btn-quiet">{m.scan.checkLink}</a>
			{/if}
		</div>
	{/if}
</main>
