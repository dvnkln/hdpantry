<script lang="ts">
	import { rating, type Category, type Rating } from '$lib/food/categories';
	import { m } from '$lib/i18n/index.svelte';
	import { LOCATIONS, type Location } from '$lib/items';
	import { LOCATION_ICONS } from '$lib/locations';

	// The four places of storage, tinted by how well each suits the kind of food; unsuitable ones
	// are locked. Sends `location` with the form.
	let {
		category,
		location = $bindable(),
		onchosen,
		lock = true,
		recommend = null
	}: {
		category: Category;
		location: Location;
		// Unsuitable places are locked. Not for bought products: the maker says how they keep
		// (frozen spinach is fine, fresh spinach is not) – there they are only advised against.
		lock?: boolean;
		// A place known to suit this very product (a pack sold frozen: the freezer)
		recommend?: Location | null;
		// The user picked a place (from then on it is not moved for the kind of food)
		onchosen?: () => void;
	} = $props();

	// How a place is shown: without the lock, "never" is only advised against
	const rated = (key: Location): Rating => {
		if (key === recommend) return 'good';
		const value = rating(category, key);
		return value === 'never' && !lock ? 'bad' : value;
	};
	// Patches of the legend under the places, in this order
	const RATING_ORDER: Rating[] = ['good', 'ok', 'bad', 'never'];
	const SWATCH: Record<Rating, string> = {
		good: 'border-good bg-good/25',
		ok: 'border-line bg-surface',
		bad: 'border-caution bg-caution/25',
		never: 'border-dashed border-muted/60 bg-bg'
	};
</script>

<fieldset>
	<legend class="mb-1 text-sm font-medium">{m.item.location}</legend>
	<div class="grid grid-cols-2 gap-2">
		{#each LOCATIONS as key (key)}
			{@const Icon = LOCATION_ICONS[key]}
			{@const r = rated(key)}
			<label
				class="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors has-checked:font-semibold has-checked:ring-2 has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-accent {r ===
				'never'
					? 'cursor-not-allowed border-dashed border-muted/60 bg-bg text-muted/70'
					: r === 'good'
						? 'cursor-pointer border-good bg-good/10 hover:bg-good/20'
						: r === 'bad'
							? 'cursor-pointer border-caution bg-caution/10 hover:bg-caution/20'
							: 'cursor-pointer border-line bg-surface hover:border-accent'}"
				title={category === 'other' ? undefined : m.ratings[r]}
			>
				<input
					type="radio"
					name="location"
					value={key}
					bind:group={location}
					onchange={() => onchosen?.()}
					disabled={r === 'never'}
					class="sr-only"
				/>
				<Icon size={18} class="shrink-0" />
				{m.locations[key]}
				{#if category !== 'other'}<span class="sr-only">({m.ratings[r]})</span>{/if}
			</label>
		{/each}
	</div>
	{#if category !== 'other'}
		<!-- What the colours mean: a small patch per rating that occurs for this kind of food -->
		<ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
			{#each RATING_ORDER.filter((r) => LOCATIONS.some((l) => rated(l) === r)) as shown (shown)}
				<li class="flex items-center gap-1.5">
					<span class="size-3.5 shrink-0 rounded border {SWATCH[shown]}" aria-hidden="true"></span>
					{m.ratings[shown]}
				</li>
			{/each}
		</ul>
	{/if}
</fieldset>
