<script lang="ts">
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy, tick } from 'svelte';
	import { stockSearch } from '$lib/stockSearch.svelte';
	import FillGauge from '$lib/components/FillGauge.svelte';
	import FoodIcon from '$lib/components/FoodIcon.svelte';
	import PackCount from '$lib/components/PackCount.svelte';
	import StorageScene from '$lib/components/StorageScene.svelte';
	import { codeLabel } from '$lib/containers';
	import { suggestIcon } from '$lib/food/dictionary';
	import { formatAmount, formatDate, formatPackDate, m } from '$lib/i18n/index.svelte';
	import { LOCATIONS, type Location } from '$lib/items';
	import { LOCATION_ICONS } from '$lib/locations';
	import {
		expiry,
		isSortKey,
		matchesSearch,
		ofBrand,
		sortStock,
		SORT_KEYS,
		type ExpiryLevel,
		type SortKey
	} from '$lib/stock';
	import {
		ArrowDownUp,
		ChevronDown,
		ChevronUp,
		Keyboard,
		PackageOpen,
		ScanLine,
		Search,
		Tag,
		X
	} from '@lucide/svelte';

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
	// Only what is expired or expires soon: a tap on its coloured mark (?due=expired|soon)
	type Due = 'expired' | 'soon';
	let due = $derived.by<Due | null>(() => {
		const value = page.url.searchParams.get('due');
		return value === 'expired' || value === 'soon' ? value : null;
	});
	// Only one brand: a tap on its tag on a card (?brand=), tapped again (✕) all again
	let brand = $derived(page.url.searchParams.get('brand')?.trim() || null);
	// The furniture is drawn for one place of storage, never for "all"
	let scene = $derived(data.scene ? place : null);
	// The choice of the order on phones; closed again once one is picked
	let sortMenu = $state<HTMLDetailsElement>();

	// The search, also in the address (?q=): typing narrows the list at once
	// svelte-ignore state_referenced_locally
	let query = $state(page.url.searchParams.get('q') ?? '');
	// Open while the magnifier in the header says so, or while something is searched for
	// svelte-ignore state_referenced_locally
	if (query) stockSearch.open = true;
	let searching = $derived(stockSearch.open);
	// Opened: the cursor goes into the field
	$effect(() => {
		if (stockSearch.open) tick().then(() => searchField?.focus());
	});
	let searchField = $state<HTMLInputElement>();

	function href(change: {
		place?: Location | null;
		due?: Due | null;
		brand?: string | null;
		sort?: SortKey;
		descending?: boolean;
		q?: string;
	}) {
		const next = { place, due, brand, sort, descending, q: query, ...change };
		const params = new URLSearchParams();
		if (next.place) params.set('place', next.place);
		if (next.due) params.set('due', next.due);
		if (next.brand) params.set('brand', next.brand);
		if (next.q.trim()) params.set('q', next.q.trim());
		if (next.sort !== 'date') params.set('sort', next.sort);
		if (next.descending) params.set('dir', 'desc');
		const search = params.toString();
		return search ? `/?${search}` : '/';
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
	// Place, brand and search first: the marks count within them …
	let matching = $derived(
		stock.filter(
			(i) => (!place || i.location === place) && ofBrand(i, brand) && matchesSearch(i, query)
		)
	);
	// Something narrows the list beyond the place: an empty one means "nothing found"
	let narrowed = $derived(!!(query.trim() || due || brand));
	// … and a tapped mark narrows further
	let shown = $derived(
		sortStock(
			due ? matching.filter((i) => i.expiry.level === due) : matching,
			sort,
			descending,
			m.locale
		)
	);
	// Typing changes the address without loading the page again, so "back" still works
	function onSearch() {
		replaceState(href({}), page.state);
	}
	// Leaving the page closes it: coming back shows the whole list
	onDestroy(() => (stockSearch.open = false));
	function closeSearch() {
		query = '';
		stockSearch.open = false;
		replaceState(href({ q: '' }), page.state);
	}
	let soon = $derived(matching.filter((i) => i.expiry.level === 'soon').length);
	let expired = $derived(matching.filter((i) => i.expiry.level === 'expired').length);

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
	type Entry = (typeof stock)[number];
	// How much there is: fill level and amount of a container, the number of packs of a product
	const amountText = (item: Entry) =>
		item.kind === 'product'
			? m.home.packs(item.packs)
			: [
					m.fillLevels[item.fill],
					item.amount !== null && item.unit ? formatAmount(item.amount, item.unit) : ''
				]
					.filter(Boolean)
					.join(' · ');
	// The amount next to the place on cards (a product shows its packs at the symbol)
	const cardAmount = (item: Entry) =>
		item.kind === 'container' && item.amount !== null && item.unit
			? formatAmount(item.amount, item.unit)
			: '';
</script>

<svelte:head><title>{m.home.title} · hdpantry</title></svelte:head>

<!-- The brand of a product as a small tag; a tap shows only this brand, tapped again (✕) all -->
{#snippet brandTag(name: string)}
	{@const active = !!brand && ofBrand({ brand: name }, brand)}
	<a
		href={href({ brand: active ? null : name })}
		aria-current={active ? 'true' : undefined}
		title={active ? m.home.showAll : m.home.brandOnly(name)}
		class="relative z-10 flex min-w-0 items-center gap-1 rounded-full border px-1.5 text-xs leading-[18px] font-normal transition-colors {active
			? 'border-accent text-text'
			: 'border-line text-muted hover:border-accent hover:text-text'}"
		data-sveltekit-noscroll
	>
		{#if active}<X size={12} class="shrink-0" />{:else}<Tag size={12} class="shrink-0" />{/if}
		<span class="truncate">{name}</span>
	</a>
{/snippet}

{#snippet cards(inScene: boolean)}
	<ul class={inScene ? 'grid grid-cols-1' : 'mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:hidden'}>
		{#each shown as item (item.key)}
			{@const Icon = LOCATION_ICONS[item.location]}
			<!-- Inside furniture the level is marked by the drawing itself (data-level, see .scene
			     in layout.css): the coloured edge of a card would cut through shelves and drawers -->
			<li data-level={inScene ? item.expiry.level : undefined}>
				<!-- The name is the link, stretched over the whole card; the brand tag on top of it is
				     a link of its own (links inside links are not allowed) -->
				<div
					class="stock-card relative flex items-center gap-3 p-3 transition-colors {inScene
						? 'hover:bg-black/5'
						: `rounded-xl border border-line bg-surface hover:border-accent has-[a:focus-visible]:border-accent ${EDGE[item.expiry.level]}`}"
				>
					<!-- The fill level as a small mark at the symbol: leaves the room on the right
							     to place and amount, which were cut off otherwise -->
					<span class="relative mr-1 shrink-0">
						<FoodIcon icon={item.iconKey} size={36} />
						{#if item.kind === 'container'}
							<span
								class="absolute -right-2.5 -bottom-1.5 rounded-md bg-surface px-px pt-0.5 leading-none"
							>
								<FillGauge level={item.fill} source={item.source} size={19} />
							</span>
						{:else}
							<!-- A product has no fill level but a number of packs: drawn as a pack where
							     the bag or jar of a container sits -->
							<span
								class="absolute -right-2.5 -bottom-1.5 rounded-md bg-surface p-px leading-none"
								title={m.home.packs(item.packs)}
							>
								<PackCount count={item.packs} shape={item.shape} size={22} />
								<span class="sr-only">{m.home.packs(item.packs)}</span>
							</span>
						{/if}
					</span>
					<span class="min-w-0 flex-1">
						<a
							href={item.href}
							class="block truncate font-semibold outline-none after:absolute after:inset-0 after:rounded-xl"
							>{item.name}</a
						>
						<span class="flex min-h-5 items-center gap-1.5 text-sm text-muted">
							<!-- The place as its symbol only (the filters above use the same ones), its name
							     for screen readers and on hover; behind it the amount of a container or the
							     brand of a product – cut off first when the room runs out -->
							<span class="relative z-10 flex shrink-0" title={m.locations[item.location]}>
								<Icon size={15} />
								<span class="sr-only">{m.locations[item.location]}</span>
							</span>
							{#if cardAmount(item)}<span class="truncate">{cardAmount(item)}</span>{/if}
							{#if item.brand}{@render brandTag(item.brand)}{/if}
						</span>
					</span>
					<span class="shrink-0 text-right text-sm">
						{#if item.bestBefore && item.expiry.days !== null}
							<!-- Short on cards, so the name keeps its room; the date below says when -->
							<span class={inScene ? 'scene-when' : `block ${TONE[item.expiry.level]}`}>
								{item.expiry.days < 0 ? m.home.expired : m.home.relative(item.expiry.days)}
							</span>
							<span class="block text-xs text-muted"
								>{formatPackDate(item.bestBefore, item.dateMonth)}</span
							>
						{:else}
							<span class="text-muted">–</span>
						{/if}
					</span>
				</div>
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
		<div class="mt-7 flex w-full gap-2">
			<a href="/scan" class="flex flex-1 items-center justify-center gap-2 btn-primary py-4!">
				<ScanLine size={22} />
				{m.home.scan}
			</a>
			<a href="/scan?manual" class="flex items-center justify-center gap-1.5 btn-secondary py-4!">
				<Keyboard size={20} />
				{m.home.record}
			</a>
		</div>
	</main>
{:else}
	<main class="mx-auto max-w-screen-xl px-4 py-4">
		<!-- The list explains itself: the heading is only there for screen readers -->
		<h1 class="sr-only">{m.home.title}</h1>

		{#if searching}
			<!-- The search, opened by the magnifier in the header: narrows the list while typing,
			     together with the place of storage -->
			<div class="mb-3 flex items-center gap-2">
				<label
					class="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-accent bg-surface px-2.5 py-1"
				>
					<Search size={16} class="shrink-0 text-muted" />
					<input
						bind:this={searchField}
						bind:value={query}
						oninput={onSearch}
						type="text"
						inputmode="search"
						enterkeyhint="search"
						autocomplete="off"
						placeholder={m.home.search}
						aria-label={m.home.search}
						class="min-w-0 flex-1 border-0 bg-transparent p-0.5 text-sm focus:ring-0 focus:outline-none"
					/>
				</label>
				<button
					type="button"
					class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface transition-colors hover:border-accent"
					aria-label={m.home.searchClose}
					title={m.home.searchClose}
					onclick={closeSearch}
				>
					<X size={17} />
				</button>
			</div>
		{/if}

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
			<p class="sr-only">{m.home.summary(matching.length, soon, expired)}</p>
			<!-- A tap on a mark shows only those; tapped again (✕) everything again. One stays
			     while it is chosen, even with nothing left in it, so it can be taken back. -->
			<div
				class="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-semibold min-[380px]:text-[13px]"
			>
				{#each [{ key: 'expired' as const, n: expired, label: m.home.marks.expired, tone: 'danger' }, { key: 'soon' as const, n: soon, label: m.home.marks.soon, tone: 'warn' }] as mark (mark.key)}
					{#if mark.n || due === mark.key}
						{@const active = due === mark.key}
						<a
							href={href({ due: active ? null : mark.key })}
							aria-current={active ? 'true' : undefined}
							title={active ? m.home.showAll : m.home.showOnly}
							class="flex items-center gap-1.5 rounded-full border px-2 py-0.5 whitespace-nowrap transition-colors {mark.tone ===
							'danger'
								? `text-danger ${active ? 'border-danger bg-danger/25' : 'border-transparent bg-danger/15 hover:border-danger/60'}`
								: `text-warn ${active ? 'border-warn bg-warn/25' : 'border-transparent bg-warn/15 hover:border-warn/60'}`}"
						>
							<!-- Chosen: the ✕ takes the place of the dot, so the line keeps its width -->
							{#if active}
								<X size={12} strokeWidth={3} class="-mx-0.5" />
							{:else}
								<span
									class="size-1.5 rounded-full {mark.tone === 'danger' ? 'bg-danger' : 'bg-warn'}"
								></span>
							{/if}{mark.label(mark.n)}
						</a>
					{/if}
				{/each}
				<!-- The chosen brand, also when none of its cards is in sight (other place, search) -->
				{#if brand}
					<a
						href={href({ brand: null })}
						aria-current="true"
						title={m.home.showAll}
						class="flex min-w-0 items-center gap-1 rounded-full border border-accent px-2 py-0.5 font-normal transition-colors hover:bg-surface"
					>
						<X size={12} strokeWidth={3} class="shrink-0" /><Tag size={12} class="shrink-0" />
						<span class="truncate">{brand}</span>
					</a>
				{/if}
				{#if !expired && !soon && !due}
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
						<p class="px-3 py-6 text-center text-sm text-muted">
							{narrowed ? m.home.nothingFound : m.home.nothingHere}
						</p>
					{:else}
						{@render cards(true)}
					{/if}
				</StorageScene>
			</div>
		{/if}
		{#if shown.length === 0}
			<p class="mt-8 text-center text-sm text-muted {scene ? 'max-lg:hidden' : ''}">
				{narrowed ? m.home.nothingFound : m.home.nothingHere}
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
						{#each shown as item (item.key)}
							{@const Icon = LOCATION_ICONS[item.location]}
							<!-- The whole row opens the content; the link on the name is there for keyboards -->
							<tr
								class="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-bg {EDGE[
									item.expiry.level
								]}"
								onclick={(event) => {
									if (!(event.target as HTMLElement).closest('a')) goto(item.href);
								}}
							>
								<th class="p-3 font-semibold">
									<span class="flex items-center gap-3">
										<FoodIcon icon={item.iconKey} size={28} />
										<span class="min-w-0">
											<a href={item.href} class="hover:text-accent">{item.name}</a>
											{#if item.brand || item.note}
												<span
													class="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-muted"
												>
													{#if item.brand}{@render brandTag(item.brand)}{/if}
													{#if item.note}<span class="truncate">{item.note}</span>{/if}
												</span>
											{/if}
										</span>
									</span>
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
										{formatPackDate(item.bestBefore, item.dateMonth)}
										<span class="ml-1 {TONE[item.expiry.level] || 'text-muted'}">
											{m.home.relative(item.expiry.days)}
										</span>
									{:else}
										<span class="text-muted">–</span>
									{/if}
								</td>
								<td class="p-3 whitespace-nowrap">
									<span class="flex items-center gap-2">
										{#if item.kind === 'container'}
											<FillGauge level={item.fill} source={item.source} size={24} />
										{:else}
											<PackCount count={item.packs} shape={item.shape} size={24} />
										{/if}
										{amountText(item)}
									</span>
								</td>
								<!-- The last three columns only where there is room for them -->
								<td class="hidden p-3 xl:table-cell">
									{item.kind === 'product' ? '–' : item.vacuumed ? m.common.yes : m.common.no}
								</td>
								<td class="hidden p-3 whitespace-nowrap text-muted xl:table-cell">
									{item.kind === 'product' ? m.products.product : codeLabel(item)}
								</td>
								<td class="hidden p-3 whitespace-nowrap text-muted xl:table-cell">
									{formatDate(item.since)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</main>
{/if}
