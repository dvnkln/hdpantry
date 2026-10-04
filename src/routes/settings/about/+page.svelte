<script lang="ts">
	import Brand from '$lib/components/Brand.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { BookOpen, Bug, ExternalLink, ListChecks, Scale } from '@lucide/svelte';

	let { data } = $props();

	const REPO = 'https://github.com/dvnkln/hdpantry';
	let links = $derived([
		{ href: `${REPO}/wiki`, label: m.about.docs, icon: BookOpen },
		{ href: REPO, label: m.about.source, icon: ExternalLink },
		{ href: `${REPO}/issues`, label: m.about.issues, icon: Bug },
		{ href: `${REPO}/blob/main/ROADMAP.md`, label: m.about.roadmap, icon: ListChecks },
		{ href: `${REPO}/blob/main/LICENSE`, label: m.about.license, icon: Scale }
	]);
	// What hdpantry is built with and has to name
	const credits = [
		{ name: 'Twemoji', href: 'https://github.com/jdecked/twemoji', text: () => m.about.twemoji },
		{ name: 'Lucide', href: 'https://lucide.dev', text: () => m.about.lucide },
		{ name: 'Tabler Icons', href: 'https://tabler.io/icons', text: () => m.about.tabler },
		{ name: 'Outfit', href: 'https://github.com/Outfitio/Outfit-Fonts', text: () => m.about.outfit }
	];
</script>

<svelte:head><title>{m.about.title} · hdpantry</title></svelte:head>

<h1 class="sr-only">{m.about.title}</h1>
<div class="flex flex-col items-start gap-1">
	<Brand large />
	<p class="text-sm text-muted">{m.about.version(data.version)}</p>
</div>
<p class="mt-4 text-sm">{m.about.text}</p>
<p class="mt-2 text-sm text-muted">{m.about.private}</p>

<!-- Links the reader may follow; hdpantry itself never contacts these sites -->
<ul class="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
	{#each links as link (link.href)}
		<li class="border-b border-line last:border-b-0">
			<a
				href={link.href}
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-bg"
			>
				<link.icon size={18} class="shrink-0 text-muted" />
				{link.label}
			</a>
		</li>
	{/each}
</ul>

<h2 class="mt-8 font-medium">{m.about.credits}</h2>
<ul class="mt-2 flex flex-col gap-2 text-sm">
	{#each credits as credit (credit.name)}
		<li>
			<a
				href={credit.href}
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium underline decoration-line underline-offset-4 hover:text-accent"
				>{credit.name}</a
			>
			<span class="text-muted">– {credit.text()}</span>
		</li>
	{/each}
</ul>
<p class="mt-3 text-sm text-muted">{m.about.bundled}</p>
