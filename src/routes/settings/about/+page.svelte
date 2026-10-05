<script lang="ts">
	import { ui } from '$lib/ui';
	import { m } from '$lib/i18n/index.svelte';
	import {
		BookOpen,
		Bug,
		ExternalLink,
		History,
		Link,
		ListChecks,
		Package,
		Scale
	} from '@lucide/svelte';

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

	const card = ui.card;
	const heading = ui.heading;
</script>

<svelte:head><title>{m.about.title} · hdpantry</title></svelte:head>

<h1 class="text-xl font-bold">{m.about.title}</h1>

<!-- Name, version and what it is -->
<section class={card}>
	<div class="flex flex-wrap items-center gap-2">
		<h2 class="text-lg font-semibold">hdpantry</h2>
		<a
			href="{REPO}/releases/tag/v{data.version}"
			target="_blank"
			rel="noopener noreferrer"
			title={m.about.versionHint}
			class="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-muted transition-colors hover:border-accent hover:text-text"
		>
			{m.about.version(data.version)}
			<History size={12} />
		</a>
	</div>
	<p class="mt-1 text-sm text-muted">{m.about.text}</p>
	<p class="mt-2 text-sm text-muted">{m.about.private}</p>
</section>

<!-- Links the reader may follow; hdpantry itself never contacts these sites -->
<section class={card}>
	<h2 class={heading}><Link size={20} class="text-muted" />{m.about.links}</h2>
	<ul class="mt-2">
		{#each links as link (link.href)}
			<li>
				<a
					href={link.href}
					target="_blank"
					rel="noopener noreferrer"
					class="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-bg"
				>
					<link.icon size={18} class="shrink-0 text-muted" />
					{link.label}
				</a>
			</li>
		{/each}
	</ul>
</section>

<section class={card}>
	<h2 class={heading}><Package size={20} class="text-muted" />{m.about.credits}</h2>
	<ul class="mt-3 flex flex-col gap-3 text-sm">
		{#each credits as credit (credit.name)}
			<li>
				<a
					href={credit.href}
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium underline decoration-line underline-offset-2 hover:text-accent"
					>{credit.name}</a
				>
				<span class="text-muted">– {credit.text()}</span>
			</li>
		{/each}
	</ul>
	<p class="mt-4 text-sm text-muted">{m.about.bundled}</p>
</section>

<p class="mt-6 text-center text-sm text-muted">{m.about.ai}</p>
