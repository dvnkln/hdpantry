<script lang="ts">
	import { m } from '$lib/i18n/index.svelte';
	import { PackageOpen, ScanLine } from '@lucide/svelte';
</script>

<svelte:head><title>hdpantry</title></svelte:head>

<!-- Placeholder until the inventory exists -->
<main class="mx-auto flex max-w-md flex-col items-center px-4 pt-16 text-center">
	<PackageOpen size={48} class="text-muted" />
	<h1 class="mt-4 text-xl font-bold">{m.home.empty}</h1>
	<p class="mt-2 text-sm text-muted">{m.home.emptyHint}</p>
	<button class="mt-8 flex items-center gap-2 btn-primary px-6" disabled>
		<ScanLine size={20} />
		{m.home.scan}
	</button>
	<p class="mt-2 text-xs text-muted">{m.home.scanSoon}</p>
</main>
