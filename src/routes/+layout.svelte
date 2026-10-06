<script lang="ts">
	import '@fontsource/outfit/600.css';
	import '@fontsource/outfit/800.css';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Brand from '$lib/components/Brand.svelte';
	import { m, setLocale } from '$lib/i18n/index.svelte';
	import { THEMES } from '$lib/themes';
	import { LogOut, ScanLine, Settings } from '@lucide/svelte';

	let { data, children } = $props();

	// Apply the language: once right away (so the first render is already correct) and again
	// whenever it changes.
	// svelte-ignore state_referenced_locally
	setLocale(data.locale);
	$effect.pre(() => setLocale(data.locale));

	// The server writes language and colour scheme into the page. When they are changed in the
	// settings, the page is not loaded again: bring <html> and the browser's bar up to date here.
	$effect(() => {
		const root = document.documentElement;
		root.lang = data.locale;
		root.dataset.theme = data.theme;
		const [light, dark] = THEMES[data.theme].bar;
		const bars = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
		if (bars[0]) bars[0].content = light;
		if (bars[1]) bars[1].content = dark;
	});

	// First part of the address, e.g. "containers" for /containers/3
	let section = $derived(page.url.pathname.split('/')[1]);
	// The big scan button belongs to the stock list only
	// The scan button belongs to the stock list. An empty stock has its own, in the middle of
	// the page.
	let scanButton = $derived(page.url.pathname === '/' && (page.data.stock?.length ?? 0) > 0);
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
		<!-- Phones: a bar along the lower edge the list fades out behind, so no entry is half
		     covered. Wide screens have room for a button in the corner. -->
		<div
			class="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center bg-linear-to-t from-bg from-60% to-transparent px-4 pt-7 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-4 lg:bg-none lg:px-0 lg:pt-0"
		>
			<a
				href="/scan"
				class="pointer-events-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-accent px-5 py-4 font-semibold text-on-accent transition-transform hover:scale-[1.02] active:scale-95 lg:w-auto lg:shadow-lg"
			>
				<ScanLine size={22} />
				{m.home.scan}
			</a>
		</div>
	{/if}
{:else}
	{@render children()}
{/if}
