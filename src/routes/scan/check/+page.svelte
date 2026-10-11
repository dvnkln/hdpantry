<script lang="ts">
	import { onMount } from 'svelte';
	import CameraScanner from '$lib/components/CameraScanner.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { prepareReader, readText } from '$lib/reader/engine';
	import { addLines, surelyRead, type Seen } from '$lib/reader/tally';
	import {
		looksLikeUrl,
		READERS,
		readWith,
		type CameraInfo,
		type Code,
		type Reader
	} from '$lib/scanner';
	import { ArrowLeft, Camera, Check, Copy, ImageUp, Trash2 } from '@lucide/svelte';

	let { data } = $props();

	type Source = 'camera' | 'photo';
	type Entry = Code & { id: number; source: Source; readers: Reader[] };

	// Everything scanned since the page was opened, newest first. Nothing is saved.
	let entries = $state<Entry[]>([]);
	let nextId = 1;

	let cameraOn = $state(false);
	// What the camera of this device offers – told by the camera once it runs
	let camera = $state<CameraInfo | null>(null);
	let photoMessage = $state('');
	// How long the reader took to get ready (for the log)
	let readyMs = 0;
	let copied = $state<number | 'all' | null>(null);

	// Phones start the camera right away; on a computer it is only a button.
	onMount(() => {
		// Get the reader for printed text ready while the camera starts
		const asked = performance.now();
		prepareReader()
			.then(() => (readyMs = Math.round(performance.now() - asked)))
			.catch(() => {});
		if (window.matchMedia('(pointer: coarse)').matches) startCamera();
	});

	// ---- Printed text (e.g. the short code below a QR code) ----
	// Read next to the codes: from every photo, and from the camera every now and then – it
	// takes longer than reading a code, and one reading at a time is enough.
	const TEXT_EVERY_MS = 1500;
	// Read the way the scan page will: for the short code of a container
	const PRINTED_CODE = '^[A-Z0-9]{4}$';
	// What was read stays: every line with its best reading and how often it came, and the
	// times added up – so the result is still there when one comes back from the freezer.
	type TextState = {
		seen: Seen[];
		runs: number;
		threads: number;
		error: string;
		// Every reading on its own, for the log: finding ms, reading ms, lines found
		each: [number, number, number][];
		// How long getting ready took when this page asked for it
		readyMs: number;
		ms: { loading: number; finding: number; reading: number };
		busy: boolean;
		failed: boolean;
	};
	const noText = (): TextState => ({
		seen: [],
		runs: 0,
		threads: 0,
		error: '',
		each: [],
		readyMs: 0,
		ms: { loading: 0, finding: 0, reading: 0 },
		busy: false,
		failed: false
	});
	let text = $state(noText());
	let lastText = 0;
	// Tells readings of an earlier attempt apart, which may still arrive after a new start
	let attempt = 0;

	async function readPrinted(picture: ImageBitmap, square = false) {
		if (text.busy) return;
		const mine = attempt;
		text.busy = true;
		lastText = Date.now();
		try {
			// From the camera only what the page shows of the frame: its middle square
			const reading = await readText(picture, { square, code: PRINTED_CODE });
			if (mine !== attempt) return;
			text.seen = addLines(text.seen, reading.lines);
			text.runs++;
			text.threads = reading.threads;
			text.each.push([reading.ms.finding, reading.ms.reading, reading.lines.length]);
			text.readyMs = readyMs;
			// Getting ready happens once; finding and reading are shown on average
			text.ms.loading = Math.max(text.ms.loading, reading.ms.loading);
			text.ms.finding += reading.ms.finding;
			text.ms.reading += reading.ms.reading;
			text.failed = false;
		} catch (err) {
			console.error('Reading the text failed', err);
			if (mine === attempt) {
				text.failed = true;
				text.error = err instanceof Error ? err.message : String(err);
			}
		} finally {
			if (mine === attempt) text.busy = false;
		}
	}

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

	// Development only (see +page.server.ts): what came out of an attempt goes to the log of the
	// server – the numbers and what the reader saw as text, never the content of a code.
	function report(source: Source, why: string) {
		if (!data.diagnostics) return;
		const body = new FormData();
		body.set(
			'summary',
			JSON.stringify({
				source,
				why,
				isolated: window.crossOriginIsolated,
				cores: navigator.hardwareConcurrency,
				camera,
				readers: stats,
				text: {
					runs: text.runs,
					threads: text.threads,
					busy: text.busy,
					failed: text.failed,
					error: text.error,
					ms: text.ms,
					readyMs: text.readyMs,
					each: text.each,
					seen: text.seen.slice(0, 8)
				},
				agent: navigator.userAgent
			})
		);
		send(JSON.parse(String(body.get('summary'))));
	}

	function send(summary: unknown) {
		const body = new FormData();
		body.set('summary', JSON.stringify(summary));
		fetch('?/log', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } }).catch(
			() => {}
		);
	}

	// The camera stops by itself, and says why:
	// - 'code': every reader this browser has found the code – or one did and the other still
	//   has nothing a few seconds later. A reading of the text that is under way may finish.
	// - 'text': a line of text was read sure more than once (see tally.ts)
	// - 'time': neither happened for a while
	const GRACE_MS = 5000;
	const TEXT_GRACE_MS = 3000;
	const GIVE_UP_MS = 20_000;
	type Why = 'code' | 'text' | 'time';
	let firstHitAt = 0;
	let settledAt = 0;
	let startedAt = 0;
	let finished = $state<Why | null>(null);

	function settled() {
		const there = READERS.filter((reader) => !stats[reader].missing);
		const found = there.filter((reader) => stats[reader].hits > 0);
		if (found.length === 0) return false;
		firstHitAt ||= Date.now();
		return found.length === there.length || Date.now() - firstHitAt > GRACE_MS;
	}

	function whyStop(): Why | null {
		if (settled()) {
			settledAt ||= Date.now();
			// In the test container the text gets a few readings even after the code was found,
			// so its speed can be measured with any container at the desk
			if (data.diagnostics) {
				return text.runs >= 4 || Date.now() - settledAt > 15_000 ? 'code' : null;
			}
			return !text.busy || Date.now() - settledAt > TEXT_GRACE_MS ? 'code' : null;
		}
		if (surelyRead(text.seen) && (!data.diagnostics || text.runs >= 4)) return 'text';
		return Date.now() - startedAt > GIVE_UP_MS ? 'time' : null;
	}

	// A frame of the camera: frozen first, so both readers see exactly the same picture
	async function readFrame(video: HTMLVideoElement) {
		const picture = await createImageBitmap(video);
		try {
			// Not awaited: the codes are read on while the text takes its time
			if (!text.busy && Date.now() - lastText > TEXT_EVERY_MS) void readPrinted(picture, true);
			const code = await compare(picture, 'camera');
			const why = whyStop();
			if (why) {
				finished = why;
				cameraOn = false;
				report('camera', why);
			}
			return code;
		} finally {
			picture.close();
		}
	}

	function reset() {
		attempt++;
		stats = fresh();
		text = noText();
		lastListed = '';
		lastText = 0;
		firstHitAt = 0;
		settledAt = 0;
		startedAt = Date.now();
		finished = null;
	}

	// A new attempt with the camera counts from zero; the codes read so far stay listed
	function startCamera() {
		reset();
		cameraOn = true;
	}

	function clear() {
		entries = [];
		reset();
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
			// One photo, one result
			if (!cameraOn) reset();
			const code = await compare(picture, 'photo');
			await readPrinted(picture);
			picture.close();
			report('photo', code ? 'code' : 'no code');
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
	{#if data.diagnostics}
		<!-- Only in the test container built from source -->
		<p class="mt-1 text-sm text-caution">{m.scanCheck.diagnostics}</p>
	{/if}

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
					<p class="-mt-2 text-sm text-muted" role="status" data-testid="finished">
						{m.scanCheck.finished[finished]}
					</p>
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

			<!-- Printed text in the picture -->
			<div class="mt-3 rounded-xl border border-line bg-surface p-3" data-testid="text">
				<h3 class="text-sm font-semibold">{m.scanCheck.text}</h3>
				<p class="mt-0.5 text-xs text-muted">{m.scanCheck.textHint}</p>
				{#if text.failed}
					<p class="mt-2 text-sm text-danger">{m.scanCheck.textFailed}</p>
				{:else if text.runs === 0}
					<p class="mt-2 text-sm text-muted">
						{text.busy ? m.scanCheck.textLoading : m.scanCheck.noPictures}
					</p>
				{:else}
					{#if text.seen.length === 0}
						<p class="mt-2 text-sm text-muted">{m.scanCheck.textNone}</p>
					{/if}
					<!-- The surest lines; what is read sure more than once counts as read -->
					<ul class="mt-2 flex flex-col gap-1 text-sm">
						{#each text.seen.slice(0, 8) as line (line.text)}
							<li class="flex items-baseline justify-between gap-3">
								<span class="font-mono break-all {line.sure >= 2 ? 'font-bold' : ''}"
									>{line.text}</span
								>
								<span class="shrink-0 text-xs text-muted"
									>{m.scanCheck.textSure(Math.round(line.best * 100), line.times)}</span
								>
							</li>
						{/each}
					</ul>
					<p class="mt-2 text-xs text-muted">
						{m.scanCheck.textThreads(text.threads)} ·
						{m.scanCheck.textTimes(
							text.ms.loading,
							Math.round(text.ms.finding / text.runs),
							Math.round(text.ms.reading / text.runs),
							text.runs
						)}
					</p>
				{/if}
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
