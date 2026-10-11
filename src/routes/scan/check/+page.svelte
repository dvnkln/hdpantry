<script lang="ts">
	import { onMount } from 'svelte';
	import CameraScanner from '$lib/components/CameraScanner.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import {
		looksLikeUrl,
		READERS,
		readWith,
		type CameraInfo,
		type Code,
		type Reader
	} from '$lib/scanner';
	import { ArrowLeft, Camera, Check, Copy, ImageUp, Trash2 } from '@lucide/svelte';

	type Source = 'camera' | 'photo';
	type Entry = Code & { id: number; source: Source; readers: Reader[] };

	// Everything scanned since the page was opened, newest first. Nothing is saved.
	let entries = $state<Entry[]>([]);
	let nextId = 1;

	let cameraOn = $state(false);
	// What the camera of this device offers – told by the camera once it runs
	let camera = $state<CameraInfo | null>(null);
	let photoMessage = $state('');
	let copied = $state<number | 'all' | null>(null);

	// Phones start the camera right away; on a computer it is only a button.
	onMount(() => {
		cameraOn = window.matchMedia('(pointer: coarse)').matches;
	});

	// Both readers get every picture, so one sees which of them finds more on this device
	type Stats = { tried: number; hits: number; ms: number; first: number | null; missing: boolean };
	const fresh = (): Record<Reader, Stats> => ({
		native: { tried: 0, hits: 0, ms: 0, first: null, missing: false },
		bundled: { tried: 0, hits: 0, ms: 0, first: null, missing: false }
	});
	let stats = $state(fresh());
	// The same code stays in the camera picture: list it once, not with every frame
	let lastListed = '';

	// Reads one picture with both readers and lists what they found. Returns the code, if any.
	async function compare(picture: ImageBitmap, source: Source) {
		let code: Code | null = null;
		const by: Reader[] = [];
		for (const reader of READERS) {
			const result = await readWith(reader, picture).catch(() => 'unavailable' as const);
			const stat = stats[reader];
			if (result === 'unavailable') {
				stat.missing = true;
				continue;
			}
			stat.tried++;
			stat.ms += result.ms;
			if (!result.code) continue;
			stat.hits++;
			stat.first ??= stat.tried;
			by.push(reader);
			code ??= result.code;
		}
		if (code && (source === 'photo' || code.text !== lastListed)) {
			entries.unshift({ ...code, id: nextId++, source, readers: by });
			lastListed = source === 'camera' ? code.text : lastListed;
		}
		return code;
	}

	// The camera stops by itself once the comparison is settled: every reader this browser has
	// found the code – or one did and the other still has nothing a few seconds later.
	const GRACE_MS = 5000;
	let firstHitAt = 0;
	let finished = $state(false);

	function settled() {
		const there = READERS.filter((reader) => !stats[reader].missing);
		const found = there.filter((reader) => stats[reader].hits > 0);
		if (found.length === 0) return false;
		firstHitAt ||= Date.now();
		return found.length === there.length || Date.now() - firstHitAt > GRACE_MS;
	}

	// A frame of the camera: frozen first, so both readers see exactly the same picture
	async function readFrame(video: HTMLVideoElement) {
		const picture = await createImageBitmap(video);
		try {
			const code = await compare(picture, 'camera');
			if (settled()) {
				finished = true;
				cameraOn = false;
			}
			return code;
		} finally {
			picture.close();
		}
	}

	// A new attempt with the camera counts from zero; the codes read so far stay listed
	function startCamera() {
		stats = fresh();
		lastListed = '';
		firstHitAt = 0;
		finished = false;
		cameraOn = true;
	}

	function clear() {
		entries = [];
		stats = fresh();
		lastListed = '';
		firstHitAt = 0;
		finished = false;
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
			const code = await compare(picture, 'photo');
			picture.close();
			photoMessage = code ? '' : m.scan.photoNoCode;
		} catch (err) {
			console.error('Reading the photo failed', err);
			photoMessage = m.scan.photoFailed;
		}
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
				`${m.scanCheck.formats[e.format as keyof typeof m.scanCheck.formats] ?? e.format}\t${escaped(e.text)}`
		);
		copy(lines.join('\n'), 'all');
	}
</script>

