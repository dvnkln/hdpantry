<script lang="ts">
	import { onMount } from 'svelte';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { page } from '$app/state';
	import CameraScanner from '$lib/components/CameraScanner.svelte';
	import { parseCode } from '$lib/codes';
	import { codeLabel, matchContainers, type CodeSource } from '$lib/containers';
	import { m } from '$lib/i18n/index.svelte';
	import { readCode } from '$lib/scanner';
	import { Camera, ImageUp } from '@lucide/svelte';

	let { data } = $props();

	let cameraOn = $state(false);
	let manual = $state('');
	let message = $state('');
	let busy = $state(false);
	// Typing a code is always possible below the camera, but the field is not focused: scanning
	// comes first. /scan?manual (from the empty stock) starts with the field instead of the camera.
	const typeFirst = page.url.searchParams.has('manual');
	// The containers there are appear once the field is tapped
	let picking = $state(typeFirst);

	// A scanned code that was typed in by hand before: the typed container, and what was scanned
	type Twin = { id: number; label: string; content: string | null; history: number };
	let twin = $state<(Twin & { raw: string; source: CodeSource }) | null>(null);

	// Phones start the camera right away; on a computer it is only a button.
	onMount(() => {
		cameraOn = !typeFirst && window.matchMedia('(pointer: coarse)').matches;
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

	// The containers there are, offered below the field for typing – always two next to each
	// other, the ones used last first. Narrowed down by what is typed and by the two labels
	// (typed in by hand / scanned). So a container without a printed code is found again and
	// keeps its history.
	const SHOWN = 6;
	type Kind = 'typed' | 'scanned';
	const kindOf = (container: { manual: boolean }): Kind => (container.manual ? 'typed' : 'scanned');
	// Tapping a label shows only that kind; tapping it again shows all
	let only = $state<Kind | null>(null);
	let matching = $derived(matchContainers(data.containers, manual));
	let offered = $derived(only ? matching.filter((c) => kindOf(c) === only) : matching);
	// The labels are only there while both kinds exist
	let kinds = $derived(
		(['typed', 'scanned'] as const).filter((kind) =>
			data.containers.some((c) => kindOf(c) === kind)
		)
	);
	let showAll = $state(false);
	// What sending the typed text will do: open the container with exactly this code, or add a
	// new one. Read the way the server reads it (short codes in capitals; of a scanned and a
	// typed container with the same code, the scanned one). null: nothing to send yet.
	let typed = $derived.by(() => {
		const code = parseCode(manual)?.id;
		if (code === undefined) return null;
		const same = data.containers.filter((c) => c.code === code);
		return same.find((c) => !c.manual) ?? same.at(0) ?? ('new' as const);
	});
	let all = $derived(showAll || manual.trim() !== '');

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
						autofocus={typeFirst}
						onfocus={() => {
							// Typing instead of scanning: the camera makes room, so the field and the
							// containers below it stay above the keyboard of a phone
							picking = true;
							cameraOn = false;
						}}
						class="min-w-0 flex-1 font-mono"
					/>
					<!-- Says what will happen: open the container with this code, or create a new one -->
					<button class="min-w-28 btn-primary" disabled={!manual.trim() || busy}>
						{typed === 'new' ? m.scan.create : m.scan.open}
					</button>
				</div>
				<!-- min-h-8: two lines, so the containers below do not jump when the text changes -->
				<p class="min-h-8 text-xs text-muted">
					{typed === null
						? m.scan.manualHint
						: typed === 'new'
							? m.scan.createHint
							: m.scan.openHint(typed.content)}
				</p>
			</form>

			{#if picking && data.containers.length}
				<section>
					{#if kinds.length === 2}
						<div class="flex gap-2" role="group" aria-label={m.scan.kinds}>
							{#each kinds as kind (kind)}
								<button
									type="button"
									class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors {only ===
									kind
										? 'border-accent bg-accent font-semibold text-on-accent'
										: 'border-line bg-surface hover:border-accent'}"
									aria-pressed={only === kind}
									onclick={() => (only = only === kind ? null : kind)}
								>
									{kind === 'typed' ? m.scan.typedGroup : m.scan.scannedGroup}
									<span class={only === kind ? '' : 'text-muted'}>
										{matching.filter((c) => kindOf(c) === kind).length}
									</span>
								</button>
							{/each}
						</div>
					{/if}
					<ul class="mt-3 grid grid-cols-2 gap-2">
						{#each all ? offered : offered.slice(0, SHOWN) as container (container.id)}
							{@const inside =
								container.content ??
								(container.last ? m.scan.emptyLast(container.last) : m.scan.empty)}
							<li class="min-w-0">
								<a
									href={container.href}
									title="{codeLabel(container)} – {inside}"
									class="block rounded-lg border border-line bg-surface px-3 py-2 transition-colors hover:border-accent"
								>
									<!-- The code is what one looks for here: large and bold. What is in the
										     container is the quiet line below it. -->
									<span class="block truncate font-mono text-base leading-tight font-bold">
										{codeLabel(container)}
									</span>
									<span
										class="mt-0.5 block truncate text-[13px] text-muted {container.content
											? ''
											: 'italic'}"
									>
										{inside}
									</span>
								</a>
							</li>
						{/each}
					</ul>
					{#if !all && offered.length > SHOWN}
						<button type="button" class="mt-1 btn-quiet text-sm" onclick={() => (showAll = true)}>
							{m.scan.more(offered.length - SHOWN)}
						</button>
					{/if}
				</section>
			{/if}

			<label class="flex cursor-pointer items-center justify-center gap-2 btn-secondary">
				<ImageUp size={18} />
				{m.scan.photo}
				<input type="file" accept="image/*" class="sr-only" onchange={onPhoto} />
			</label>

			<a href="/scan/check" class="self-center btn-quiet">{m.scan.checkLink}</a>
		</div>
	{/if}
</main>
