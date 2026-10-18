<script lang="ts">
	import { enhance } from '$app/forms';
	import EatenIcon from '$lib/components/EatenIcon.svelte';
	import FoodIcon from '$lib/components/FoodIcon.svelte';
	import PackCount from '$lib/components/PackCount.svelte';
	import { suggestIcon } from '$lib/food/dictionary';
	import { formatDate, formatPackDate, m } from '$lib/i18n/index.svelte';
	import { LOCATION_ICONS } from '$lib/locations';
	import { expiry, type ExpiryLevel } from '$lib/stock';
	import { Pencil, Plus } from '@lucide/svelte';

	let { data } = $props();
	let product = $derived(data.product);
	let first = $derived(data.packs[0]);
	// Which pack "eaten" is asked about: one of the list, or the one to eat first (0)
	let asking = $state<number | null>(null);
	let askedPack = $derived(
		asking === null ? null : (data.packs.find((p) => p.id === asking) ?? first)
	);

	const dateOf = (pack: { bestBefore: string | null; dateMonth: boolean }) =>
		pack.bestBefore ? formatPackDate(pack.bestBefore, pack.dateMonth) : null;
	const due = (pack: { bestBefore: string | null }) =>
		expiry(pack.bestBefore, data.today, data.soonDays);

	// The same colours as the list
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

<svelte:head><title>{product.name} · hdpantry</title></svelte:head>

<!-- pb-32 keeps the content clear of the buttons at the lower edge -->
<main class="mx-auto max-w-md px-4 py-6 pb-32 lg:pb-6">
	<div class="flex items-center gap-3">
		<FoodIcon
			icon={product.icon ?? suggestIcon(product.name, product.category ?? 'other')}
			size={40}
		/>
		<h1 class="min-w-0 flex-1 text-2xl font-bold break-words">{product.name}</h1>
		<a
			href="/products/{product.id}/edit"
			class="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-text"
			aria-label={m.item.edit}
			title={m.item.edit}
		>
			<Pencil size={20} />
		</a>
	</div>
	{#if product.note}<p class="break-words text-muted">{product.note}</p>{/if}

	{#if first}
		{@const level = due(first).level}
		<!-- How long the first pack still keeps, and how many there are -->
		<section
			class="mt-4 flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 {BOX[
				level
			]}"
		>
			<p>
				<span class="block text-[13px] text-muted">
					{m.item.bestBefore}
					{dateOf(first) ?? ''}
				</span>
				<span class="block text-[26px] leading-tight font-bold {TONE[level]}">
					{due(first).days === null ? m.item.noDate : m.home.relative(due(first).days!)}
				</span>
			</p>
			<!-- How many: drawn as a pack, where a container shows its fill level -->
			<span title={m.home.packs(data.packs.length)}>
				<PackCount count={data.packs.length} shape={product.shape} size={64} />
				<span class="sr-only">{m.home.packs(data.packs.length)}</span>
			</span>
		</section>
	{:else}
		<p class="mt-4 rounded-xl border border-line bg-surface px-4 py-3.5 text-muted">
			{m.products.noPacks}
		</p>
	{/if}

	{#if data.packs.length > 1}
		<!-- Every pack with its own date: one that is not the first can be eaten too -->
		<section class="mt-4">
			<h2 class="text-sm font-semibold text-muted">{m.products.packs}</h2>
			<ul class="mt-2 overflow-hidden rounded-xl border border-line bg-surface">
				{#each data.packs as pack (pack.id)}
					{@const Icon = LOCATION_ICONS[pack.location]}
					{@const d = due(pack)}
					<!-- Like a card of the list: how long it still keeps first, the date below -->
					<li class="flex items-center gap-3 border-b border-line py-2 pr-1.5 pl-4 last:border-b-0">
						<Icon size={16} class="shrink-0 text-muted" />
						<span class="min-w-0 flex-1">
							<span class="block font-semibold {TONE[d.level]}">
								{d.days === null ? m.item.noDate : m.home.relative(d.days)}
							</span>
							<span class="block truncate text-xs text-muted">
								{m.products.packLine(dateOf(pack), formatDate(pack.since))}
							</span>
						</span>
						<button
							type="button"
							class="flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-text"
							aria-label={m.products.eat}
							title={m.products.eat}
							onclick={() => (asking = pack.id)}
						>
							<EatenIcon size={22} />
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="mt-4 rounded-xl border border-line bg-surface p-4">
		<dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
			{#if product.category && product.category !== 'other'}
				<dt class="text-muted">{m.item.category}</dt>
				<dd>{m.categories[product.category]}</dd>
			{/if}
			{#if data.packs.length === 1}
				{@const Icon = LOCATION_ICONS[data.packs[0].location]}
				<dt class="text-muted">{m.item.location}</dt>
				<dd class="flex items-center gap-1.5">
					<Icon size={16} class="shrink-0 text-muted" />
					{m.locations[data.packs[0].location]}
				</dd>
				<dt class="text-muted">{m.item.since}</dt>
				<dd>{formatDate(data.packs[0].since)}</dd>
			{/if}
			<dt class="text-muted">{m.products.barcode}</dt>
			<dd>
				{#if product.barcode}
					<span class="font-mono">{product.barcode}</span>
				{:else}
					<a href="/scan?attach={product.id}" class="underline hover:text-accent"
						>{m.products.attach}</a
					>
				{/if}
			</dd>
		</dl>
	</section>

	<!-- What one comes here to do: on phones at the lower edge, where the thumb is; on wide
	     screens right below the details -->
	<div
		class="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-bg from-65% to-transparent px-4 pt-6 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:static lg:mt-4 lg:bg-none lg:p-0"
	>
		<div class="mx-auto max-w-md">
			{#if askedPack}
				<div class="rounded-xl border border-line bg-surface p-4">
					<p class="text-sm">{m.products.eatenQuestion(product.name, dateOf(askedPack))}</p>
					<form method="POST" action="?/eaten" use:enhance class="mt-3 flex gap-2">
						<input type="hidden" name="pack" value={askedPack.id} />
						<button type="button" class="flex-1 btn-secondary" onclick={() => (asking = null)}>
							{m.common.cancel}
						</button>
						<button class="flex-1 btn-primary">{m.products.eatenConfirm}</button>
					</form>
				</div>
			{:else}
				<div class="flex gap-2">
					{#if first}
						<button
							type="button"
							class="flex flex-1 items-center justify-center gap-2 btn-secondary"
							onclick={() => (asking = first.id)}
						>
							<EatenIcon size={24} />
							{m.products.eat}
						</button>
					{/if}
					<a
						href="/products/{product.id}/add"
						class="flex flex-1 items-center justify-center gap-2 btn-primary"
					>
						<Plus size={18} />
						{m.item.add}
					</a>
				</div>
			{/if}
		</div>
	</div>

	{#if data.history.length}
		<section class="mt-6">
			<h2 class="text-sm font-semibold text-muted">{m.products.history}</h2>
			<ul class="mt-2 overflow-hidden rounded-xl border border-line bg-surface">
				{#each data.history as entry (entry.id)}
					<li class="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
						<span class="min-w-0 flex-1 truncate font-medium">{entry.name}</span>
						<span class="shrink-0 text-sm text-muted">{formatDate(entry.eaten)}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>
