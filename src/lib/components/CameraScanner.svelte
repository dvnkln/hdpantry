<script lang="ts">
	import { onMount } from 'svelte';
	import { crossfade, fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { m } from '$lib/i18n/index.svelte';
	import { pointInFrame, readCode, type CameraInfo, type Code } from '$lib/scanner';
	import { CameraOff, Flashlight, FlashlightOff, Info } from '@lucide/svelte';

	let {
		onscan,
		idleHint = '',
		oncamera,
		read = readCode
	}: {
		onscan: (code: Code) => void;
		// Shown inside the picture for a moment when nothing was found for a while (IDLE_MS) –
		// that is where one looks. Afterwards it stays at hand behind an info button.
		idleHint?: string;
		// What the camera that started can do ("check a code" shows it)
		oncamera?: (info: CameraInfo) => void;
		// How a frame is read; "check a code" reads it with both readers
		read?: (source: HTMLVideoElement) => Promise<Code | null>;
	} = $props();

	type Problem = 'noHttps' | 'denied' | 'noCamera' | 'failed';
	let video = $state<HTMLVideoElement>();
	let problem = $state<Problem | null>(null);
	let running = $state(false);
	// The lamp of the phone, where the camera has one (helps with frost and reflections)
	let hasLight = $state(false);
	let light = $state(false);
	let track: MediaStreamTrack | undefined;

	// Lamp and focus are not part of the standard types yet
	type Extras = {
		torch?: boolean;
		focusMode?: string | string[];
		pointsOfInterest?: { x: number; y: number }[];
	};
	const extra = (value: Extras) => ({ advanced: [value] }) as MediaTrackConstraints;

	async function toggleLight() {
		try {
			await track?.applyConstraints(extra({ torch: !light }));
			light = !light;
		} catch {
			hasLight = false; // the camera said it has one but does not let us use it
		}
	}

	// The hint inside the picture: appears when nothing was found for a while, then shrinks into
	// an info button next to the light button, where a tap brings it back for a moment.
	const HINT_MS = 5000;
	let hintShown = $state(false);
	// The button only exists once the hint has come by itself – before that it would be clutter
	let hintOffered = $state(false);
	let hintTimer: ReturnType<typeof setTimeout>;
	function showHint() {
		if (!idleHint) return;
		hintOffered = true;
		hintShown = true;
		clearTimeout(hintTimer);
		hintTimer = setTimeout(() => (hintShown = false), HINT_MS);
	}
	function hideHint() {
		clearTimeout(hintTimer);
		hintShown = false;
	}
	// Band and button turn into each other; no movement for those who switched it off
	const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const [send, receive] = crossfade({
		duration: () => (calm() ? 0 : 350),
		fallback: (node) => fade(node, { duration: calm() ? 0 : 300 })
	});

	// Tap to focus, as in camera apps – only where the camera offers focusing once on a point.
	// Afterwards it goes back to focusing all the time, so it does not stay stuck on one distance.
	const REFOCUS_MS = 3000;
	let canPoint = $state(false);
	let canFollow = false;
	let ring = $state<{ x: number; y: number; id: number } | null>(null);
	let focusTimer: ReturnType<typeof setTimeout>;
	async function focusAt(event: MouseEvent) {
		if (!canPoint || !video || !track) return;
		const box = video.getBoundingClientRect();
		const x = event.clientX - box.left;
		const y = event.clientY - box.top;
		const point = pointInFrame(
			{ x, y },
			{ width: box.width, height: box.height },
			{ width: video.videoWidth, height: video.videoHeight }
		);
		const id = Date.now();
		ring = { x, y, id };
		setTimeout(() => {
			if (ring?.id === id) ring = null;
		}, 900);
		try {
			await track.applyConstraints(extra({ pointsOfInterest: [point], focusMode: 'single-shot' }));
			clearTimeout(focusTimer);
			if (canFollow) {
				focusTimer = setTimeout(() => {
					track?.applyConstraints(extra({ focusMode: 'continuous' })).catch(() => {});
				}, REFOCUS_MS);
			}
		} catch {
			canPoint = false; // offered, but the camera does not let us
			ring = null;
		}
	}

	// The same code stays in the picture for a while: report it once, not ten times a second.
	const REPEAT_MS = 3000;
	const PAUSE_MS = 150;
	const IDLE_MS = 5000;

	onMount(() => {
		let stream: MediaStream | undefined;
		let stopped = false;
		let timer: ReturnType<typeof setTimeout>;
		let last = { text: '', at: 0 };
		// Since when nothing has been found; told once per dry spell
		let quietSince = 0;
		let toldIdle = false;

		async function look() {
			if (stopped || !video) return;
			try {
				// readyState 2+: there is a frame to look at
				const code = video.readyState >= 2 ? await read(video) : null;
				if (code) {
					quietSince = Date.now();
					toldIdle = false;
					hideHint();
				} else if (!toldIdle && Date.now() - quietSince > IDLE_MS) {
					toldIdle = true;
					showHint();
				}
				if (code && (code.text !== last.text || Date.now() - last.at > REPEAT_MS)) {
					last = { text: code.text, at: Date.now() };
					// Long enough to be felt; the phone may still suppress it (haptics off, do not disturb)
					if (page.data.scanVibration !== false) navigator.vibrate?.(200);
					onscan(code);
				} else if (code) {
					last.at = Date.now();
				}
			} catch (err) {
				console.error('Reading the camera picture failed', err);
				problem = 'failed';
				stop();
				return;
			}
			timer = setTimeout(look, PAUSE_MS);
		}

		async function start() {
			// Browsers only hand out the camera on https (or localhost)
			if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
				problem = 'noHttps';
				return;
			}
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					// A sharp picture: small or slightly creased codes need the pixels. The browser
					// gives what the camera can do.
					video: {
						facingMode: { ideal: 'environment' },
						width: { ideal: 1920 },
						height: { ideal: 1080 }
					},
					audio: false
				});
			} catch (err) {
				const name = err instanceof DOMException ? err.name : '';
				problem =
					name === 'NotAllowedError' || name === 'SecurityError'
						? 'denied'
						: name === 'NotFoundError' || name === 'OverconstrainedError'
							? 'noCamera'
							: 'failed';
				return;
			}
			if (stopped || !video) return stop();
			video.srcObject = stream;
			await video.play().catch(() => {});
			running = true;
			quietSince = Date.now();
			toldIdle = false;
			track = stream.getVideoTracks()[0];
			const can = (track?.getCapabilities?.() ?? {}) as Extras;
			hasLight = can.torch === true;
			light = false;
			const focusModes = Array.isArray(can.focusMode) ? can.focusMode : [];
			canPoint = focusModes.includes('single-shot');
			canFollow = focusModes.includes('continuous');
			// Keep focusing while the code is moved closer, where the camera offers that
			if (canFollow) track?.applyConstraints(extra({ focusMode: 'continuous' })).catch(() => {});
			oncamera?.({
				width: video.videoWidth,
				height: video.videoHeight,
				light: hasLight,
				tapFocus: canPoint,
				focusModes
			});
			look();
		}

		function stop() {
			stopped = true;
			running = false;
			hasLight = false;
			light = false;
			canPoint = false;
			hintShown = false;
			hintOffered = false;
			ring = null;
			clearTimeout(timer);
			clearTimeout(hintTimer);
			clearTimeout(focusTimer);
			stream?.getTracks().forEach((track) => track.stop());
		}

		// The camera goes off when the tab is hidden and comes back with it
		function onVisibility() {
			if (document.hidden) stop();
			else if (stopped && !problem) {
				stopped = false;
				start();
			}
		}
		document.addEventListener('visibilitychange', onVisibility);

		start();
		return () => {
			document.removeEventListener('visibilitychange', onVisibility);
			stop();
		};
	});
