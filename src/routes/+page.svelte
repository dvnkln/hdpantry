<script lang="ts">
	import { m } from '$lib/i18n/index.svelte';
</script>

<svelte:head><title>hdpantry</title></svelte:head>

<main class="mx-auto flex max-w-md flex-col items-center px-4 pt-16 text-center">
	<h1 class="text-2xl font-bold">hdpantry</h1>
	<p class="mt-4">{m.home.running}</p>
	<p class="mt-1 text-sm text-muted">{m.home.next}</p>
</main>
