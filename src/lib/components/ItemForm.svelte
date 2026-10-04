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
		scaleAmount,
		type FillLevel,
		type ItemValues,
		type Unit
	} from '$lib/items';
	import { LOCATION_ICONS } from '$lib/locations';
	import { Plus } from '@lucide/svelte';

	type Template = Omit<ItemValues, 'bestBefore'> & { id: number; createdAt: string };

	let {
		initial,
		source = null,
		nameFirst = false,
		history = [],
		submitLabel,
		cancelHref,
		error = ''
	}: {
		// Values the form starts with
		initial: ItemValues;
		// How the container was recorded – decides how the fill level is drawn
		source?: CodeSource | null;
		// Ask only for the name first; the rest appears after Enter (new content)
		nameFirst?: boolean;
		// Earlier contents of this container, the latest first: tapping one takes it as a template
		history?: Template[];
		submitLabel: string;
		cancelHref: string;
		error?: string;
	} = $props();

	// svelte-ignore state_referenced_locally
	let step = $state<1 | 2>(nameFirst ? 1 : 2);
	// svelte-ignore state_referenced_locally
	let name = $state(initial.name);
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
		location = template.location;
		fillIndex = FILL_LEVELS.indexOf(template.fill);
		typed = template.amount === null ? null : { amount: template.amount, level: template.fill };
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
			maxlength={MAX_ITEM_NAME}
			placeholder={m.item.namePlaceholder}
			autocomplete="off"
			enterkeyhint={step === 1 ? 'next' : undefined}
			required
			autofocus={nameFirst}
			class={step === 1 ? 'py-4 text-lg' : ''}
		/>
		{#if step === 2}
			<!-- The note: a quiet line right under the name, no frame, no heading -->
			<input
				name="note"
				bind:value={note}
				maxlength={MAX_ITEM_NOTE}
				placeholder={m.item.notePlaceholder}
				aria-label={m.item.note}
				autocomplete="off"
				class="note-line"
			/>
		{/if}
	</div>

	{#if step === 1}
		<button class="btn-primary" disabled={!name.trim()}>{m.common.next}</button>

		{#if history.length}
			<section>
				<h2 class="text-sm font-semibold text-muted">{m.item.history}</h2>
				<ul class="mt-2 overflow-hidden rounded-xl border border-line bg-surface">
					{#each history as entry (entry.id)}
						<li class="border-b border-line last:border-b-0">
							<button
								type="button"
								class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg"
								onclick={() => use(entry)}
							>
								<span class="min-w-0 flex-1 truncate font-medium">{entry.name}</span>
								<span class="shrink-0 text-sm text-muted">{formatDate(entry.createdAt)}</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{:else}
		<Switch name="vacuumed" bind:checked={vacuumed} label={m.item.vacuumed} />

		<fieldset>
			<legend class="mb-1 text-sm font-medium">{m.item.location}</legend>
			<div class="grid grid-cols-2 gap-2">
				{#each LOCATIONS as key (key)}
					{@const Icon = LOCATION_ICONS[key]}
					<label
						class="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface p-3 text-sm transition-colors hover:border-accent has-checked:border-accent has-checked:font-semibold has-checked:text-accent has-focus-visible:outline-2 has-focus-visible:outline-accent"
					>
						<input type="radio" name="location" value={key} bind:group={location} class="sr-only" />
						<Icon size={18} class="shrink-0" />
						{m.locations[key]}
					</label>
				{/each}
			</div>
		</fieldset>

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.item.bestBeforeOptional}</span>
			<input type="date" name="bestBefore" value={initial.bestBefore ?? ''} />
		</label>

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
