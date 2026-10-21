<script lang="ts">
	import { m, monthNames } from '$lib/i18n/index.svelte';
	import { daysUntil } from '$lib/stock';
	import { endOfMonth } from '$lib/products';

	// The best-before date printed on a pack: day, month and year side by side. Most packs of
	// frozen food give month and year only, so the day may stay at "–"; no month = no date
	// (bread from the baker has none – the month set back to "Month" takes it away again). The
	// year starts at the current one. Sent as `name` (if given) and handed out as `value`:
	// "YYYY-MM" or "YYYY-MM-DD", empty = no date.
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
	let year = $state(initial ? Number(initial.slice(0, 4)) : Number(today.slice(0, 4)));
	// The year was chosen (or came with the date): then a month never moves it
	// svelte-ignore state_referenced_locally
	let yearChosen = $state(!!initial);
	// svelte-ignore state_referenced_locally
	let day = $state(initial && !monthOnly ? Number(initial.slice(8, 10)) : 0);

	const two = (n: number) => String(n).padStart(2, '0');
	// Days the chosen month has
	let days = $derived(month && year ? Number(endOfMonth(`${year}-${two(month)}`).slice(8)) : 31);
	// A day the chosen month does not have (31 in April) becomes its last one – also in the field
	$effect(() => {
		if (day > days) day = days;
	});
	$effect(() => {
		value = !month ? '' : day ? `${year}-${two(month)}-${two(day)}` : `${year}-${two(month)}`;
	});

	// Until the year is chosen, a month goes into the next year it comes round in: March picked
	// in October means next March
	function onMonth() {
		if (month && !yearChosen) year = month >= thisMonth ? thisYear : thisYear + 1;
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
		<select bind:value={day} aria-label={m.products.day} class="w-18 shrink-0">
			<option value={0}>–</option>
			{#each Array.from({ length: days }, (_, i) => i + 1) as d (d)}
				<option value={d}>{two(d)}</option>
			{/each}
		</select>
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
		<select
			bind:value={year}
			onchange={() => (yearChosen = true)}
			aria-label={m.products.year}
			class="w-24 shrink-0"
		>
			{#each years as y (y)}
				<option value={y}>{y}</option>
			{/each}
		</select>
	</div>
	{#if name}<input type="hidden" {name} {value} />{/if}
</div>
