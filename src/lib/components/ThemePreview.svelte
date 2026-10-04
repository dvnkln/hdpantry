<script lang="ts">
	import type { Theme } from '$lib/themes';

	let { theme }: { theme: Theme } = $props();
</script>

<!-- A small picture of the app in one colour scheme: the attribute alone switches the colours.
     "system" is shown half light, half dark. -->
{#snippet mock(scheme: Theme)}
	<div data-theme={scheme} class="flex h-full flex-1 flex-col gap-1.5 bg-bg p-2">
		<div class="h-1.5 w-8 rounded-full bg-accent"></div>
		<div class="flex items-center gap-1.5 rounded border border-line bg-surface p-1.5">
			<div class="size-3 rounded-sm bg-accent/60"></div>
			<div class="h-1.5 flex-1 rounded-full bg-text"></div>
			<div class="h-1.5 w-4 rounded-full bg-muted"></div>
		</div>
		<div class="flex items-center gap-1.5 rounded border border-line bg-surface p-1.5">
			<div class="size-3 rounded-sm bg-warn/70"></div>
			<div class="h-1.5 flex-1 rounded-full bg-text"></div>
			<div class="h-1.5 w-4 rounded-full bg-muted"></div>
		</div>
	</div>
{/snippet}

<div class="flex h-20 w-full overflow-hidden rounded-lg border border-line" aria-hidden="true">
	{#if theme === 'system'}
		{@render mock('light')}
		{@render mock('dark')}
	{:else}
		{@render mock(theme)}
	{/if}
</div>
