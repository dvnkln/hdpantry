<script lang="ts">
	import type { CodeSource } from '$lib/containers';
	import type { FillLevel } from '$lib/items';

	let {
		level,
		source = null,
		size = 72
	}: { level: FillLevel; source?: CodeSource | null; size?: number } = $props();

	// Containers recorded by hand have no code that says what they are: they are drawn as a
	// plain jar. Scanned ones are drawn as a vacuum bag. So the two can be told apart at a glance.
	let jar = $derived(source === 'manual');

	// How high the content stands in each drawing
	const BAG: Record<FillLevel, number> = { low: 14, medium: 29, full: 44 };
	const JAR: Record<FillLevel, number> = { low: 12, medium: 32, full: 56 };
	let height = $derived((jar ? JAR : BAG)[level]);
</script>

<!-- Both drawings take the same room, so texts next to them line up -->
<span class="inline-flex shrink-0 justify-center" style:width="{size * 0.9}px">
	{#if jar}
		<!-- A jar with a lid, seen from the side -->
		<svg viewBox="0 0 64 84" width={size * (64 / 84)} height={size} aria-hidden="true">
			<rect
				x="11.5"
				y={75.5 - height}
				width="41"
				{height}
				rx="4"
				class="fill-accent opacity-60 transition-all duration-200"
			/>
			<path
				d="M9 18h46v54a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6z"
				fill="none"
				class="stroke-muted"
				stroke-width="3"
			/>
			<rect x="4" y="6" width="56" height="10" rx="3" class="fill-muted" />
		</svg>
	{:else}
		<!-- A vacuum bag seen from the front: seal strip at the top, round valve -->
		<svg viewBox="0 0 64 72" width={size * (64 / 72)} height={size} aria-hidden="true">
			<rect
				x="7"
				y={65 - height}
				width="50"
				{height}
				rx="2"
				class="fill-accent opacity-60 transition-all duration-200"
			/>
			<rect
				x="4"
				y="4"
				width="56"
				height="64"
				rx="4"
				fill="none"
				class="stroke-muted"
				stroke-width="3"
			/>
			<path d="M4 14h56M4 19h56" fill="none" class="stroke-muted" stroke-width="1.5" />
			<circle cx="47" cy="31" r="5.5" class="fill-surface stroke-muted" stroke-width="2" />
			<circle cx="47" cy="31" r="1.8" class="fill-muted" />
		</svg>
	{/if}
</span>
