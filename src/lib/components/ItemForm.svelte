<script lang="ts">
	import { enhance } from '$app/forms';
	import FillGauge from '$lib/components/FillGauge.svelte';
	import type { CodeSource } from '$lib/containers';
	import Switch from '$lib/components/Switch.svelte';
	import { formatDate, m } from '$lib/i18n/index.svelte';
	import {
		FILL_LEVELS,
		LOCATIONS,
		MAX_AMOUNT,
		MAX_ITEM_NAME,
		MAX_ITEM_NOTE,
		UNITS,
		isDate,
		scaleAmount,
		type FillLevel,
		type ItemValues,
		type Unit,
		matchNames
	} from '$lib/items';
	import { bestLocation, rating, type Category } from '$lib/food/categories';
	import FoodKind from '$lib/components/FoodKind.svelte';
	import NameChips from '$lib/components/NameChips.svelte';
	import PlacePicker from '$lib/components/PlacePicker.svelte';
	import { simplify, suggestCategory } from '$lib/food/dictionary';
	import { shelfLife, suggestDate } from '$lib/food/shelfLife';
	import { Info, NotebookPen, Plus } from '@lucide/svelte';
	import StoredSince from '$lib/components/StoredSince.svelte';

	type Template = Omit<ItemValues, 'bestBefore' | 'dateManual' | 'storedOn'> & {
		id: number;
		since: string;
	};
	type Memory = Record<string, { category: Category; icon: string | null }>;

	let {
		initial,
		source = null,
		nameFirst = false,
		today,
		memory = {},
		history = [],
		recent = [],
		submitLabel,
		cancelHref,
		error = '',
		example = 0
	}: {
		// Values the form starts with
		initial: ItemValues;
		// Which example name the empty field shows: a number from 0 up to (not including) 1,
		// drawn by the server so that it is the same when the page is first drawn and in the browser
		example?: number;
		// How the container was recorded – decides how the fill level is drawn
		source?: CodeSource | null;
		// Ask only for the name first; the rest appears after Enter (new content)
		nameFirst?: boolean;
		// Today (YYYY-MM-DD) in the time zone of the server: the day the content went in, unless
		// `initial.storedOn` or the user says otherwise
		today: string;
		// What the user corrected earlier: kind of food and symbol by simplified name
		memory?: Memory;
		// Earlier contents of this container, the latest first: tapping one takes it as a template
		history?: Template[];
		// Names recorded last in the whole stock, the latest first: offered below the name field
		recent?: string[];
		submitLabel: string;
		cancelHref: string;
		error?: string;
	} = $props();

	let exampleName = $derived(
		m.item.nameExamples[Math.floor(example * m.item.nameExamples.length)] ?? m.item.nameExamples[0]
	);

	// svelte-ignore state_referenced_locally
	let step = $state<1 | 2>(nameFirst ? 1 : 2);
	// svelte-ignore state_referenced_locally
	let name = $state(initial.name);
	// Names offered below the field in the first step
	let offered = $derived(matchNames(recent, name));
	// What was in this container before is always in view – the latest three; older entries
	// open on request, so the page stays short for a container that is used a lot
	const HISTORY_SHOWN = 3;
	let allHistory = $state(false);
	// svelte-ignore state_referenced_locally
	let note = $state(initial.note ?? '');
	// svelte-ignore state_referenced_locally
	let amount = $state<number | null>(initial.amount);
	// svelte-ignore state_referenced_locally
	let unit = $state<Unit>(initial.unit ?? 'g');
	// svelte-ignore state_referenced_locally
	let vacuumed = $state(initial.vacuumed);
	// svelte-ignore state_referenced_locally
	let location = $state(initial.location);
	// svelte-ignore state_referenced_locally
	let fillIndex = $state(FILL_LEVELS.indexOf(initial.fill));
	let fill = $derived(FILL_LEVELS[fillIndex]);

	// ---- Kind of food, suitable places, suggested date ----
	// The kind of food is guessed from the name until the user picks one. For content that
	// already has a kind (editing), the stored one stands.
	// svelte-ignore state_referenced_locally
	let category = $state<Category>(initial.category);
	// svelte-ignore state_referenced_locally
	let icon = $state(initial.icon);
	// svelte-ignore state_referenced_locally
	let categoryChosen = $state(!nameFirst && initial.category !== 'other');
	// svelte-ignore state_referenced_locally
	let locationChosen = $state(!nameFirst);
	// svelte-ignore state_referenced_locally
	let dateManual = $state(initial.dateManual);
	// svelte-ignore state_referenced_locally
	let bestBefore = $state(initial.bestBefore ?? '');

	// The day the content went in: suggested dates count from here. Today unless set back –
	// for something that has been in the freezer for a while.
	// svelte-ignore state_referenced_locally
	let since = $state(initial.storedOn ?? today);
	// An emptied or impossible field counts as today
	let from = $derived(isDate(since) && since <= today ? since : today);
	let suggested = $derived(suggestDate(category, location, vacuumed, from));
	let guide = $derived(shelfLife(category, location, vacuumed));
	// The suggested date follows kind of food, place and vacuum – a date typed by hand stays
	$effect(() => {
		if (!dateManual) bestBefore = suggested ?? '';
	});
	let days = $derived(
		bestBefore ? Math.round((Date.parse(bestBefore) - Date.parse(from)) / 86_400_000) : null
	);

	function setCategory(next: Category, byUser: boolean) {
		category = next;
		if (byUser) categoryChosen = true;
		// Move to the best place for it, unless the user chose one that may be used
		// (nothing known about it: the place the form started with, i.e. the one used last)
		if (!locationChosen || rating(next, location) === 'never') {
			location =
				bestLocation(next) ??
				[initial.location, ...LOCATIONS].find((l) => rating(next, l) !== 'never') ??
				location;
		}
	}
	// Called when the name is settled or changes: what was corrected earlier comes first
	function guess() {
		if (categoryChosen) return;
		const known = memory[simplify(name)];
		icon = known?.icon ?? null;
		setCategory(known?.category ?? suggestCategory(name), false);
	}
	// Content recorded before kinds of food existed gets one when it is edited
	// svelte-ignore state_referenced_locally
	if (!nameFirst) guess();

	// The amount follows the slider in thirds, counted from the amount last typed in and the
	// level it was typed at. Typing a new amount makes that the new starting point.
	// svelte-ignore state_referenced_locally
	let typed = $state<{ amount: number; level: FillLevel } | null>(
		initial.amount === null ? null : { amount: initial.amount, level: initial.fill }
	);
	// The amount is optional and stays out of the way: its fields appear on request, or when
	// there already is an amount
	// svelte-ignore state_referenced_locally
	let showAmount = $state(initial.amount !== null);
	// Opened by the button just now: then the cursor goes straight into the field
	let amountOpened = $state(false);

	function onAmountTyped() {
		typed = amount === null || !(amount > 0) ? null : { amount, level: fill };
	}
	function onFillMoved() {
		if (typed) amount = scaleAmount(typed, fill, unit);
	}
	let sending = $state(false);

	// Everything as it was last time, except the date – that has to be new
	function use(template: Template) {
		name = template.name;
		note = template.note ?? '';
		amount = template.amount;
		unit = template.unit ?? 'g';
		showAmount = template.amount !== null;
		vacuumed = template.vacuumed;
		category = template.category;
		icon = template.icon;
		categoryChosen = template.category !== 'other';
		location = template.location;
		locationChosen = true;
		dateManual = false;
		fillIndex = FILL_LEVELS.indexOf(template.fill);
		typed = template.amount === null ? null : { amount: template.amount, level: template.fill };
		guess(); // old entries without a kind of food get one now
		step = 2;
	}
