<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/index.svelte';
	import { settingsGroups } from '$lib/settingsNav';
	import { ChevronLeft } from '@lucide/svelte';

	let { children } = $props();

	let groups = $derived(settingsGroups());
	let isOverview = $derived(page.url.pathname === '/settings');
</script>

<!-- Computers: the areas in a sidebar on the left, the chosen one on the right.
     Phones: /settings shows the list of areas; each area has a link back to it. -->
<!-- The overview has no visible heading; each area brings its own -->
{#if isOverview}<h1 class="sr-only">{m.settings.title}</h1>{/if}
<div class="mx-auto max-w-screen-lg px-4 py-4 md:flex md:gap-8 md:py-6">
	<nav aria-label={m.settings.title} class="hidden w-52 shrink-0 md:block">
		<div class="sticky top-[77px] flex flex-col gap-5">
			{#each groups as group, i (i)}
				<div>
					{#if group.title}
						<p class="px-3 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
							{group.title}
						</p>
					{/if}
					{#each group.items as item (item.href)}
						{@const active = page.url.pathname.startsWith(item.href)}
						<a
							href={item.href}
							aria-current={active ? 'page' : undefined}
							class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors {active
								? 'bg-surface font-medium text-text'
								: 'text-muted hover:bg-surface hover:text-text'}"
						>
							<item.icon size={18} class="shrink-0" />
							{item.label}
						</a>
					{/each}
				</div>
			{/each}
		</div>
	</nav>

	<main class="min-w-0 flex-1">
		{#if !isOverview}
			<a href="/settings" class="mb-2 -ml-2 inline-flex items-center gap-1 btn-quiet md:hidden">
				<ChevronLeft size={16} />{m.settings.title}
			</a>
		{/if}
		{@render children()}
	</main>
</div>
