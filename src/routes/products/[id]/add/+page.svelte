<script lang="ts">
	import FoodIcon from '$lib/components/FoodIcon.svelte';
	import ProductForm from '$lib/components/ProductForm.svelte';
	import { suggestIcon } from '$lib/food/dictionary';
	import { m } from '$lib/i18n/index.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>{m.products.addTitle} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-md px-4 py-6">
	<h1 class="sr-only">{m.products.addTitle}</h1>
	<!-- What the pack is of: the product, as it is called in the stock -->
	<div class="flex items-center gap-3">
		<FoodIcon
			icon={data.product.icon ?? suggestIcon(data.product.name, data.product.category)}
			size={40}
		/>
		<p class="min-w-0 flex-1 text-2xl font-bold break-words">{data.product.name}</p>
	</div>
	<p class="mt-1 text-sm text-muted">{m.products.addTitle}</p>
	<div class="mt-4"></div>
	<ProductForm
		mode="pack"
		today={data.today}
		name={data.product.name}
		category={data.product.category}
		location={data.product.location}
		submitLabel={m.item.add}
		cancelHref="/"
		error={form?.error}
	/>
</main>
