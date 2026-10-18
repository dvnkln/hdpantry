<script lang="ts">
	import { m, monthNames } from '$lib/i18n/index.svelte';
	import { daysUntil } from '$lib/stock';
	import { endOfMonth } from '$lib/products';
	import { Plus, X } from '@lucide/svelte';

	// The best-before date printed on a pack: month and year (that is how most packs of frozen
	// food give it), the day only if it is printed too. Sent as `name` (if given) and handed out
	// as `value`: "YYYY-MM" or "YYYY-MM-DD", empty = no date.
	let {
		today,
		initial = null,
		monthOnly = true,
		name = 'bestBefore',
		label = true,
		value = $bindable('')
	}: {
		// YYYY-MM-DD, for the years offered and the year a month is put in
		today: string;
		// The date the form starts with (YYYY-MM-DD), and whether only its month counts
		initial?: string | null;
		monthOnly?: boolean;
		// The form field it is sent as; empty: not sent (the caller takes `value`)
		name?: string;
		// Show the heading above the fields
		label?: boolean;
		value?: string;
	} = $props();

	let thisYear = $derived(Number(today.slice(0, 4)));
	let thisMonth = $derived(Number(today.slice(5, 7)));
	// Last year too: something bought a while ago may be past its date already
	// … and the year of the date the field starts with, however far off (a pack long expired)
	let years = $derived(
		[
			...new Set([
				...(initial ? [Number(initial.slice(0, 4))] : []),
				...Array.from({ length: 8 }, (_, i) => thisYear - 1 + i)
			])
		].sort((a, b) => a - b)
	);
	const names = monthNames();

	// svelte-ignore state_referenced_locally
	let month = $state(initial ? Number(initial.slice(5, 7)) : 0);
	// svelte-ignore state_referenced_locally
	let year = $state(initial ? Number(initial.slice(0, 4)) : 0);
	// svelte-ignore state_referenced_locally
	let withDay = $state(!!initial && !monthOnly);
	// svelte-ignore state_referenced_locally
	let day = $state(initial && !monthOnly ? Number(initial.slice(8, 10)) : 0);

	const two = (n: number) => String(n).padStart(2, '0');
	// Days the chosen month has
	let days = $derived(month && year ? Number(endOfMonth(`${year}-${two(month)}`).slice(8)) : 31);
	$effect(() => {
		value =
			!month || !year
				? ''
				: withDay && day
					? `${year}-${two(month)}-${two(Math.min(day, days))}`
					: `${year}-${two(month)}`;
	});

	// A month picked first goes into the next year it comes round in: March picked in October
	// means next March
	function onMonth() {
		if (month && !year) year = month >= thisMonth ? thisYear : thisYear + 1;
	}
	function clear() {
		month = 0;
		year = 0;
		day = 0;
		withDay = false;
	}
</script>

<div class="flex flex-col gap-1">
	{#if label}
		<!-- As for containers: the heading, and how far away the chosen date is -->
		<span class="flex items-baseline justify-between text-sm font-medium">
			{m.item.bestBefore}
			{#if value}
				<span class="font-normal text-muted">
					{m.home.relative(daysUntil(value.length === 7 ? endOfMonth(value) : value, today))}
				</span>
			{/if}
		</span>
	{/if}
	<div class="flex gap-2" role="group" aria-label={m.item.bestBefore}>
		{#if withDay}
			<select bind:value={day} aria-label={m.products.day} class="w-20">
				<option value={0}>–</option>
				{#each Array.from({ length: days }, (_, i) => i + 1) as d (d)}
					<option value={d}>{two(d)}</option>
				{/each}
			</select>
		{/if}
		<select
			bind:value={month}
			onchange={onMonth}
			aria-label={m.products.month}
			class="min-w-0 flex-1"
		>
			<option value={0}>{m.products.monthNone}</option>
			{#each names as name, i (i)}
				<option value={i + 1}>{two(i + 1)} · {name}</option>
			{/each}
		</select>
		<select bind:value={year} aria-label={m.products.year} class="w-24">
			<option value={0}>–</option>
			{#each years as y (y)}
				<option value={y}>{y}</option>
			{/each}
		</select>
	</div>
	{#if name}<input type="hidden" {name} {value} />{/if}
	<div class="-ml-2 flex items-center gap-1 self-start">
		{#if !withDay}
			<button
				type="button"
				class="flex items-center gap-1.5 btn-quiet"
				onclick={() => (withDay = true)}
			>
				<Plus size={16} />
				{m.products.addDay}
			</button>
		{/if}
		{#if month || year}
			<button type="button" class="flex items-center gap-1.5 btn-quiet" onclick={clear}>
				<X size={16} />
				{m.products.noDate}
			</button>
		{/if}
	</div>
</div>
