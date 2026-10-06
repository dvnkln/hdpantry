<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import FillGauge from '$lib/components/FillGauge.svelte';
	import FoodIcon from '$lib/components/FoodIcon.svelte';
	import StorageScene from '$lib/components/StorageScene.svelte';
	import { codeLabel } from '$lib/containers';
	import { suggestIcon } from '$lib/food/dictionary';
	import { formatAmount, formatDate, m } from '$lib/i18n/index.svelte';
	import { LOCATIONS, type Location } from '$lib/items';
	import { LOCATION_ICONS } from '$lib/locations';
	import { ui } from '$lib/ui';
	import {
		expiry,
		isSortKey,
		sortStock,
		SORT_KEYS,
		type ExpiryLevel,
		type SortKey
	} from '$lib/stock';
	import { ArrowDownUp, ChevronDown, ChevronUp, PackageOpen, ScanLine } from '@lucide/svelte';

	let { data } = $props();

	// Filter and order live in the address (?place=fridge&sort=name&dir=desc), so "back" and
	// bookmarks work
	let place = $derived.by(() => {
		const value = page.url.searchParams.get('place');
		return (LOCATIONS as readonly string[]).includes(value ?? '') ? (value as Location) : null;
	});
	let sort = $derived.by<SortKey>(() => {
		const value = page.url.searchParams.get('sort');
		return isSortKey(value) ? value : 'date';
	});
	let descending = $derived(page.url.searchParams.get('dir') === 'desc');
	// The furniture is drawn for one place of storage, never for "all"
	let scene = $derived(data.scene ? place : null);
	// The choice of the order on phones; closed again once one is picked
	let sortMenu = $state<HTMLDetailsElement>();

	function href(change: { place?: Location | null; sort?: SortKey; descending?: boolean }) {
		const next = { place, sort, descending, ...change };
		const params = new URLSearchParams();
		if (next.place) params.set('place', next.place);
		if (next.sort !== 'date') params.set('sort', next.sort);
		if (next.descending) params.set('dir', 'desc');
		const query = params.toString();
		return query ? `/?${query}` : '/';
	}
	// Tapping the column that already sorts turns the order around
	const sortHref = (key: SortKey) =>
		href({ sort: key, descending: key === sort ? !descending : false });

	let stock = $derived(
		data.stock.map((item) => ({
			...item,
			expiry: expiry(item.bestBefore, data.today, data.soonDays),
			iconKey: item.icon ?? suggestIcon(item.name, item.category ?? 'other')
		}))
	);
	let counts = $derived(
		Object.fromEntries(LOCATIONS.map((l) => [l, stock.filter((i) => i.location === l).length]))
	);
	let shown = $derived(
		sortStock(place ? stock.filter((i) => i.location === place) : stock, sort, descending, m.locale)
	);
	let soon = $derived(shown.filter((i) => i.expiry.level === 'soon').length);
	let expired = $derived(shown.filter((i) => i.expiry.level === 'expired').length);

	const TONE: Record<ExpiryLevel, string> = {
		expired: 'text-danger font-semibold',
		soon: 'text-warn font-semibold',
		fine: '',
		none: ''
	};
	const EDGE: Record<ExpiryLevel, string> = {
		expired: 'border-l-4 border-l-danger',
		soon: 'border-l-4 border-l-warn',
		fine: '',
		none: ''
	};
	const amountText = (item: (typeof stock)[number]) =>
		[
			m.fillLevels[item.fill],
			item.amount !== null && item.unit ? formatAmount(item.amount, item.unit) : ''
		]
			.filter(Boolean)
			.join(' · ');
</script>

<svelte:head><title>{m.home.title} · hdpantry</title></svelte:head>

