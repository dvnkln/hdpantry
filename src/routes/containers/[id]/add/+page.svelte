<script lang="ts">
	import ItemForm from '$lib/components/ItemForm.svelte';
	import { m } from '$lib/i18n/index.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.replacing ? m.item.replaceTitle : m.item.addTitle} · hdpantry</title>
</svelte:head>

<main class="mx-auto max-w-md px-4 py-6">
	<h1 class="text-xl font-bold">{data.replacing ? m.item.replaceTitle : m.item.addTitle}</h1>
	{#if data.replacing}
		<!-- Nothing happens to the old content until the new one is saved -->
		<p class="mt-1 text-sm text-muted">{m.item.replaceHint(data.replacing)}</p>
	{/if}
	<div class="mt-4"></div>
	<ItemForm
		nameFirst
		example={data.example}
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
		recent={data.recent}
		submitLabel={m.item.add}
		cancelHref={data.replacing ? `/containers/${data.container.id}` : '/'}
		error={form?.error}
	/>
</main>
