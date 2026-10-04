<script lang="ts">
	import ItemForm from '$lib/components/ItemForm.svelte';
	import { m } from '$lib/i18n/index.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>{m.item.editTitle} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-md px-4 py-6">
	<h1 class="mb-4 text-xl font-bold">{m.item.editTitle}</h1>
	<ItemForm
		initial={data.item}
		source={data.container.source}
		from={data.from}
		memory={data.memory}
		submitLabel={m.common.save}
		cancelHref="/containers/{data.container.id}"
		error={form?.error}
	/>
</main>
