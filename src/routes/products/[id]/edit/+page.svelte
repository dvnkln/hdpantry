<script lang="ts">
	import ProductForm from '$lib/components/ProductForm.svelte';
	import { m } from '$lib/i18n/index.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>{m.products.editTitle} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-md px-4 py-6">
	<h1 class="text-xl font-bold">{m.products.editTitle}</h1>
	<div class="mt-4"></div>
	<ProductForm
		mode="edit"
		today={data.today}
		name={data.product.name}
		note={data.product.note}
		shape={data.product.shape}
		category={data.product.category}
		icon={data.product.icon}
		location={data.product.location}
		memory={data.memory}
		groups={data.groups}
		soonDays={data.soonDays}
		submitLabel={m.products.save}
		cancelHref="/products/{data.product.id}"
		error={form?.error}
	/>
</main>
