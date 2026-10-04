<script lang="ts">
	import { goto } from '$app/navigation';
	import { m } from '$lib/i18n/index.svelte';
	import { FIRST_SETTINGS_PAGE, settingsGroups } from '$lib/settingsNav';
	import { ChevronRight } from '@lucide/svelte';

	let groups = $derived(settingsGroups());

	// Computers show the sidebar next to the content, so they go straight to the first area
	$effect(() => {
		if (window.matchMedia('(min-width: 48rem)').matches) {
			goto(FIRST_SETTINGS_PAGE, { replaceState: true });
		}
	});
</script>

<svelte:head><title>{m.settings.title} · hdpantry</title></svelte:head>

<!-- Phones: the list of all areas, grouped -->
<div class="flex flex-col gap-6 md:hidden">
	{#each groups as group, i (i)}
		<div>
			{#if group.title}
				<p class="px-1 pb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
					{group.title}
				</p>
			{/if}
			<ul class="overflow-hidden rounded-xl border border-line bg-surface">
				{#each group.items as item (item.href)}
					<li class="border-b border-line last:border-b-0">
						<a
							href={item.href}
							class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg"
						>
							<item.icon size={20} class="shrink-0 text-muted" />
							<span class="min-w-0 flex-1">
								<span class="block text-sm font-medium">{item.label}</span>
								<span class="block truncate text-xs text-muted">{item.hint}</span>
							</span>
							<ChevronRight size={18} class="shrink-0 text-muted" />
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>
