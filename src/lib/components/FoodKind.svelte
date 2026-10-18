<script lang="ts">
	import FoodIcon from '$lib/components/FoodIcon.svelte';
	import { CATEGORIES, type Category } from '$lib/food/categories';
	import { suggestIcon } from '$lib/food/dictionary';
	import { ICONS } from '$lib/food/icons';
	import { m } from '$lib/i18n/index.svelte';
	import { ChevronDown } from '@lucide/svelte';

	// Symbol and kind of food of a content or product: suggested from the name, one tap to change
	// either. Sends both with the form (`category`, `icon`).
	let {
		name,
		category,
		icon,
		oncategory,
		onicon
	}: {
		name: string;
		category: Category;
		// Picked by hand; null = what name and kind of food suggest
		icon: string | null;
		oncategory: (category: Category) => void;
		onicon: (icon: string | null) => void;
	} = $props();

	let choosing = $state(false);
	let pickingIcon = $state(false);
	// The symbol shown: the one picked by hand, else what name and kind of food suggest
	let shownIcon = $derived(icon ?? suggestIcon(name, category));
</script>

<div>
	<div class="flex gap-2">
		<button
			type="button"
			class="flex shrink-0 items-center justify-center rounded-lg border border-line bg-surface p-2 transition-colors hover:border-accent"
			aria-label={m.item.chooseIcon}
			title={m.item.chooseIcon}
			aria-expanded={pickingIcon}
			onclick={() => {
				pickingIcon = !pickingIcon;
				choosing = false;
			}}
		>
			<FoodIcon icon={shownIcon} size={30} />
		</button>
		<button
			type="button"
			class="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:border-accent"
			aria-expanded={choosing}
			onclick={() => {
				choosing = !choosing;
				pickingIcon = false;
			}}
		>
			<span class="text-sm text-muted">{m.item.category}</span>
			<span class="min-w-0 flex-1 truncate font-medium">{m.categories[category]}</span>
			<ChevronDown size={18} class="shrink-0 text-muted {choosing ? 'rotate-180' : ''}" />
		</button>
	</div>
	{#if pickingIcon}
		<div class="mt-2 rounded-xl border border-line bg-surface p-2">
			<div class="grid max-h-64 grid-cols-6 gap-1 overflow-y-auto sm:grid-cols-8">
				{#each ICONS as key (key)}
					<button
						type="button"
						class="flex items-center justify-center rounded-lg p-1.5 transition-colors hover:bg-bg {key ===
						shownIcon
							? 'ring-2 ring-accent'
							: ''}"
						aria-label={key}
						aria-pressed={key === shownIcon}
						onclick={() => {
							onicon(key);
							pickingIcon = false;
						}}
					>
						<FoodIcon icon={key} size={30} />
					</button>
				{/each}
			</div>
			{#if icon}
				<button
					type="button"
					class="mt-1 btn-quiet"
					onclick={() => {
						onicon(null);
						pickingIcon = false;
					}}
				>
					{m.item.iconAutomatic}
				</button>
			{/if}
		</div>
	{/if}
	{#if choosing}
		<ul
			class="mt-2 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface"
			aria-label={m.item.chooseCategory}
		>
			{#each CATEGORIES as key (key)}
				<li class="border-b border-line last:border-b-0">
					<button
						type="button"
						class="block w-full px-3 py-2 text-left transition-colors hover:bg-bg {key === category
							? 'text-accent'
							: ''}"
						aria-pressed={key === category}
						onclick={() => {
							oncategory(key);
							choosing = false;
						}}
					>
						<span class="block font-medium">{m.categories[key]}</span>
						<span class="block text-xs text-muted">{m.categoryExamples[key]}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
	<input type="hidden" name="category" value={category} />
	<input type="hidden" name="icon" value={icon ?? ''} />
</div>
