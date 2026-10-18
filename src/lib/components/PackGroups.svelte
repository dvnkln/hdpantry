<script lang="ts">
	import PackDate from '$lib/components/PackDate.svelte';
	import { formatPackDate, m } from '$lib/i18n/index.svelte';
	import { LOCATIONS, type Location } from '$lib/items';
	import { LOCATION_ICONS } from '$lib/locations';
	import { MAX_PACKS, endOfMonth, type PackGroup } from '$lib/products';
	import { expiry, type ExpiryLevel } from '$lib/stock';
	import { Minus, Plus } from '@lucide/svelte';

	// The packs in stock under "edit": grouped by date and place, each group with its number
	// (0 = they go), and date and place to correct on request. Sent as JSON in `packs`.
	let {
		groups,
		today,
		soonDays,
		place = null
	}: {
		groups: PackGroup[];
		today: string;
		// "Expires soon" means within this many days (the colours of the list)
		soonDays: number;
		// All packs at one place, chosen above for all of them: then the groups have no place of
		// their own to choose
		place?: Location | null;
	} = $props();

	// svelte-ignore state_referenced_locally
	let rows = $state(
		groups.map((group) => ({
			...group,
			// What the date field hands out: "YYYY-MM", "YYYY-MM-DD" or empty
			date: group.bestBefore
				? group.dateMonth
					? group.bestBefore.slice(0, 7)
					: group.bestBefore
				: '',
			open: false
		}))
	);
	let sent = $derived(
		JSON.stringify(
			rows.map((row) => ({
				ids: row.ids,
				count: row.count,
				bestBefore: row.date,
				location: place ?? row.location
			}))
		)
	);
	// How a group reads, as in the list: how long it still keeps (in its colour), and below it
	// the date – as chosen so far
	const TONE: Record<ExpiryLevel, string> = {
		expired: 'text-danger',
		soon: 'text-warn',
		fine: '',
		none: 'text-muted'
	};
	const when = (date: string) => {
		const day = date.length === 7 ? endOfMonth(date) : date;
		const due = expiry(day || null, today, soonDays);
		return {
			tone: TONE[due.level],
			main: due.days === null ? m.item.noDate : m.home.relative(due.days),
			line: date ? m.products.packLine(formatPackDate(day, date.length === 7), null) : ''
		};
	};
	const stepper =
		'flex size-9 items-center justify-center rounded-lg border border-line bg-surface transition-colors hover:border-accent disabled:opacity-40';
</script>

<section>
	<h2 class="mb-1 text-sm font-medium">{m.products.packs}</h2>
	<ul class="overflow-hidden rounded-xl border border-line bg-surface">
		{#each rows as row, i (row.ids.join())}
			{@const Icon = LOCATION_ICONS[place ?? row.location]}
			{@const w = when(row.date)}
			<li class="border-b border-line px-3 py-2 last:border-b-0">
				<div class="flex items-center gap-2">
					<!-- Tapping date and place opens them for correcting -->
					<button
						type="button"
						class="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left transition-colors hover:text-accent {row.count ===
						0
							? 'text-muted line-through'
							: ''}"
						aria-expanded={row.open}
						onclick={() => (row.open = !row.open)}
					>
						<Icon size={16} class="shrink-0 text-muted" />
						<span class="min-w-0">
							<span
								class="block font-semibold underline decoration-line decoration-dotted underline-offset-4 {w.tone}"
								>{w.main}</span
							>
							{#if w.line}<span class="block truncate text-xs text-muted">{w.line}</span>{/if}
						</span>
					</button>
					<button
						type="button"
						class={stepper}
						aria-label={m.products.fewer}
						disabled={row.count <= 0}
						onclick={() => (row.count = Math.max(0, row.count - 1))}
					>
						<Minus size={16} />
					</button>
					<span class="w-7 text-center font-semibold tabular-nums" aria-live="polite"
						>{row.count}</span
					>
					<button
						type="button"
						class={stepper}
						aria-label={m.products.more}
						disabled={row.count >= MAX_PACKS}
						onclick={() => (row.count = Math.min(MAX_PACKS, row.count + 1))}
					>
						<Plus size={16} />
					</button>
				</div>
				{#if row.count === 0}
					<p class="mt-1 text-xs text-muted">{m.products.goes(groups[i].count)}</p>
				{/if}
				{#if row.open}
					<div class="mt-2 flex flex-col gap-2">
						<PackDate
							{today}
							initial={groups[i].bestBefore}
							monthOnly={groups[i].dateMonth || !groups[i].bestBefore}
							name=""
							label={false}
							bind:value={row.date}
						/>
						{#if !place}
							<select bind:value={row.location} aria-label={m.item.location}>
								{#each LOCATIONS as key (key)}
									<option value={key}>{m.locations[key]}</option>
								{/each}
							</select>
						{/if}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
	<input type="hidden" name="packs" value={sent} />
</section>