<svelte:head><title>{m.scanCheck.title} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-screen-lg px-4 py-6">
	<a href="/scan" class="-ml-2 inline-flex items-center gap-1.5 btn-quiet">
		<ArrowLeft size={16} />
		{m.scan.title}
	</a>
	<h1 class="mt-2 text-xl font-bold">{m.scanCheck.title}</h1>
	<p class="mt-1 text-sm text-muted">{m.scanCheck.intro}</p>

	<div class="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
		<section class="flex flex-col gap-4">
			{#if cameraOn}
				<!-- Listing happens in readFrame(); onscan only gives the vibration -->
				<CameraScanner onscan={() => {}} read={readFrame} oncamera={(info) => (camera = info)} />
			{:else}
				<button
					type="button"
					class="flex items-center justify-center gap-2 btn-secondary"
					onclick={startCamera}
				>
					<Camera size={18} />
					{finished ? m.scanCheck.again : m.scan.startCamera}
				</button>
				{#if finished}
					<p class="-mt-2 text-sm text-muted" role="status">{m.scanCheck.finished}</p>
				{/if}
			{/if}
			{#if camera}
				<p class="-mt-2 text-xs text-muted" data-testid="camera">
					{m.scanCheck.camera(camera.width, camera.height, camera.light, camera.tapFocus)}
					{#if camera.focusModes.length}<span class="block"
							>{m.scanCheck.focusModes(camera.focusModes.join(', '))}</span
						>{/if}
				</p>
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
		</section>

		<section aria-live="polite">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="font-semibold">{m.scanCheck.results(entries.length)}</h2>
				{#if entries.length}
					<div class="flex gap-1">
						<button type="button" class="flex items-center gap-1.5 btn-quiet" onclick={copyAll}>
							{#if copied === 'all'}<Check size={16} />{:else}<Copy size={16} />{/if}
							{m.scanCheck.copyAll}
						</button>
						<button type="button" class="flex items-center gap-1.5 btn-quiet" onclick={clear}>
							<Trash2 size={16} />
							{m.scanCheck.clear}
						</button>
					</div>
				{/if}
			</div>

			{#if entries.length === 0}
				<p class="mt-3 text-sm text-muted">{m.scanCheck.empty}</p>
			{/if}

			<!-- The two readers side by side -->
			<div class="mt-3 rounded-xl border border-line bg-surface p-3" data-testid="compare">
				<h3 class="text-sm font-semibold">{m.scanCheck.compare}</h3>
				<p class="mt-0.5 text-xs text-muted">{m.scanCheck.compareHint}</p>
				<dl class="mt-2 flex flex-col gap-1.5 text-sm">
					{#each READERS as reader (reader)}
						{@const stat = stats[reader]}
						<div class="flex flex-wrap items-baseline gap-x-2">
							<dt class="font-medium">{m.scanCheck.readers[reader]}</dt>
							<dd class="text-muted">
								{#if stat.missing}
									{m.scanCheck.unavailable}
								{:else if stat.tried === 0}
									{m.scanCheck.noPictures}
								{:else}
									{m.scanCheck.stats(stat.hits, stat.tried, Math.round(stat.ms / stat.tried))}
									{#if stat.first}<span class="block">{m.scanCheck.firstHit(stat.first)}</span>{/if}
								{/if}
							</dd>
						</div>
					{/each}
				</dl>
			</div>

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
								>{m.scanCheck.formats[entry.format as keyof typeof m.scanCheck.formats] ??
									entry.format}</span
							>
							<span>{m.scanCheck.sources[entry.source]}</span>
							<span
								>{m.scanCheck.foundBy(
									entry.readers.map((r) => m.scanCheck.readers[r]).join(', ')
								)}</span
							>
							<span>{m.scanCheck.length(entry.text.length)}</span>
							{#if looksLikeUrl(entry.text)}<span>{m.scanCheck.isUrl}</span>{/if}
							<button
								type="button"
								class="ml-auto flex items-center gap-1.5 btn-quiet"
								onclick={() => copy(entry.text, entry.id)}
							>
								{#if copied === entry.id}<Check size={14} />{:else}<Copy size={14} />{/if}
								{m.scanCheck.copy}
							</button>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	</div>
</main>
