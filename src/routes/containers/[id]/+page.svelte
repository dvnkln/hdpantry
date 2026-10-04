<script lang="ts">
	import { enhance } from '$app/forms';
	import EatenIcon from '$lib/components/EatenIcon.svelte';
	import FillGauge from '$lib/components/FillGauge.svelte';
	import FoodIcon from '$lib/components/FoodIcon.svelte';
	import { suggestIcon } from '$lib/food/dictionary';
	import { codeLabel } from '$lib/containers';
	import { formatAmount, formatDate, m } from '$lib/i18n/index.svelte';
	import { LOCATION_ICONS } from '$lib/locations';
	import { Pencil, Replace } from '@lucide/svelte';

	let { data } = $props();
	let container = $derived(data.container);
	let item = $derived(data.item);
	let confirmEaten = $state(false);
</script>

<svelte:head><title>{item?.name ?? codeLabel(container)} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-md px-4 py-6">
	{#if item}
		{@const Icon = LOCATION_ICONS[item.location]}
		<div class="flex items-center gap-3">
			<FoodIcon icon={item.icon ?? suggestIcon(item.name, item.category ?? 'other')} size={40} />
			<h1 class="min-w-0 flex-1 text-2xl font-bold break-words">{item.name}</h1>
			<a
				href="/containers/{container.id}/edit"
				class="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-text"
				aria-label={m.item.edit}
				title={m.item.edit}
			>
				<Pencil size={20} />
			</a>
		</div>
		{#if item.note}<p class="break-words text-muted">{item.note}</p>{/if}

		<section class="mt-4 flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
			<FillGauge level={item.fill} source={container.source} size={64} />
			<dl class="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
				{#if item.category && item.category !== 'other'}
					<dt class="text-muted">{m.item.category}</dt>
					<dd>{m.categories[item.category]}</dd>
				{/if}
				<dt class="text-muted">{m.item.location}</dt>
				<dd class="flex items-center gap-1.5">
					<Icon size={16} class="shrink-0 text-muted" />
					{m.locations[item.location]}
				</dd>
				<dt class="text-muted">{m.item.bestBefore}</dt>
				<dd>{item.bestBefore ? formatDate(item.bestBefore) : m.item.noDate}</dd>
				<dt class="text-muted">{m.item.fill}</dt>
				<dd>
					{[
						m.fillLevels[item.fill],
						item.amount !== null && item.unit ? formatAmount(item.amount, item.unit) : ''
					]
						.filter(Boolean)
						.join(' · ')}
				</dd>
				<dt class="text-muted">{m.item.vacuumed}</dt>
				<dd>{item.vacuumed ? m.common.yes : m.common.no}</dd>
				<dt class="text-muted">{m.item.since}</dt>
				<dd>{formatDate(item.createdAt)}</dd>
			</dl>
		</section>

		{#if confirmEaten}
			<div class="mt-4 rounded-xl border border-line bg-surface p-4">
				<p class="text-sm">{m.item.eatenQuestion(item.name)}</p>
				<form method="POST" action="?/eaten" use:enhance class="mt-3 flex gap-2">
					<button type="button" class="flex-1 btn-secondary" onclick={() => (confirmEaten = false)}>
						{m.common.cancel}
					</button>
					<button class="flex-1 btn-primary">{m.item.eatenConfirm}</button>
				</form>
			</div>
		{:else}
			<div class="mt-4 flex gap-2">
				<button
					type="button"
					class="flex flex-1 items-center justify-center gap-2 btn-primary"
					onclick={() => (confirmEaten = true)}
				>
					<EatenIcon size={24} />
					{m.item.eaten}
				</button>
				<!-- Eaten and filled again in one go -->
				<a
					href="/containers/{container.id}/add?replace=1"
					class="flex flex-1 items-center justify-center gap-2 btn-secondary"
				>
					<Replace size={18} />
					{m.item.replace}
				</a>
			</div>
		{/if}
	{:else}
		<h1 class="text-2xl font-bold">{m.containers.emptyTitle}</h1>
		<a href="/containers/{container.id}/add" class="mt-4 block btn-primary text-center">
			{m.containers.fill}
		</a>
	{/if}

	<!-- The container itself: two quiet lines -->
	<p class="mt-8 text-sm text-muted">
		{m.containers.container}
		<span class="font-medium text-text">{codeLabel(container)}</span>
	</p>
	<p class="text-sm text-muted">{container.manual ? m.containers.typed : m.containers.scanned}</p>
</main>
