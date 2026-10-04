<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Brand from '$lib/components/Brand.svelte';
	import { m, setLocale } from '$lib/i18n/index.svelte';
	import { LogOut } from '@lucide/svelte';

	let { data, children } = $props();

	// Apply the language: once right away (so the first render is already correct) and again
	// whenever it changes.
	// svelte-ignore state_referenced_locally
	setLocale(data.locale);
	$effect.pre(() => setLocale(data.locale));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if data.user}
	<!-- Stays at the top while scrolling -->
	<header class="sticky top-0 z-10 border-b border-line bg-bg pt-[env(safe-area-inset-top)]">
		<div class="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-2">
			<a href="/" aria-label={m.common.home} class="transition-opacity hover:opacity-80"
				><Brand /></a
			>
			<!-- -mr-2: the icon itself (not its hover area) lines up with the content edge -->
			<form method="POST" action="/logout" class="-mr-2">
				<button
					class="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-text"
					aria-label={m.common.logout}
					title={m.common.logout}
				>
					<LogOut size={20} />
				</button>
			</form>
		</div>
	</header>
{/if}

{@render children()}
