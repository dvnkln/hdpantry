<script lang="ts">
	import ItemForm from '$lib/components/ItemForm.svelte';
	import { m } from '$lib/i18n/index.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>{m.item.addTitle} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-md px-4 py-6">
	<h1 class="mb-4 text-xl font-bold">{m.item.addTitle}</h1>
	<ItemForm
		nameFirst
		initial={{
			name: '',
			note: null,
			vacuumed: true,
			location: data.location,
			bestBefore: null,
			dateManual: false,
			category: 'other',
			icon: null,
			fill: 'full',
			amount: null,
			unit: null
		}}
		source={data.container.source}
		from={data.today}
		memory={data.memory}
		history={data.history}
		submitLabel={m.item.add}
		cancelHref="/"
		error={form?.error}
	/>
</main>
