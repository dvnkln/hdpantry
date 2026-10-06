<script lang="ts">
	import type { Snippet } from 'svelte';
	import { m } from '$lib/i18n/index.svelte';
	import type { Location } from '$lib/items';
	import { LOCATION_ICONS } from '$lib/locations';

	// The stock list of one place of storage, drawn as if the things stood in that fridge,
	// freezer or cabinet: seen from the front, door open. A bit of fun that can be switched on
	// under Settings → Appearance. The drawing itself is CSS (`.scene` in routes/layout.css).
	let { place, children }: { place: Location; children: Snippet } = $props();

	let Icon = $derived(LOCATION_ICONS[place]);

	// The furniture always reaches down to the scan bar – no mini fridge for a single entry –
	// but never makes the page scroll by itself: its smallest height is the room that is free
	// on the screen. More entries make it grow, then the page scrolls as usual.
	let scene = $state<HTMLElement>();
	let minHeight = $state<number | null>(null);
	// Height of the empty room below the entries: decides how many empty drawers are drawn
	let free = $state(0);
	// main's padding plus the room kept clear for the scan bar (pb-28 in +layout.svelte)
	const BELOW = 136;

	function measure() {
		if (!scene) return;
		const top = scene.getBoundingClientRect().top + window.scrollY;
		minHeight = Math.max(window.innerHeight - top - BELOW, 0);
	}
	$effect(() => {
		measure();
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	});

	// Empty drawers below the entries (zero-degree zone and freezer), as many as fit
	const DRAWER = { zero: 106, freezer: 74 } as const;
	let drawers = $derived(
		place === 'zero' || place === 'freezer' ? Math.floor(free / DRAWER[place]) : 0
	);
</script>

<div
	bind:this={scene}
	class="scene"
	data-place={place}
	style:min-height={minHeight === null ? undefined : `${minHeight}px`}
>
	<div class="scene-cap"><Icon size={16} />{m.locations[place]}</div>
	<div class="scene-in">
		{#if place === 'zero'}
			<!-- the fridge above its drawers, only hinted at -->
			<div class="scene-above" aria-hidden="true"></div>
			<div class="scene-drawer">
				<span class="scene-tag" aria-hidden="true">0 °C</span>
				{@render children()}
			</div>
		{:else}
			{@render children()}
		{/if}
		<div class="scene-rest" bind:clientHeight={free} aria-hidden="true">
			{#if place === 'fridge' && free > 110}
				<div class="scene-crisper"></div>
			{/if}
			{#each { length: drawers } as _, i (i)}
				<div class="scene-drawer scene-empty"></div>
			{/each}
		</div>
	</div>
	<span class="scene-feet" aria-hidden="true"><i></i><i></i></span>
</div>
