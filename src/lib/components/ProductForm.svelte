<script lang="ts">
	import { enhance } from '$app/forms';
	import FoodKind from '$lib/components/FoodKind.svelte';
	import NameChips from '$lib/components/NameChips.svelte';
	import PackDate from '$lib/components/PackDate.svelte';
	import PackGroups from '$lib/components/PackGroups.svelte';
	import PlacePicker from '$lib/components/PlacePicker.svelte';
	import ShapePicker from '$lib/components/ShapePicker.svelte';
	import StoredSince from '$lib/components/StoredSince.svelte';
	import { bestLocation, rating, type Category } from '$lib/food/categories';
	import { onMount } from 'svelte';
	import { simplify } from '$lib/food/dictionary';
	import { m } from '$lib/i18n/index.svelte';
	import { LOCATIONS, MAX_ITEM_NAME, MAX_ITEM_NOTE, matchNames, type Location } from '$lib/items';
	import {
		MAX_PACKS,
		kindOf,
		looksFrozen,
		suggestShape,
		type Lookup,
		type PackGroup,
		type PackShape
	} from '$lib/products';
	import { Minus, NotebookPen, Plus } from '@lucide/svelte';

	type Memory = Record<string, { category: Category; icon: string | null }>;

	// One form for products: `new` – name first, then kind of food, place, date and number of
	// packs; `pack` – more packs of a known product (place, date, number); `edit` – name and kind
	// of food of a product.
	let {
		mode,
		today,
		name: initialName = '',
		category: initialCategory = 'other',
		icon: initialIcon = null,
		location: initialLocation = 'freezer',
		memory = {},
		recent = [],
		example = 0,
		groups = [],
		soonDays = 3,
		found = null,
		fromDatabase = false,
		lookupOff = false,
		note: initialNote = null,
		shape: initialShape = null,
		submitLabel,
		cancelHref,
		error = ''
	}: {
		mode: 'new' | 'pack' | 'edit';
		today: string;
		name?: string;
		category?: Category;
		icon?: string | null;
		location?: Location;
		memory?: Memory;
		// Names recorded last, offered below the name field
		recent?: string[];
		example?: number;
		// Under "edit": the packs in stock, to correct
		groups?: PackGroup[];
		soonDays?: number;
		// What the product database says about the scanned barcode (see lookup.ts), and whether
		// the name the form starts with came from it
		found?: Lookup | null;
		fromDatabase?: boolean;
		note?: string | null;
		// How it is packed; none yet: suggested from what is known
		shape?: PackShape | null;
		// It may not be asked (switched off): say once that it could be
		lookupOff?: boolean;
		submitLabel: string;
		cancelHref: string;
		error?: string;
	} = $props();

	let exampleName = $derived(
		m.item.nameExamples[Math.floor(example * m.item.nameExamples.length)] ?? m.item.nameExamples[0]
	);

	// A new product asks for its name first, unless it came with one (typed in the search)
	// svelte-ignore state_referenced_locally
	let step = $state<1 | 2>(mode === 'new' && !initialName ? 1 : 2);
	// svelte-ignore state_referenced_locally
	let name = $state(initialName);
	let offered = $derived(matchNames(recent, name));
	// svelte-ignore state_referenced_locally
	let category = $state<Category>(initialCategory);
	// svelte-ignore state_referenced_locally
	let icon = $state<string | null>(initialIcon);
	// svelte-ignore state_referenced_locally
	let categoryChosen = $state(mode !== 'new');
	// svelte-ignore state_referenced_locally
	let location = $state<Location>(initialLocation);
	// svelte-ignore state_referenced_locally
	let locationChosen = $state(mode === 'pack');
	let count = $state(1);
	// svelte-ignore state_referenced_locally
	let shape = $state<PackShape>(initialShape ?? 'box');
	// svelte-ignore state_referenced_locally
	let shapeChosen = $state(initialShape !== null);
	// svelte-ignore state_referenced_locally
	let since = $state(today);
	// Under "edit": all packs lie at one place – then the place is chosen once for all of them
	// svelte-ignore state_referenced_locally
	const onePlace = groups.length > 0 && groups.every((g) => g.location === groups[0].location);
	// svelte-ignore state_referenced_locally
	if (onePlace) location = groups[0].location;
	let sending = $state(false);

	// svelte-ignore state_referenced_locally
	let note = $state(initialNote ?? '');
	// The name the form started with, if it came from the product database
	// svelte-ignore state_referenced_locally
	const suggested = fromDatabase ? initialName : '';
	// Sold frozen (the database says so, or the name: "TK-Spinat"): the freezer is the place
	let frozen = $derived(!!found?.frozen || looksFrozen(name));

	// Once per device: the name could be looked up, if switched on in the settings
	let offerLookup = $state(false);
	onMount(() => {
		if (!lookupOff) return;
		try {
			offerLookup = !localStorage.getItem('hdpantry_lookup_offered');
			localStorage.setItem('hdpantry_lookup_offered', '1');
		} catch {
			// no storage: it is only a hint
		}
	});

	// The packaging follows what is known until it is picked by hand
	function suggestPack() {
		if (!shapeChosen)
			shape = suggestShape(name, found?.hints ?? [], category, found?.shape ?? null);
	}

	function setCategory(next: Category, byUser: boolean) {
		category = next;
		if (byUser) categoryChosen = true;
		if (byUser) suggestPack();
		// A place chosen by hand stays: for products no place is locked (see PlacePicker)
		if (!locationChosen) {
			location =
				bestLocation(next) ??
				[initialLocation, ...LOCATIONS].find((l) => rating(next, l) !== 'never') ??
				location;
		}
	}
	// What was corrected earlier for this name comes first, else the dictionary – with what the
	// product database says about it when the name itself tells nothing (often a brand)
	function guess() {
		if (categoryChosen) return;
		const known = memory[simplify(name)];
		const kind = known ?? kindOf(name, found?.hints ?? []);
		icon = kind.icon ?? null;
		setCategory(kind.category, false);
		if (frozen && !locationChosen) location = 'freezer';
		suggestPack();
	}
	// svelte-ignore state_referenced_locally
	if (mode === 'new' && step === 2) guess();
	// A product recorded before packagings existed gets one suggested
	// svelte-ignore state_referenced_locally
	if (mode === 'edit' && !initialShape) suggestPack();

	function next() {
		if (!name.trim()) return;
		guess();
		step = 2;
		// Nothing is focused in the second step, so the phone's keyboard goes away
		(document.activeElement as HTMLElement | null)?.blur();
	}
