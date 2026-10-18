<script lang="ts">
	import ProductForm from '$lib/components/ProductForm.svelte';
	import { m } from '$lib/i18n/index.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>{m.products.newTitle} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-md px-4 py-6">
	<h1 class="text-xl font-bold">{m.products.newTitle}</h1>
	{#if data.barcode}
		<p class="mt-1 font-mono text-xs text-muted">{m.products.barcode} {data.barcode}</p>
	{/if}
	<div class="mt-4"></div>
	<ProductForm
		mode="new"
		today={data.today}
		name={data.name}
		location={data.location}
		memory={data.memory}
		recent={data.recent}
		example={data.example}
		found={data.found}
		fromDatabase={data.fromDatabase}
		lookupOff={!!data.barcode && !data.lookupOn}
		submitLabel={m.item.add}
		cancelHref="/"
		error={form?.error}
	/>
</main>
