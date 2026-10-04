<script lang="ts">
	import FillGauge from '$lib/components/FillGauge.svelte';
	import FoodIcon from '$lib/components/FoodIcon.svelte';
	import { suggestIcon } from '$lib/food/dictionary';
	import { formatAmount, formatDate, m } from '$lib/i18n/index.svelte';
	import { LOCATION_ICONS } from '$lib/locations';
	import { PackageOpen } from '@lucide/svelte';

	let { data } = $props();
</script>

<svelte:head><title>{m.home.title} · hdpantry</title></svelte:head>

{#if data.stock.length === 0}
	<main class="mx-auto flex max-w-md flex-col items-center px-4 pt-16 text-center">
		<PackageOpen size={48} class="text-muted" />
		<h1 class="mt-4 text-xl font-bold">{m.home.empty}</h1>
		<p class="mt-2 text-sm text-muted">{m.home.emptyHint}</p>
	</main>
{:else}
	<main class="mx-auto max-w-screen-md px-4 py-6">
		<!-- The list explains itself: the heading is only there for screen readers -->
		<h1 class="sr-only">{m.home.title}</h1>
		<ul class="flex flex-col gap-2">
			{#each data.stock as item (item.id)}
				{@const Icon = LOCATION_ICONS[item.location]}
				<li>
					<a
						href="/containers/{item.containerId}"
						class="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-accent"
					>
						<FoodIcon
							icon={item.icon ?? suggestIcon(item.name, item.category ?? 'other')}
							size={36}
						/>
						<span class="min-w-0 flex-1">
							<span class="block truncate font-semibold">{item.name}</span>
							<span class="flex items-center gap-1.5 text-sm text-muted">
								<Icon size={14} class="shrink-0" />
								<span class="truncate">
									{[
										m.locations[item.location],
										item.amount !== null && item.unit ? formatAmount(item.amount, item.unit) : ''
									]
										.filter(Boolean)
										.join(' · ')}
								</span>
							</span>
						</span>
						<span class="shrink-0 text-right text-sm">
							<span class="block text-xs text-muted">{m.item.bestBefore}</span>
							{item.bestBefore ? formatDate(item.bestBefore) : '–'}
						</span>
						<FillGauge level={item.fill} source={item.source} size={30} />
					</a>
				</li>
			{/each}
		</ul>
	</main>
{/if}
