<script lang="ts">
	import { codeLabel, containerLabel } from '$lib/containers';
	import { m } from '$lib/i18n/index.svelte';
	import { ChevronRight } from '@lucide/svelte';

	let { data } = $props();
</script>

<svelte:head><title>{m.containers.title} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-screen-md px-4 py-6">
	<h1 class="text-xl font-bold">{m.containers.title}</h1>

	{#if data.containers.length === 0}
		<p class="mt-3 text-sm text-muted">{m.containers.empty}</p>
	{:else}
		<p class="mt-1 text-sm text-muted">{m.containers.count(data.containers.length)}</p>
		<ul class="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
			{#each data.containers as container (container.id)}
				<li class="border-b border-line last:border-b-0">
					<a
						href="/containers/{container.id}"
						class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg"
					>
						<span class="min-w-0 flex-1">
							<span class="block truncate font-medium">{containerLabel(container)}</span>
							{#if container.name}
								<span class="block truncate font-mono text-xs text-muted">
									{codeLabel(container)}
								</span>
							{/if}
						</span>
						<ChevronRight size={18} class="shrink-0 text-muted" />
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</main>
