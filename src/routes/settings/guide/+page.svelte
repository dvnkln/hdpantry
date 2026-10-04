<script lang="ts">
	import { CATEGORIES, RATINGS } from '$lib/food/categories';
	import { SHELF_LIFE, SOURCES, type SourceKey } from '$lib/food/shelfLife';
	import { m } from '$lib/i18n/index.svelte';
	import { LOCATIONS } from '$lib/items';
	import { ArrowLeft, TriangleAlert } from '@lucide/svelte';

	// Sources get a number in the order of their list; the table refers to them by it
	const keys = Object.keys(SOURCES) as SourceKey[];
	const number = (key: SourceKey) => keys.indexOf(key) + 1;
	const kinds = CATEGORIES.filter((category) => category !== 'other');
	// The two estimates of our own are described in the language of the interface
	const label = (key: SourceKey) =>
		key === 'est' ? m.guide.ownEstimate : key === 'vac' ? m.guide.ownVacuum : SOURCES[key].name;
</script>

<svelte:head><title>{m.guide.title} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-screen-lg px-4 py-6">
	<a href="/settings" class="-ml-2 inline-flex items-center gap-1.5 btn-quiet">
		<ArrowLeft size={16} />
		{m.guide.back}
	</a>
	<h1 class="mt-2 text-xl font-bold">{m.guide.title}</h1>

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
							<span class="block text-xs font-normal text-muted"
								>{m.categoryExamples[category]}</span
							>
						</th>
						{#each LOCATIONS as location (location)}
							{@const row = SHELF_LIFE[category][location]}
							{@const rated = RATINGS[category][location]}
							<td
								class="p-2 whitespace-nowrap {rated === 'good'
									? 'text-good'
									: rated === 'bad'
										? 'text-danger'
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
	<p class="mt-2 text-xs text-muted">{m.item.locationLegend}</p>

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
</main>