</script>

<form
	method="POST"
	class="flex flex-col gap-5"
	use:enhance={({ cancel }) => {
		// Enter in the name field leads to the second step, not to saving
		if (step === 1) {
			cancel();
			if (name.trim()) {
				guess();
				step = 2;
				// Nothing is focused in the second step, so the phone's keyboard goes away
				(document.activeElement as HTMLElement | null)?.blur();
			}
			return;
		}
		sending = true;
		return async ({ update }) => {
			await update({ reset: false });
			sending = false;
		};
	}}
>
	<div class="flex flex-col gap-1">
		<label for="name" class="text-sm font-medium">{m.item.name}</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			id="name"
			name="name"
			bind:value={name}
			oninput={() => step === 2 && guess()}
			maxlength={MAX_ITEM_NAME}
			placeholder={m.item.namePlaceholder(exampleName)}
			autocomplete="off"
			enterkeyhint={step === 1 ? 'next' : undefined}
			required
			autofocus={nameFirst}
			class={step === 1 ? 'py-4 text-lg' : ''}
		/>
		{#if step === 1}
			<NameChips
				names={offered}
				onpick={(entry) => {
					name = entry;
					guess();
					step = 2;
				}}
			/>
		{/if}
		{#if step === 2}
			<!-- The note: a quiet line right under the name, no frame, no heading – drawn like the
			     other optional lines of the form (small symbol, muted text) -->
			<label class="note-line">
				<NotebookPen size={16} class="shrink-0" />
				<input
					name="note"
					bind:value={note}
					maxlength={MAX_ITEM_NOTE}
					placeholder={m.item.notePlaceholder}
					aria-label={m.item.note}
					autocomplete="off"
				/>
			</label>
		{/if}
	</div>

	{#if step === 1}
		<button class="btn-primary" disabled={!name.trim()}>{m.common.next}</button>

		{#if history.length}
			<section>
				<h2 class="text-sm font-semibold text-muted">{m.item.history}</h2>
				<ul class="mt-2 overflow-hidden rounded-xl border border-line bg-surface">
					{#each allHistory ? history : history.slice(0, HISTORY_SHOWN) as entry (entry.id)}
						<li class="border-b border-line last:border-b-0">
							<button
								type="button"
								class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg"
								onclick={() => use(entry)}
							>
								<span class="min-w-0 flex-1 truncate font-medium">{entry.name}</span>
								<span class="shrink-0 text-sm text-muted">{formatDate(entry.since)}</span>
							</button>
						</li>
					{/each}
				</ul>
				{#if !allHistory && history.length > HISTORY_SHOWN}
					<button type="button" class="mt-1 btn-quiet text-sm" onclick={() => (allHistory = true)}>
						{m.item.moreHistory(history.length - HISTORY_SHOWN)}
					</button>
				{/if}
			</section>
		{/if}
	{:else}
		<FoodKind
			{name}
			{category}
			{icon}
			oncategory={(key) => setCategory(key, true)}
			onicon={(key) => (icon = key)}
		/>

		<div class="flex items-center justify-between gap-4">
			<label for="vacuumed" class="cursor-pointer font-medium">{m.item.vacuumed}</label>
			<Switch id="vacuumed" name="vacuumed" bind:checked={vacuumed} />
		</div>

		<PlacePicker {category} bind:location onchosen={() => (locationChosen = true)} />

		<div class="flex flex-col gap-1">
			<label for="bestBefore" class="flex items-baseline justify-between text-sm font-medium">
				{guide ? m.item.bestBeforeSuggested : m.item.bestBeforeOptional}
				{#if days !== null && days >= 0}<span class="font-normal text-muted"
						>{m.item.days(days)}</span
					>{/if}
			</label>
			<input
				id="bestBefore"
				type="date"
				name="bestBefore"
				bind:value={bestBefore}
				oninput={() => (dateManual = true)}
			/>
			<input type="hidden" name="dateManual" value={dateManual ? '1' : ''} />
			{#if dateManual && suggested && suggested !== bestBefore}
				<button
					type="button"
					class="-ml-2 self-start btn-quiet"
					onclick={() => (dateManual = false)}
				>
					{m.item.useSuggestion} ({formatDate(suggested)})
				</button>
			{/if}
			<!-- Wherever a date is suggested, say what it is worth – one line, right below the field;
			     the extra time for vacuum-sealing is explained on the page of the sources -->
			<p class="flex items-center gap-1 text-xs text-muted">
				{#if guide}
					{m.item.guideHint}
					<!-- The sources behind it: a small sign at the end keeps it to one line -->
					<a
						href="/settings/guide"
						class="-m-1 shrink-0 rounded p-1 transition-colors hover:text-text"
						aria-label={m.item.guideLink}
						title={m.item.guideLink}
					>
						<Info size={14} />
					</a>
				{:else}
					{m.item.noGuide}
				{/if}
			</p>
			<StoredSince {today} bind:since />
		</div>

		<div>
			<label for="fill" class="text-sm font-medium">{m.item.fill}</label>
			<div class="mt-1 flex flex-col items-center">
				<FillGauge level={fill} {source} />
				<span class="mt-1 text-lg font-semibold text-accent">{m.fillLevels[fill]}</span>
			</div>
			<!-- Slider with a mark at each of the three levels -->
			<div class="relative mt-2">
				<div
					class="pointer-events-none absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-between"
					aria-hidden="true"
				>
					{#each FILL_LEVELS as level (level)}
						<span class="h-4 w-0.5 rounded-full bg-muted"></span>
					{/each}
				</div>
				<input
					id="fill"
					type="range"
					min="0"
					max={FILL_LEVELS.length - 1}
					step="1"
					bind:value={fillIndex}
					oninput={onFillMoved}
					aria-valuetext={m.fillLevels[fill]}
					class="relative block w-full accent-accent"
				/>
			</div>
			<input type="hidden" name="fill" value={fill} />
		</div>

		{#if showAmount}
			<div class="flex items-center gap-2">
				<label for="amount" class="text-sm text-muted">{m.item.amount}</label>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					id="amount"
					type="number"
					name="amount"
					bind:value={amount}
					oninput={onAmountTyped}
					min="0"
					max={MAX_AMOUNT}
					step="any"
					inputmode="decimal"
					autofocus={amountOpened}
					class="w-24 amount-field"
				/>
				<select
					name="unit"
					bind:value={unit}
					onchange={onAmountTyped}
					aria-label={m.item.unit}
					class="amount-field"
				>
					{#each UNITS as key (key)}
						<option value={key}>{m.unitNames[key]}</option>
					{/each}
				</select>
			</div>
		{:else}
			<button
				type="button"
				class="-my-2 -ml-2 flex items-center gap-1.5 self-start btn-quiet"
				onclick={() => {
					amountOpened = true;
					showAmount = true;
				}}
			>
				<Plus size={16} />
				{m.item.addAmount}
			</button>
		{/if}

		{#if error}
			<p class="form-error" role="alert">{error}</p>
		{/if}

		<div class="flex gap-2">
			<a href={cancelHref} class="flex-1 btn-secondary text-center">{m.common.cancel}</a>
			<button class="flex-1 btn-primary" disabled={sending || !name.trim()}>{submitLabel}</button>
		</div>
	{/if}
</form>
