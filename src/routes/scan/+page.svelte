<script lang="ts">
	import { onMount } from 'svelte';
	import CameraScanner from '$lib/components/CameraScanner.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { looksLikeUrl, readCode, type Code } from '$lib/scanner';
	import { Camera, Check, Copy, ImageUp, Trash2 } from '@lucide/svelte';

	type Source = 'camera' | 'photo' | 'manual';
	type Entry = Code & { id: number; source: Source };

	// Everything scanned since the page was opened, newest first. Nothing is saved.
	let entries = $state<Entry[]>([]);
	let nextId = 1;

	let cameraOn = $state(false);
	let manual = $state('');
	let photoMessage = $state('');
	let copied = $state<number | 'all' | null>(null);

	// Phones start the camera right away; on a computer it is only a button.
	onMount(() => {
		cameraOn = window.matchMedia('(pointer: coarse)').matches;
	});

	function add(code: Code, source: Source) {
		entries.unshift({ ...code, id: nextId++, source });
	}

	// The photo is read here in the browser and never uploaded.
	async function onPhoto(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = ''; // the same file can be chosen again
		if (!file) return;
		photoMessage = m.scan.photoReading;
		try {
			const picture = await createImageBitmap(file);
			const code = await readCode(picture);
			picture.close();
			if (code) add(code, 'photo');
			photoMessage = code ? '' : m.scan.photoNoCode;
		} catch (err) {
			console.error('Reading the photo failed', err);
			photoMessage = m.scan.photoFailed;
		}
	}

	function onManual(event: SubmitEvent) {
		event.preventDefault();
		const text = manual.trim();
		if (!text) return;
		add({ text, format: 'manual' }, 'manual');
		manual = '';
	}

	// Line breaks and other invisible characters, made visible: "a\nb"
	function escaped(text: string) {
		return JSON.stringify(text).slice(1, -1);
	}

	async function copy(text: string, what: number | 'all') {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// Without https there is no clipboard access: use a text field and the old command
			const field = document.createElement('textarea');
			field.value = text;
			field.style.position = 'fixed';
			field.style.opacity = '0';
			document.body.append(field);
			field.select();
			document.execCommand('copy');
			field.remove();
		}
		copied = what;
		setTimeout(() => {
			if (copied === what) copied = null;
		}, 1500);
	}

	function copyAll() {
		const lines = entries.map(
			(e) =>
				`${m.scan.formats[e.format as keyof typeof m.scan.formats] ?? e.format}\t${escaped(e.text)}`
		);
		copy(lines.join('\n'), 'all');
	}
</script>

<svelte:head><title>{m.scan.title} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-screen-lg px-4 py-6">
	<h1 class="text-xl font-bold">{m.scan.title}</h1>
	<p class="mt-1 text-sm text-muted">{m.scan.intro}</p>

	<div class="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
		<section class="flex flex-col gap-4">
			{#if cameraOn}
				<CameraScanner onscan={(code) => add(code, 'camera')} />
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

			<div>
				<label class="flex cursor-pointer items-center justify-center gap-2 btn-secondary">
					<ImageUp size={18} />
					{m.scan.photo}
					<input type="file" accept="image/*" class="sr-only" onchange={onPhoto} />
				</label>
				{#if photoMessage}
					<p class="mt-2 text-sm text-muted" role="status">{photoMessage}</p>
				{/if}
			</div>

			<form class="flex flex-col gap-1" onsubmit={onManual}>
				<label for="manual" class="text-sm font-medium">{m.scan.manual}</label>
				<div class="flex gap-2">
					<input
						id="manual"
						bind:value={manual}
						autocomplete="off"
						autocapitalize="off"
						spellcheck="false"
						class="min-w-0 flex-1 font-mono"
					/>
					<button class="btn-primary" disabled={!manual.trim()}>{m.scan.add}</button>
				</div>
			</form>
		</section>

		<section aria-live="polite">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="font-semibold">{m.scan.results(entries.length)}</h2>
				{#if entries.length}
					<div class="flex gap-1">
						<button type="button" class="flex items-center gap-1.5 btn-quiet" onclick={copyAll}>
							{#if copied === 'all'}<Check size={16} />{:else}<Copy size={16} />{/if}
							{m.scan.copyAll}
						</button>
						<button
							type="button"
							class="flex items-center gap-1.5 btn-quiet"
							onclick={() => (entries = [])}
						>
							<Trash2 size={16} />
							{m.scan.clear}
						</button>
					</div>
				{/if}
			</div>

			{#if entries.length === 0}
				<p class="mt-3 text-sm text-muted">{m.scan.empty}</p>
			{/if}

			<ul class="mt-3 flex flex-col gap-3">
				{#each entries as entry (entry.id)}
					<li class="rounded-xl border border-line bg-surface p-3">
						<p class="font-mono text-sm break-all whitespace-pre-wrap" data-testid="raw">
							{entry.text}
						</p>
						{#if escaped(entry.text) !== entry.text}
							<p class="mt-1 font-mono text-xs break-all text-muted">{escaped(entry.text)}</p>
						{/if}
						<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
							<span
								>{m.scan.formats[entry.format as keyof typeof m.scan.formats] ?? entry.format}</span
							>
							<span>{m.scan.sources[entry.source]}</span>
							<span>{m.scan.length(entry.text.length)}</span>
							{#if looksLikeUrl(entry.text)}<span>{m.scan.isUrl}</span>{/if}
							<button
								type="button"
								class="ml-auto flex items-center gap-1.5 btn-quiet"
								onclick={() => copy(entry.text, entry.id)}
							>
								{#if copied === entry.id}<Check size={14} />{:else}<Copy size={14} />{/if}
								{m.scan.copy}
							</button>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	</div>
</main>
