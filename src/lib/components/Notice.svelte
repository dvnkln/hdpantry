<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Info, TriangleAlert } from '@lucide/svelte';

	type Props = { kind?: 'info' | 'warning'; class?: string; children: Snippet };
	let { kind = 'info', class: extra = '', children }: Props = $props();
</script>

<!-- Hint box in the settings: a quiet card with an icon in front (grey "i" or warning triangle) -->
<div class="flex gap-2.5 rounded-lg border border-line bg-surface p-3 text-sm {extra}">
	{#if kind === 'warning'}
		<TriangleAlert size={18} class="mt-px shrink-0 text-warn" />
	{:else}
		<Info size={18} class="mt-px shrink-0 text-muted" />
	{/if}
	<div class="min-w-0 flex-1">{@render children()}</div>
</div>
