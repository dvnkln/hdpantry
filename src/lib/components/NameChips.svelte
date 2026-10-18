<script lang="ts">
	import { m } from '$lib/i18n/index.svelte';

	// Names recorded before, in one line right where one types: the latest ones, narrowed down
	// while typing. Swiped sideways, without a scroll bar; fades out on the right.
	let { names, onpick }: { names: string[]; onpick: (name: string) => void } = $props();
</script>

{#if names.length}
	<div class="relative mt-2">
		<div
			class="flex [scrollbar-width:none] gap-2 overflow-x-auto pr-8 [&::-webkit-scrollbar]:hidden"
			role="group"
			aria-label={m.item.recent}
		>
			{#each names as entry (entry)}
				<button
					type="button"
					class="shrink-0 rounded-full border border-line bg-surface px-3.5 py-1.5 whitespace-nowrap transition-colors hover:border-accent"
					onclick={() => onpick(entry)}
				>
					{entry}
				</button>
			{/each}
		</div>
		<span
			class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-bg to-transparent"
			aria-hidden="true"
		></span>
	</div>
{/if}
