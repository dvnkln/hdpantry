<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/index.svelte';
	import { CircleAlert, SearchX } from '@lucide/svelte';

	let missing = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{missing ? m.errorPage.notFound : m.errorPage.failed} · hdpantry</title>
</svelte:head>

<main class="mx-auto flex max-w-md flex-col items-center px-4 pt-16 text-center">
	{#if missing}
		<SearchX size={40} class="text-muted" />
	{:else}
		<CircleAlert size={40} class="text-warn" />
	{/if}
	<p class="mt-4 font-mono text-sm text-muted">{page.status}</p>
	<h1 class="mt-1 text-xl font-bold">{missing ? m.errorPage.notFound : m.errorPage.failed}</h1>
	<p class="mt-2 text-sm text-muted">
		{missing ? m.errorPage.notFoundHint : m.errorPage.failedHint}
	</p>
	<a
		href="/"
		class="mt-6 rounded-lg bg-accent px-4 py-2 font-semibold text-on-accent transition-opacity hover:opacity-90"
		>{m.errorPage.home}</a
	>
</main>
