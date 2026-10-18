<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { page } from '$app/state';
	import CameraScanner from '$lib/components/CameraScanner.svelte';
	import { isPrintedCode, PRINTED_CODES } from '$lib/codes';
	import { codeLabel, type CodeSource } from '$lib/containers';
	import FillGauge from '$lib/components/FillGauge.svelte';
	import PackCount from '$lib/components/PackCount.svelte';
	import { matchTiles, typedAction, type NewFromTyped, type Tile } from '$lib/picks';
	import { goto } from '$app/navigation';
	import { m } from '$lib/i18n/index.svelte';
	import { prepareReader, readText } from '$lib/reader/engine';
	import { searchedPart } from '$lib/reader/geometry';
	import { addLines, SURE, surelyRead, type Seen } from '$lib/reader/tally';
	import { readCode } from '$lib/scanner';
	import { Camera, ImageUp, Plus, X } from '@lucide/svelte';

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

	// Once a code is on its way to the server, nothing else on this page may act any more – a
	// reading of the short code that is still under way must not send a second one after the
	// page has moved on (that led to an error page).
	let taken = false;
	let gone = false;
	onDestroy(() => (gone = true));

	// Hands the code to the server, which leads on to the container – no question in between.
	async function found(raw: string, source: CodeSource) {
		if (busy || twin || taken || gone) return;
		busy = true;
		taken = true;
		message = '';
		if (source !== 'printed') report('code', source);
		try {
			const body = new FormData();
			body.set('raw', raw);
			body.set('source', source);
			if (data.attach) body.set('attach', String(data.attach.id));
			// The full address: this page may be on its way out when the answer is asked for
			const response = await fetch('/scan?/found', {
				method: 'POST',
				body,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await response.text());
			if (result.type === 'success' && result.data?.twin) {
				twin = { ...(result.data.twin as Twin), raw, source };
			} else if (result.type === 'failure') {
				message = String(result.data?.error ?? m.scan.failed);
				taken = false; // not a usable code: scanning goes on
			} else await applyAction(result); // redirect to the container
		} catch {
			message = m.scan.failed;
			taken = false;
		} finally {
			busy = false;
		}
	}

	// ---- The printed short code, when the code itself cannot be scanned ----
	// A bag that clings to its frozen content dents the code beyond reading – but the short code
	// printed below it stays legible. So next to the code reader, the
	// picture is also read as text (src/lib/reader/, all in the browser). Only a line that has
	// the form of a short code and was read for sure counts, and only when read twice. It then
	// works exactly like the scanned code (decided by the user: whoever scans does not care how
	// the app got there): a known container opens, a new one is added and asks for its content.
	// The short code is looked for once the code reader has found nothing for a moment
	// (TEXT_AFTER_MS), next to it. What it finds is used at once if the app knows the container (scanning its code would open the very
	// same one). A container the app has never seen is different: its scanned code says more than
	// the short code (size, kind), so the code reader gets this long first.
	const NEW_AFTER_MS = 1500;
	// … and only starts looking after this long without a code: most codes are read within that
	// time, and searching for text meanwhile takes processor time from the code reader (measured
	// on the phone: barcodes of packs took 2.4 to 3.4 seconds while it ran along)
	const TEXT_AFTER_MS = 1500;
	// A short code read for sure and waiting for that
	let pending = '';
	// Searching a picture keeps several processor cores busy. Whoever is scanning needs that for
	// a few seconds; a phone left lying on the scan page must not go on like that. So: searching
	// without a pause at first, then only now and then, and after a while not at all – the code
	// reader (cheap) goes on, and so does everything else on the page.
	const EAGER_MS = 8_000;
	const SLOW_EVERY_MS = 2_000;
	const GIVE_UP_MS = 45_000;
	let lastSearch = 0;
	const FORGET_MS = 3000;
	let seen = $state<Seen[]>([]);
	let seenAt = 0;
	let readingText = false;
	// The reader could not be started on this device: scanning goes on without it
	let noReader = false;
	// For the log of the test container
	let cameraAt = 0;
	// Each reading: when it began (ms after the camera ran), how long it took in all, finding,
	// reading, the finding model alone, turning its answer into lines, lines found, runs of the
	// reading model, and whether it gave a short code
	const readings: number[][] = [];
	// … and the short codes each reading gave (never the content of a scanned code)
	const texts: string[] = [];
	// When the reader was ready, in ms after the camera ran (negative: it was ready before)
	let readyAt: number | null = null;

	// The reader is fetched in the background anyway; make it ready as soon as the camera runs
	$effect(() => {
		if (cameraOn) {
			prepareReader()
				.then(() => {
					readerReady = true;
					readyAt ??= Math.round(performance.now() - (cameraAt || performance.now()));
				})
				.catch(() => (noReader = true));
		}
	});

	// Nothing is read before the reader is ready: a frame taken while it was still loading
	// would be seconds old when it is finally read, and the second look would miss
	let readerReady = false;
	let quietFor = 0;

	// A short code no container has yet. Any four capital letters or digits look like one – a
	// word on a package, a year – so a new container is never added from a reading alone: the
	// app shows what it saw next to what it read and asks. (A known container needs no question:
	// the reading has to match its code exactly.)
	let asking = $state<{ code: string; picture: string; from: 'camera' | 'photo' } | null>(null);
	// What was answered with "no" is not asked again on this visit
	const declined = new Set<string>();
	// The piece of the picture the pending short code was read from
	let glimpse = '';

	function settle() {
		if (!pending || taken || gone) return;
		const known = scannedCodes.has(pending);
		if (known) return void takePrinted(pending, 'camera');
		if (quietFor < NEW_AFTER_MS) return;
		ask(pending, glimpse, 'camera');
		pending = '';
	}

	function ask(code: string, picture: string, from: 'camera' | 'photo') {
		if (declined.has(code)) return;
		report('asked', from);
		if (page.data.scanVibration !== false) navigator.vibrate?.(60);
		asking = { code, picture, from };
	}

	function answer(yes: boolean) {
		const asked = asking;
		asking = null;
		if (!asked) return;
		if (yes) return void takePrinted(asked.code, asked.from);
		declined.add(asked.code);
		seen = [];
	}

	// Cuts the line a short code was read from out of the picture, to show it next to the
	// reading. `offset`: where the searched part lies in the picture (a camera frame is only
	// searched in its middle).
	function cutOut(
		source: CanvasImageSource,
		box: { x: number; y: number; width: number; height: number },
		offset = { x: 0, y: 0 }
	) {
		try {
			// Generous: the hand has moved a little since the line was found
			const width = box.width * 1.6;
			const height = box.height * 2;
			const canvas = document.createElement('canvas');
			canvas.width = 240;
			canvas.height = Math.round((240 * height) / width);
			canvas
				.getContext('2d')
				?.drawImage(
					source,
					offset.x + box.x - width / 2,
					offset.y + box.y - height / 2,
					width,
					height,
					0,
					0,
					canvas.width,
					canvas.height
				);
			return canvas.toDataURL('image/jpeg', 0.8);
		} catch {
			return '';
		}
	}

	async function onQuiet(video: HTMLVideoElement, quietMs: number) {
		quietFor = quietMs;
		if (pending) return settle();
		if (!readerReady || readingText || noReader || busy || twin || taken || asking) return;
		// Giving a product its barcode: a printed short code belongs to a container, not here
		if (data.attach) return;
		// `quietMs`: for how long the camera has found no code – that is how long this has run
		if (quietMs < TEXT_AFTER_MS || quietMs > GIVE_UP_MS) return;
		if (quietMs > EAGER_MS && Date.now() - lastSearch < SLOW_EVERY_MS) return;
		lastSearch = Date.now();
		readingText = true;
		try {
			const began = performance.now();
			const reading = await readText(video, { square: true, code: PRINTED_CODES });
			// Meanwhile the code itself was scanned, or the page was left: this reading is void
			if (taken || gone || !cameraOn) return;
			const isCode = (line: { text: string; confidence: number }) =>
				line.confidence >= SURE && isPrintedCode(line.text);
			let codes = reading.lines.filter(isCode);
			readings.push([
				Math.round(began - cameraAt),
				Math.round(performance.now() - began),
				reading.ms.finding,
				reading.ms.reading,
				reading.detail.model,
				reading.detail.boxes,
				reading.detail.found,
				reading.detail.runs,
				codes.length,
				reading.detail.draw
			]);
			texts.push(codes.map((line) => line.text).join('|'));
			// A short code read for the first time: look again right away, at the same place in
			// a fresh frame. That takes a fraction of a full search and settles it – if the hand
			// moved, the next full search does.
			if (codes.length && !seen.some((entry) => entry.text === codes[0].text)) {
				seen = addLines(seen, codes);
				seenAt = Date.now();
				const beganAgain = performance.now();
				const again = await readText(video, {
					square: true,
					code: PRINTED_CODES,
					at: codes[0].box,
					atTurned: codes[0].turned
				});
				if (taken || gone || !cameraOn) return;
				codes = again.lines.filter(isCode);
				readings.push([
					Math.round(beganAgain - cameraAt),
					Math.round(performance.now() - beganAgain),
					again.ms.finding,
					again.ms.reading,
					again.detail.model,
					again.detail.boxes,
					again.detail.found,
					again.detail.runs,
					codes.length,
					again.detail.draw
				]);
				texts.push(codes.map((line) => line.text).join('|'));
			}
			// Two readings count together only if they follow each other closely
			if (codes.length) seenAt = Date.now();
			else if (Date.now() - seenAt > FORGET_MS) seen = [];
			seen = addLines(seen, codes);
			const sure = surelyRead(seen, isPrintedCode);
			if (sure && !declined.has(sure.text)) {
				const line = codes.find((entry) => entry.text === sure.text);
				if (line)
					glimpse = cutOut(
						video,
						line.box,
						searchedPart({ width: video.videoWidth, height: video.videoHeight })
					);
				pending = sure.text;
				settle();
			}
		} catch (err) {
			console.error('Reading the short code failed', err);
			noReader = true;
		} finally {
			readingText = false;
		}
	}

	function takePrinted(code: string, from: 'camera' | 'photo') {
		report('printed', from);
		seen = [];
		pending = '';
		if (page.data.scanVibration !== false) navigator.vibrate?.(200);
		return found(code, 'printed');
	}

	// Test container only (see $lib/server/diagnostics): how the attempt went
	function report(outcome: string, source: string) {
		if (!data.diagnostics) return;
		const body = new FormData();
		body.set(
			'summary',
			JSON.stringify({
				source: 'scan',
				outcome,
				from: source,
				ms: cameraAt ? Math.round(performance.now() - cameraAt) : null,
				readyAt,
				readings,
				texts,
				seen,
				isolated: window.crossOriginIsolated
			})
		);
		fetch('/scan/check?/log', {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		}).catch(() => {});
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
			if (code) {
				picture.close();
				message = '';
				await found(code.text, 'photo');
				return;
			}
			// No code in the photo: maybe the printed short code can be read
			const printed = await readText(picture, { code: PRINTED_CODES })
				.then((reading) =>
					reading.lines.find((line) => line.confidence >= SURE && isPrintedCode(line.text))
				)
				.catch(() => undefined);
			const known = printed && scannedCodes.has(printed.text);
			const cut = printed && !known ? cutOut(picture, printed.box) : '';
			picture.close();
			message = printed ? '' : m.scan.photoNoCode;
			if (printed && known) await takePrinted(printed.text, 'photo');
			else if (printed) ask(printed.text, cut, 'photo');
		} catch (err) {
			console.error('Reading the photo failed', err);
			message = m.scan.photoFailed;
		}
	}

	// Products and containers there are, offered below the field – always two next to each other,
	// the ones used last first, narrowed down by what is typed and by the two labels. A tap works
	// like a scan: so what has no code (bread, a jar without a label) is found again and keeps
	// its history.
	const SHOWN = 6;
	type Kind = Tile['kind'];
	// The short codes of scanned containers: a short code read from the picture opens one of
	// these without a question
	let scannedCodes = $derived(
		new Set(data.tiles.flatMap((t) => (t.kind === 'container' && !t.manual ? [t.code] : [])))
	);
	// Tapping a label shows only that kind; tapping it again shows all
	let only = $state<Kind | null>(null);
	let matching = $derived(matchTiles(data.tiles, manual));
	let offered = $derived(only ? matching.filter((t) => t.kind === only) : matching);
	// The labels are only there while both kinds exist
	let kinds = $derived(
		(['product', 'container'] as const).filter((kind) => data.tiles.some((t) => t.kind === kind))
	);
	let showAll = $state(false);
	let all = $derived(showAll || manual.trim() !== '');
	// What the field does with what is typed (see typedAction): open exactly that one, or offer
	// to add it – as a product of that name, a product with that barcode, a container with that
	// short code
	let action = $derived(typedAction(data.tiles, manual));
	// Where a tile leads: a product to a new pack, a container like a scan would
	const hrefOf = (tile: Tile) =>
		tile.kind === 'product'
			? `/products/${tile.id}/add`
			: tile.content === null
				? `/containers/${tile.id}/add`
				: `/containers/${tile.id}`;

	function add(kind: NewFromTyped) {
		const text = manual.trim().replace(/\s+/g, ' ');
		// A product by its name has no code: straight to its form. Codes go to the server, which
		// knows what they belong to (as if scanned).
		if (kind === 'name') goto(`/products/new?name=${encodeURIComponent(text)}`);
		else found(text, 'manual');
	}

	function onManual(event: SubmitEvent) {
		event.preventDefault();
		if (data.attach) {
			if (manual.trim()) found(manual, 'manual');
			return;
		}
		// Enter: what is meant, else the likelier of what could be added
		if (action?.open) goto(hrefOf(action.open));
		else if (action?.create) add(action.create[0]);
	}
