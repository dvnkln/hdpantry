<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setLocale } from '$lib/i18n/index.svelte';

	let { data, children } = $props();

	// Apply the language: once right away (so the first render is already correct) and again
	// whenever it changes.
	// svelte-ignore state_referenced_locally
	setLocale(data.locale);
	$effect.pre(() => setLocale(data.locale));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{@render children()}
