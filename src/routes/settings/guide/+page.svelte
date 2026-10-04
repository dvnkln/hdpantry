<script lang="ts">
	import { CATEGORIES, RATINGS } from '$lib/food/categories';
	import { SHELF_LIFE, SOURCES, type SourceKey } from '$lib/food/shelfLife';
	import { m } from '$lib/i18n/index.svelte';
	import { LOCATIONS } from '$lib/items';
	import { TriangleAlert } from '@lucide/svelte';

	// Sources get a number in the order of their list; the table refers to them by it
	const keys = Object.keys(SOURCES) as SourceKey[];
	const number = (key: SourceKey) => keys.indexOf(key) + 1;
	const kinds = CATEGORIES.filter((category) => category !== 'other');
	// The two estimates of our own are described in the language of the interface
	const label = (key: SourceKey) =>
		key === 'est' ? m.guide.ownEstimate : key === 'vac' ? m.guide.ownVacuum : SOURCES[key].name;
</script>

<svelte:head><title>{m.guide.title} · hdpantry</title></svelte:head>

<h1 class="text-lg font-semibold">{m.guide.title}</h1>

<p class="mt-4 notice" role="note">
	<TriangleAlert size={18} class="mt-0.5 shrink-0" />
	{m.guide.warning}
</p>

<h2 class="mt-8 font-semibold">{m.guide.how}</h2>
<ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
	{#each m.guide.howText as line (line)}<li>{line}</li>{/each}
</ul>

<h2 class="mt-8 font-semibold">{m.guide.table}</h2>
<p class="mt-1 text-sm text-muted">{m.guide.tableHint}</p>
<div class="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
	<table class="w-full min-w-[40rem] text-left text-sm">
		<thead>
			<tr class="border-b border-line text-muted">
				<th class="p-2 font-medium">{m.guide.food}</th>
				{#each LOCATIONS as location (location)}
					<th class="p-2 font-medium">{m.locations[location]}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each kinds as category (category)}
				<tr class="border-b border-line align-top last:border-b-0">
					<th class="p-2 font-medium">
						{m.categories[category]}
						<span class="block text-xs font-normal text-muted">{m.categoryExamples[category]}</span>
					</th>
					{#each LOCATIONS as location (location)}
						{@const row = SHELF_LIFE[category][location]}
						{@const rated = RATINGS[category][location]}
						<td
							class="p-2 whitespace-nowrap {rated === 'good'
								? 'text-good'
								: rated === 'bad'
									? 'text-caution'
									: ''}"
							title={m.ratings[rated]}
						>
							{#if row.open && row.vacuum}
								{row.open.days}<sup>{number(row.open.source)}</sup> / {row.vacuum.days}<sup
									>{number(row.vacuum.source)}</sup
								>
							{:else}
								–
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
	<li class="flex items-center gap-1.5">
		<span class="size-3.5 rounded border border-good bg-good/25" aria-hidden="true"></span>
		{m.ratings.good}
	</li>
	<li class="flex items-center gap-1.5">
		<span class="size-3.5 rounded border border-line bg-surface" aria-hidden="true"></span>
		{m.ratings.ok}
	</li>
	<li class="flex items-center gap-1.5">
		<span class="size-3.5 rounded border border-caution bg-caution/25" aria-hidden="true"></span>
		{m.ratings.bad}
	</li>
	<li class="flex items-center gap-1.5">– {m.ratings.never}</li>
</ul>

<h2 class="mt-8 font-semibold">{m.guide.sources}</h2>
<ol class="mt-2 list-decimal space-y-1 pl-5 text-sm">
	{#each keys as key (key)}
		<li>
			{label(key)}
			{#if SOURCES[key].url}
				<!-- A link the reader may follow; hdpantry itself never contacts these sites -->
				<a
					href={SOURCES[key].url}
					target="_blank"
					rel="noopener noreferrer"
					class="block text-xs break-all text-muted underline hover:text-text"
				>
					{SOURCES[key].url}
				</a>
			{/if}
		</li>
	{/each}
</ol>

<h2 class="mt-8 font-semibold">{m.guide.symbols}</h2>
<p class="mt-2 text-sm">{m.guide.symbolsText}</p>
