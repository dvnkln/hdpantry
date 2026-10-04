<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { readCode, type Code } from '$lib/scanner';
	import { CameraOff } from '@lucide/svelte';

	let { onscan }: { onscan: (code: Code) => void } = $props();

	type Problem = 'noHttps' | 'denied' | 'noCamera' | 'failed';
	let video = $state<HTMLVideoElement>();
	let problem = $state<Problem | null>(null);
	let running = $state(false);

	// The same code stays in the picture for a while: report it once, not ten times a second.
	const REPEAT_MS = 3000;
	const PAUSE_MS = 150;

	onMount(() => {
		let stream: MediaStream | undefined;
		let stopped = false;
		let timer: ReturnType<typeof setTimeout>;
		let last = { text: '', at: 0 };

		async function look() {
			if (stopped || !video) return;
			try {
				// readyState 2+: there is a frame to look at
				const code = video.readyState >= 2 ? await readCode(video) : null;
				if (code && (code.text !== last.text || Date.now() - last.at > REPEAT_MS)) {
					last = { text: code.text, at: Date.now() };
					// Long enough to be felt; the phone may still suppress it (haptics off, do not disturb)
					navigator.vibrate?.(200);
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
					video: { facingMode: { ideal: 'environment' } },
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
			look();
		}

		function stop() {
			stopped = true;
			running = false;
			clearTimeout(timer);
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
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={video}
		playsinline
		muted
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
	{/if}
</div>