{#snippet cards(inScene: boolean)}
	<ul class={inScene ? 'grid grid-cols-1' : 'mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:hidden'}>
		{#each shown as item (item.id)}
			{@const Icon = LOCATION_ICONS[item.location]}
			<!-- Inside furniture the level is marked by the drawing itself (data-level, see .scene
			     in layout.css): the coloured edge of a card would cut through shelves and drawers -->
			<li data-level={inScene ? item.expiry.level : undefined}>
				<a
					href="/containers/{item.containerId}"
					class="flex items-center gap-3 p-3 transition-colors {inScene
						? 'hover:bg-black/5'
						: `rounded-xl border border-line bg-surface hover:border-accent ${EDGE[item.expiry.level]}`}"
				>
					<!-- The fill level as a small mark at the symbol: leaves the room on the right
							     to place and amount, which were cut off otherwise -->
					<span class="relative mr-1 shrink-0">
						<FoodIcon icon={item.iconKey} size={36} />
						<span
							class="absolute -right-2.5 -bottom-1.5 rounded-md bg-surface px-px pt-0.5 leading-none"
						>
							<FillGauge level={item.fill} source={item.source} size={19} />
						</span>
					</span>
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
						{#if item.bestBefore && item.expiry.days !== null}
							<!-- Short on cards, so the name keeps its room; the date below says when -->
							<span class={inScene ? 'scene-when' : `block ${TONE[item.expiry.level]}`}>
								{item.expiry.days < 0 ? m.home.expired : m.home.relative(item.expiry.days)}
							</span>
							<span class="block text-xs text-muted">{formatDate(item.bestBefore)}</span>
						{:else}
							<span class="text-muted">–</span>
						{/if}
					</span>
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

{#if data.stock.length === 0}
	<main class="mx-auto flex max-w-md flex-col items-center px-4 pt-16 text-center">
		<PackageOpen size={48} class="text-muted" />
		<h1 class="mt-4 text-xl font-bold">{m.home.empty}</h1>
		<p class="mt-2 text-sm text-muted">{m.home.emptyHint}</p>
		<!-- The first step right where the eye is, not in a corner -->
		<a href="/scan" class="mt-7 flex w-full items-center justify-center gap-2 btn-primary py-4!">
			<ScanLine size={22} />
			{m.home.scan}
		</a>
		<a href="/scan?manual" class="mt-4 text-sm {ui.link} text-muted">{m.scan.other}</a>
	</main>
{:else}
	<main class="mx-auto max-w-screen-xl px-4 py-4">
		<!-- The list explains itself: the heading is only there for screen readers -->
		<h1 class="sr-only">{m.home.title}</h1>

		<!-- Filter by place of storage; scrolls sideways on narrow screens -->
		<nav aria-label={m.home.filter} class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
			{#each [null, ...LOCATIONS] as key (key)}
				{@const Icon = key ? LOCATION_ICONS[key] : null}
				{@const active = key === place}
				<a
					href={href({ place: key })}
					class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors {active
						? 'border-accent bg-accent font-semibold text-on-accent'
						: 'border-line bg-surface hover:border-accent'}"
					aria-current={active ? 'true' : undefined}
					title={key ? m.locations[key] : undefined}
					data-sveltekit-noscroll
				>
					{#if Icon}<Icon size={17} class="shrink-0" />{/if}
					<!-- Narrow phones show only the symbol; the name stays for screen readers -->
					<span class={key ? 'max-sm:sr-only' : ''}>{key ? m.locations[key] : m.home.all}</span>
					<span class={active ? '' : 'text-muted'}>{key ? counts[key] : stock.length}</span>
				</a>
			{/each}
		</nav>

		<div class="mt-3 flex items-center justify-between gap-3">
			<!-- What needs attention, in the colours of the list; without any, just the number -->
			<p class="sr-only">{m.home.summary(shown.length, soon, expired)}</p>
			<div
				class="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-semibold min-[380px]:text-[13px]"
				aria-hidden="true"
			>
				{#if expired}
					<span
						class="flex items-center gap-1.5 rounded-full bg-danger/15 px-2 py-0.5 whitespace-nowrap text-danger"
					>
						<span class="size-1.5 rounded-full bg-danger"></span>{m.home.marks.expired(expired)}
					</span>
				{/if}
				{#if soon}
					<span
						class="flex items-center gap-1.5 rounded-full bg-warn/15 px-2 py-0.5 whitespace-nowrap text-warn"
					>
						<span class="size-1.5 rounded-full bg-warn"></span>{m.home.marks.soon(soon)}
					</span>
				{/if}
				{#if !expired && !soon}
					<span class="text-sm font-normal text-muted">{m.home.summary(shown.length, 0, 0)}</span>
				{/if}
			</div>
			<!-- Phones sort here, with one button that opens the choice; on wide screens the column
			     headings do it -->
			<details bind:this={sortMenu} class="relative shrink-0 text-sm lg:hidden">
				<summary
					class="flex list-none items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-semibold transition-colors hover:border-accent [&::-webkit-details-marker]:hidden"
					aria-label="{m.home.sortBy} {m.home.sortKeys[sort]}"
				>
					{#if descending}<ChevronDown size={14} />{:else}<ChevronUp size={14} />{/if}
					{m.home.sortKeys[sort]}
					<ChevronDown size={14} class="text-muted" />
				</summary>
				<div
					class="absolute right-0 z-20 mt-1 flex min-w-44 flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
				>
					{#each SORT_KEYS as key (key)}
						<a
							href={sortHref(key)}
							class="flex items-center justify-between gap-3 px-3 py-2.5 whitespace-nowrap transition-colors hover:bg-bg {key ===
							sort
								? 'font-semibold'
								: ''}"
							aria-current={key === sort ? 'true' : undefined}
							data-sveltekit-noscroll
							onclick={() => sortMenu?.removeAttribute('open')}
						>
							{m.home.sortKeys[key]}
							{#if key === sort}
								<!-- Tapping the current one turns the order around -->
								<ArrowDownUp size={15} class="shrink-0 text-muted" />
								<span class="sr-only">{m.home.reverse}</span>
							{/if}
						</a>
					{/each}
				</div>
			</details>
		</div>

		{#if scene}
			<!-- The place of storage drawn as furniture around the cards (phones and tablets) -->
			<div class="lg:hidden">
				<StorageScene place={scene}>
					{#if shown.length === 0}
						<p class="px-3 py-6 text-center text-sm text-muted">{m.home.nothingHere}</p>
					{:else}
						{@render cards(true)}
					{/if}
				</StorageScene>
			</div>
		{/if}
		{#if shown.length === 0}
			<p class="mt-8 text-center text-sm text-muted {scene ? 'max-lg:hidden' : ''}">
				{m.home.nothingHere}
			</p>
		{:else}
			{#if !scene}
				<!-- Phones and tablets: cards -->
				{@render cards(false)}
			{/if}

			<!-- Wide screens: a table, sorted by its column headings -->
			<div class="mt-3 hidden overflow-x-auto rounded-xl border border-line bg-surface lg:block">
				<table class="w-full text-left text-sm">
					<thead>
						<tr class="border-b border-line text-muted">
							{#each [['name', m.home.sortKeys.name, false], [null, m.item.category, false], ['location', m.home.sortKeys.location, false], ['date', m.home.sortKeys.date, false], [null, m.home.columns.amount, false], [null, m.item.vacuumed, true], [null, m.home.columns.container, true], [null, m.item.since, true]] as const as [key, label, wideOnly] (label)}
								<th
									class="p-3 font-medium whitespace-nowrap {wideOnly ? 'hidden xl:table-cell' : ''}"
									aria-sort={key === sort ? (descending ? 'descending' : 'ascending') : undefined}
								>
									{#if key}
										<a
											href={sortHref(key)}
											class="inline-flex items-center gap-1 transition-colors hover:text-text {key ===
											sort
												? 'text-text'
												: ''}"
											title={m.home.sortBy + ' ' + label}
											data-sveltekit-noscroll
										>
											{label}
											{#if key === sort}
												{#if descending}<ChevronDown size={14} />{:else}<ChevronUp size={14} />{/if}
											{:else}
												<ArrowDownUp size={12} class="opacity-50" />
											{/if}
										</a>
									{:else}
										{label}
									{/if}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each shown as item (item.id)}
							{@const Icon = LOCATION_ICONS[item.location]}
							<!-- The whole row opens the content; the link on the name is there for keyboards -->
							<tr
								class="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-bg {EDGE[
									item.expiry.level
								]}"
								onclick={(event) => {
									if (!(event.target as HTMLElement).closest('a'))
										goto(`/containers/${item.containerId}`);
								}}
							>
								<th class="p-3 font-semibold">
									<a
										href="/containers/{item.containerId}"
										class="flex items-center gap-3 hover:text-accent"
									>
										<FoodIcon icon={item.iconKey} size={28} />
										<span>
											{item.name}
											{#if item.note}
												<span class="block text-xs font-normal text-muted">{item.note}</span>
											{/if}
										</span>
									</a>
								</th>
								<td class="p-3 text-muted">
									{item.category && item.category !== 'other' ? m.categories[item.category] : '–'}
								</td>
								<td class="p-3 whitespace-nowrap">
									<span class="flex items-center gap-1.5">
										<Icon size={15} class="shrink-0 text-muted" />
										{m.locations[item.location]}
									</span>
								</td>
								<td class="p-3 whitespace-nowrap">
									{#if item.bestBefore && item.expiry.days !== null}
										{formatDate(item.bestBefore)}
										<span class="ml-1 {TONE[item.expiry.level] || 'text-muted'}">
											{m.home.relative(item.expiry.days)}
										</span>
									{:else}
										<span class="text-muted">–</span>
									{/if}
								</td>
								<td class="p-3 whitespace-nowrap">
									<span class="flex items-center gap-2">
										<FillGauge level={item.fill} source={item.source} size={24} />
										{amountText(item)}
									</span>
								</td>
								<!-- The last three columns only where there is room for them -->
								<td class="hidden p-3 xl:table-cell">
									{item.vacuumed ? m.common.yes : m.common.no}
								</td>
								<td class="hidden p-3 whitespace-nowrap text-muted xl:table-cell">
									{codeLabel(item)}
								</td>
								<td class="hidden p-3 whitespace-nowrap text-muted xl:table-cell">
									{formatDate(item.createdAt)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</main>
{/if}
