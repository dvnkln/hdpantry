<script lang="ts">
	import { enhance } from '$app/forms';
	import EatenIcon from '$lib/components/EatenIcon.svelte';
	import FillGauge from '$lib/components/FillGauge.svelte';
	import FoodIcon from '$lib/components/FoodIcon.svelte';
	import { suggestIcon } from '$lib/food/dictionary';
	import { codeLabel } from '$lib/containers';
	import { formatAmount, formatDate, m } from '$lib/i18n/index.svelte';
	import { LOCATION_ICONS } from '$lib/locations';
	import { expiry, type ExpiryLevel } from '$lib/stock';
	import { Pencil, Replace } from '@lucide/svelte';

	let { data } = $props();
	let container = $derived(data.container);
	let item = $derived(data.item);
	let confirmEaten = $state(false);
	// How the container got into the app, said in a word behind its name
	let how = $derived(container.manual ? m.containers.typed : m.containers.scanned);

	// How long it still keeps: the first thing this page is opened for, in the colours of the list
	let due = $derived(expiry(item?.bestBefore ?? null, data.today, data.soonDays));
	const BOX: Record<ExpiryLevel, string> = {
		expired: 'border-danger/40 bg-danger/10',
		soon: 'border-warn/40 bg-warn/10',
		fine: 'border-line bg-surface',
		none: 'border-line bg-surface'
	};
	const TONE: Record<ExpiryLevel, string> = {
		expired: 'text-danger',
		soon: 'text-warn',
		fine: '',
		none: 'text-muted'
	};
</script>

<svelte:head><title>{item?.name ?? codeLabel(container)} · hdpantry</title></svelte:head>

<!-- pb-32 keeps the content clear of the buttons at the lower edge -->
<main class="mx-auto max-w-md px-4 py-6 {item ? 'pb-32 lg:pb-6' : ''}">
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

		<section
			class="mt-4 flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 {BOX[
				due.level
			]}"
		>
			<p>
				<span class="block text-[13px] text-muted">
					{m.item.bestBefore}
					{#if item.bestBefore}{formatDate(item.bestBefore)}{/if}
				</span>
				<span class="block text-[26px] leading-tight font-bold {TONE[due.level]}">
					{due.days === null ? m.item.noDate : m.home.relative(due.days)}
				</span>
			</p>
			<FillGauge level={item.fill} source={container.source} size={64} />
		</section>

		<section class="mt-4 rounded-xl border border-line bg-surface p-4">
			<dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
				{#if item.category && item.category !== 'other'}
					<dt class="text-muted">{m.item.category}</dt>
					<dd>{m.categories[item.category]}</dd>
				{/if}
				<dt class="text-muted">{m.item.location}</dt>
				<dd class="flex items-center gap-1.5">
					<Icon size={16} class="shrink-0 text-muted" />
					{m.locations[item.location]}
				</dd>
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
				<dt class="text-muted">{m.containers.container}</dt>
				<dd>
					{codeLabel(container)}
					<span class="text-muted">({how})</span>
				</dd>
			</dl>
		</section>

		<!-- The two things one comes here to do: on phones at the lower edge, where the thumb is;
		     on wide screens right below the details -->
		<div
			class="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-bg from-65% to-transparent px-4 pt-6 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:static lg:mt-4 lg:bg-none lg:p-0"
		>
			<div class="mx-auto max-w-md">
				{#if confirmEaten}
					<div class="rounded-xl border border-line bg-surface p-4">
						<p class="text-sm">{m.item.eatenQuestion(item.name)}</p>
						<form method="POST" action="?/eaten" use:enhance class="mt-3 flex gap-2">
							<button
								type="button"
								class="flex-1 btn-secondary"
								onclick={() => (confirmEaten = false)}
							>
								{m.common.cancel}
							</button>
							<button class="flex-1 btn-primary">{m.item.eatenConfirm}</button>
						</form>
					</div>
				{:else}
					<div class="flex gap-2">
						<button
							type="button"
							class="flex flex-1 items-center justify-center gap-2 btn-secondary"
							onclick={() => (confirmEaten = true)}
						>
							<EatenIcon size={24} />
							{m.item.eaten}
						</button>
						<!-- Eaten and filled again in one go -->
						<a
							href="/containers/{container.id}/add?replace=1"
							class="flex flex-1 items-center justify-center gap-2 btn-primary"
						>
							<Replace size={18} />
							{m.item.replace}
						</a>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<h1 class="text-2xl font-bold">{m.containers.emptyTitle}</h1>
		<a href="/containers/{container.id}/add" class="mt-4 block btn-primary text-center">
			{m.containers.fill}
		</a>
	{/if}

	{#if !item}
		<!-- An empty container has no box of details: its name stands here as one quiet line -->
		<p class="mt-8 text-sm text-muted">
			{m.containers.container}
			<span class="font-medium text-text">{codeLabel(container)}</span>
			({how})
		</p>
	{/if}

	<!-- What was in this container before: to see what it was used for (only to look at here;
	     taking an entry as a template happens when filling it) -->
	{#if data.history.length}
		<section class="mt-6">
			<h2 class="text-sm font-semibold text-muted">{m.item.history}</h2>
			<ul class="mt-2 overflow-hidden rounded-xl border border-line bg-surface">
				{#each data.history as entry (entry.id)}
					<li class="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
						<span class="min-w-0 flex-1 truncate font-medium">{entry.name}</span>
						<span class="shrink-0 text-sm text-muted">{formatDate(entry.createdAt)}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>