</script>

<!-- Live picture of the camera; found codes are reported through `onscan` -->
<!-- Square while the camera runs; only as tall as its text when it cannot -->
<div
	class="relative w-full overflow-hidden rounded-xl border border-line bg-surface {problem
		? ''
		: 'aspect-square'}"
>
	<!-- Tapping the picture focuses there (pointer only: an extra, nothing depends on it) -->
	<!-- svelte-ignore a11y_media_has_caption, a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<video
		bind:this={video}
		playsinline
		muted
		onclick={focusAt}
		class="size-full object-cover {running ? '' : 'invisible'} {problem ? 'hidden' : ''}"
	></video>
	{#if problem}
		<div class="flex flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
			<CameraOff size={32} class="text-muted" />
			<p class="text-sm">{m.scan.problems[problem]}</p>
		</div>
	{:else if !running}
		<p class="absolute inset-0 flex items-center justify-center text-sm text-muted">
			{m.scan.cameraStarting}
		</p>
	{:else}
		<!-- Frame that shows where to hold the code -->
		<div
			class="pointer-events-none absolute inset-[18%] rounded-lg border-2 border-accent"
			aria-hidden="true"
		></div>
		{#if ring}
			<!-- Where the camera was told to focus -->
			<div
				class="pointer-events-none absolute size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90"
				style="left: {ring.x}px; top: {ring.y}px"
				transition:fade={{ duration: 200 }}
				aria-hidden="true"
			></div>
		{/if}
		{#if hintShown}
			<!-- Below the frame, and clear of the light button. A tap puts it away. -->
			<button
				type="button"
				class="absolute bottom-2 left-2 rounded-lg border border-line bg-surface/90 px-2.5 py-1.5 text-center text-[13px] leading-tight font-medium {hasLight
					? 'right-[3.75rem]'
					: 'right-2'}"
				onclick={hideHint}
				in:receive={{ key: 'hint' }}
				out:send={{ key: 'hint' }}
			>
				<span role="status">{idleHint}</span>
			</button>
		{:else if hintOffered}
			<!-- What the hint shrinks into: right next to the light button, within reach of the thumb -->
			<button
				type="button"
				class="absolute bottom-2 flex size-11 items-center justify-center rounded-full border border-line bg-surface/90 transition-colors hover:border-accent {hasLight
					? 'right-[3.75rem]'
					: 'right-2'}"
				aria-label={m.scan.hintShow}
				title={m.scan.hintShow}
				onclick={showHint}
				in:receive={{ key: 'hint' }}
				out:send={{ key: 'hint' }}
			>
				<Info size={20} />
			</button>
		{/if}
		{#if hasLight}
			<button
				type="button"
				class="absolute right-2 bottom-2 flex size-11 items-center justify-center rounded-full border border-line bg-surface/90 transition-colors hover:border-accent {light
					? 'text-accent'
					: ''}"
				aria-pressed={light}
				aria-label={light ? m.scan.lightOff : m.scan.lightOn}
				title={light ? m.scan.lightOff : m.scan.lightOn}
				onclick={toggleLight}
			>
				{#if light}<Flashlight size={20} />{:else}<FlashlightOff size={20} />{/if}
			</button>
		{/if}
	{/if}
</div>