</script>

<!-- "New container?" – what the camera saw, what was read from it, yes or no -->
{#snippet newContainer()}
	{#if asking}
		<div
			class="rounded-xl border border-accent bg-surface px-3 py-2 shadow-lg"
			role="alertdialog"
			aria-label={m.scan.printedNew}
		>
			<p class="text-xs text-muted">{m.scan.printedNew}</p>
			<div class="mt-1 flex items-center gap-3">
				{#if asking.picture}
					<img
						src={asking.picture}
						alt=""
						class="h-10 w-auto max-w-24 shrink-0 rounded-md border border-line object-cover"
					/>
				{/if}
				<p class="min-w-0 flex-1 truncate font-mono text-xl leading-tight font-bold">
					{asking.code}
				</p>
				<button
					type="button"
					class="shrink-0 btn-primary px-3 py-2 text-sm"
					onclick={() => answer(true)}
				>
					{m.scan.create}
				</button>
				<button
					type="button"
					class="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-text"
					aria-label={m.common.no}
					title={m.common.no}
					onclick={() => answer(false)}
				>
					<X size={20} />
				</button>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet startCamera()}
	<button
		type="button"
		class="flex items-center justify-center gap-2 btn-secondary"
		onclick={() => (cameraOn = true)}
	>
		<Camera size={18} />
		{m.scan.startCamera}
	</button>
{/snippet}

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
			<button
				type="button"
				class="self-center btn-quiet"
				onclick={() => {
					twin = null;
					taken = false;
				}}
			>
				{m.common.cancel}
			</button>
		</form>
	{:else}
		<h1 class="text-xl font-bold">
			{data.attach ? m.products.attachTitle : typeFirst ? m.scan.typeTitle : m.scan.title}
		</h1>
		<p class="mt-1 text-sm text-muted">
			{data.attach
				? m.products.attachIntro(data.attach.name)
				: typeFirst
					? m.scan.typeIntro
					: m.scan.intro}
		</p>

		<div class="mt-6 flex flex-col gap-4">
			{#if cameraOn}
				<CameraScanner
					onscan={(code) => found(code.text, 'camera')}
					idleHint={m.scan.stuckShort}
					onquiet={onQuiet}
					oncamera={() => (cameraAt = performance.now())}
					holdHint={seen.length > 0}
					question={asking ? newContainer : undefined}
				/>
			{:else if !typeFirst}
				{@render startCamera()}
			{/if}

			{#if asking && !cameraOn}
				<!-- Asked after a photo: there is no camera picture to show it in -->
				{@render newContainer()}
			{/if}

			{#if message}
				<p class="text-sm text-muted" role="status">{message}</p>
			{/if}

			<form class="flex flex-col gap-1" onsubmit={onManual}>
				<label for="manual" class="text-sm font-medium">
					{data.attach ? m.products.barcode : m.scan.manual}
				</label>
				<div class="flex gap-2">
					<!-- svelte-ignore a11y_autofocus -->
					<input
						id="manual"
						bind:value={manual}
						autocomplete="off"
						spellcheck="false"
						enterkeyhint="go"
						inputmode={data.attach ? 'numeric' : undefined}
						autofocus={typeFirst}
						onfocus={() => {
							// Typing instead of scanning: the camera makes room, so the field and the
							// list below it stay above the keyboard of a phone
							picking = true;
							cameraOn = false;
						}}
						class="min-w-0 flex-1"
					/>
					{#if data.attach}
						<button class="min-w-28 btn-primary" disabled={!manual.trim() || busy}>
							{m.products.attach}
						</button>
					{:else if action?.open}
						<!-- Exactly this one is meant: open it -->
						<button class="min-w-28 btn-primary" disabled={busy}>{m.scan.open}</button>
					{/if}
				</div>
				{#if action?.create && !data.attach}
					<!-- Nothing fits exactly: what could be added, the likelier first (Enter takes it) -->
					<div class="mt-1 flex flex-col gap-1.5">
						{#each action.create as kind (kind)}
							<button
								type="button"
								class="flex items-center gap-2 rounded-lg border border-dashed border-accent bg-surface px-3 py-2.5 text-left font-medium transition-colors hover:bg-accent/10 disabled:opacity-50"
								disabled={busy}
								onclick={() => add(kind)}
							>
								<Plus size={18} class="shrink-0 text-accent" />
								<span class="min-w-0 truncate">
									{kind === 'name'
										? m.scan.addProduct(manual.trim().replace(/\s+/g, ' '))
										: kind === 'barcode'
											? m.scan.addBarcode
											: m.scan.addContainer(manual.trim().toUpperCase())}
								</span>
							</button>
						{/each}
					</div>
				{:else}
					<!-- min-h-8: two lines, so the list below does not jump when the text changes -->
					<p class="min-h-8 text-xs text-muted">
						{#if action?.open?.kind === 'product'}
							{m.scan.productOpenHint(action.open.name)}
						{:else if action?.open?.kind === 'container'}
							{m.scan.openHint(action.open.content)}
						{:else}
							{data.attach ? m.scan.attachHint : m.scan.manualHint}
						{/if}
					</p>
				{/if}
			</form>

			{#if picking && data.tiles.length && !data.attach}
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
									{kind === 'product' ? m.scan.productsGroup : m.scan.containersGroup}
									<span class={only === kind ? '' : 'text-muted'}>
										{matching.filter((t) => t.kind === kind).length}
									</span>
								</button>
							{/each}
						</div>
					{/if}
					<ul class="mt-3 grid grid-cols-2 gap-2">
						{#each all ? offered : offered.slice(0, SHOWN) as tile (tile.kind + tile.id)}
							{@const title = tile.kind === 'product' ? tile.name : codeLabel(tile)}
							{@const below =
								tile.kind === 'product'
									? m.scan.inStock(tile.packs)
									: (tile.content ?? (tile.last ? m.scan.emptyLast(tile.last) : m.scan.empty))}
							<li class="min-w-0">
								<a
									href={hrefOf(tile)}
									title="{title} – {below}"
									class="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-2 transition-colors hover:border-accent"
								>
									<!-- The same symbols as in the list: the pack of a product with its number,
									     the bag or jar of a container with its fill level -->
									{#if tile.kind === 'product'}
										<PackCount count={tile.packs} shape={tile.shape} size={30} />
									{:else}
										<FillGauge level={tile.fill} source={tile.source} size={30} />
									{/if}
									<span class="min-w-0">
										<span
											class="block truncate leading-tight font-bold {tile.kind === 'container'
												? 'font-mono'
												: ''}"
										>
											{title}
										</span>
										<span
											class="mt-0.5 block truncate text-[13px] text-muted {tile.kind ===
												'container' && !tile.content
												? 'italic'
												: ''}"
										>
											{below}
										</span>
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

			{#if typeFirst && !cameraOn}
				<!-- Typing came first: the camera is one way among others, below the list -->
				{@render startCamera()}
			{/if}
			<label class="flex cursor-pointer items-center justify-center gap-2 btn-secondary">
				<ImageUp size={18} />
				{m.scan.photo}
				<input type="file" accept="image/*" class="sr-only" onchange={onPhoto} />
			</label>

			{#if data.attach}
				<a href="/products/{data.attach.id}" class="self-center btn-quiet">{m.common.cancel}</a>
			{:else}
				<a href="/scan/check" class="self-center btn-quiet">{m.scan.checkLink}</a>
			{/if}
		</div>
	{/if}
</main>