</script>

<form
	method="POST"
	class="flex flex-col gap-5"
	use:enhance={({ cancel }) => {
		// Enter in the name field leads to the second step, not to saving
		if (step === 1) {
			cancel();
			next();
			return;
		}
		sending = true;
		return async ({ update }) => {
			await update({ reset: false });
			sending = false;
		};
	}}
>
	{#if mode !== 'pack'}
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
				autofocus={step === 1}
				class={step === 1 ? 'py-4 text-lg' : ''}
			/>
			{#if suggested && name === suggested}
				<!-- Where the name came from; it can be changed like any other -->
				<p class="text-xs text-muted">{m.products.fromDatabase}</p>
			{:else if offerLookup && step === 1}
				<p class="text-xs text-muted">
					{m.products.lookupOffer}
					<a href="/settings/products" class="underline hover:text-text">{m.products.lookupLink}</a>
				</p>
			{/if}
			{#if step === 2}
				<!-- The note: a quiet line right under the name, as for the content of a container -->
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
			{#if step === 1}
				<NameChips
					names={offered}
					onpick={(entry) => {
						name = entry;
						next();
					}}
				/>
			{/if}
		</div>
	{/if}

	{#if step === 1}
		<button class="btn-primary" disabled={!name.trim()}>{m.common.next}</button>
	{:else}
		{#if mode !== 'pack'}
			<FoodKind
				{name}
				{category}
				{icon}
				oncategory={(key) => setCategory(key, true)}
				onicon={(key) => (icon = key)}
			/>
			<ShapePicker
				{shape}
				count={mode === 'edit'
					? Math.max(
							1,
							groups.reduce((n, g) => n + g.count, 0)
						)
					: count}
				onpick={(key) => {
					shape = key;
					shapeChosen = true;
				}}
			/>
		{/if}

		{#if mode === 'edit' && onePlace}
			<!-- All packs at one place: chosen as for a container; moving it moves them all -->
			<PlacePicker {category} bind:location lock={false} recommend={frozen ? 'freezer' : null} />
		{/if}
		{#if mode === 'edit' && groups.length}
			<PackGroups {groups} {today} {soonDays} place={onePlace ? location : null} />
		{/if}

		{#if mode !== 'edit'}
			<PlacePicker
				{category}
				bind:location
				onchosen={() => (locationChosen = true)}
				lock={false}
				recommend={frozen ? 'freezer' : null}
			/>

			<div class="flex flex-col gap-1">
				<PackDate {today} />
				<StoredSince {today} bind:since />
				<p class="text-xs text-muted">{m.products.dateHint}</p>
			</div>

			<div class="flex items-center justify-between gap-4">
				<span class="font-medium" id="pack-count">{m.products.count}</span>
				<div class="flex items-center gap-1" role="group" aria-labelledby="pack-count">
					<button
						type="button"
						class="flex size-10 items-center justify-center rounded-lg border border-line bg-surface transition-colors hover:border-accent disabled:opacity-40"
						aria-label={m.products.fewer}
						disabled={count <= 1}
						onclick={() => (count = Math.max(1, count - 1))}
					>
						<Minus size={18} />
					</button>
					<span class="w-10 text-center text-lg font-semibold tabular-nums" aria-live="polite"
						>{count}</span
					>
					<button
						type="button"
						class="flex size-10 items-center justify-center rounded-lg border border-line bg-surface transition-colors hover:border-accent disabled:opacity-40"
						aria-label={m.products.more}
						disabled={count >= MAX_PACKS}
						onclick={() => (count = Math.min(MAX_PACKS, count + 1))}
					>
						<Plus size={18} />
					</button>
				</div>
				<input type="hidden" name="count" value={count} />
			</div>
		{/if}

		{#if error}
			<p class="form-error" role="alert">{error}</p>
		{/if}

		<div class="flex gap-2">
			<a href={cancelHref} class="flex-1 btn-secondary text-center">{m.common.cancel}</a>
			<button class="flex-1 btn-primary" disabled={sending || (mode !== 'pack' && !name.trim())}
				>{submitLabel}</button
			>
		</div>
	{/if}
</form>
