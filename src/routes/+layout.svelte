<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Brand from '$lib/components/Brand.svelte';
	import { m, setLocale } from '$lib/i18n/index.svelte';
	import { LogOut, ScanLine, Settings } from '@lucide/svelte';

	let { data, children } = $props();

	// Apply the language: once right away (so the first render is already correct) and again
	// whenever it changes.
	// svelte-ignore state_referenced_locally
	setLocale(data.locale);
	$effect.pre(() => setLocale(data.locale));

	// First part of the address, e.g. "containers" for /containers/3
	let section = $derived(page.url.pathname.split('/')[1]);
	// The big scan button belongs to the stock list only
	let scanButton = $derived(page.url.pathname === '/');
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if data.user}
	<!-- Stays at the top while scrolling -->
	<header class="sticky top-0 z-10 border-b border-line bg-bg pt-[env(safe-area-inset-top)]">
		<div class="mx-auto flex max-w-screen-xl items-center gap-1 px-4 py-2">
			<a href="/" aria-label={m.common.home} class="mr-auto transition-opacity hover:opacity-80"
				><Brand /></a
			>
			<a
				href="/settings"
				class="rounded-lg p-2 transition-colors hover:bg-surface hover:text-text {section ===
				'settings'
					? 'text-text'
					: 'text-muted'}"
				aria-current={section === 'settings' ? 'page' : undefined}
				aria-label={m.settings.title}
				title={m.settings.title}
			>
				<Settings size={20} />
			</a>
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

	<!-- pb-28 keeps content clear of the scan button -->
	<div class={scanButton ? 'pb-28' : ''}>
		{@render children()}
	</div>

	{#if scanButton}
		<a
			href="/scan"
			class="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 flex items-center gap-2 rounded-full bg-accent px-5 py-4 font-semibold text-on-accent shadow-lg transition-transform hover:scale-105 active:scale-95"
		>
			<ScanLine size={22} />
			{m.home.scan}
		</a>
	{/if}
{:else}
	{@render children()}
{/if}
