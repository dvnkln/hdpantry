<script lang="ts">
	import { ui } from '$lib/ui';
	import { CalendarClock, Languages, ScanLine } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { LOCALES, m } from '$lib/i18n/index.svelte';
	import { SOON_CHOICES } from '$lib/stock';

	let { data } = $props();

	const choice =
		'cursor-pointer rounded-lg border bg-surface px-3 py-2 text-center text-sm transition-colors hover:border-accent';
	const chosen = 'border-accent font-semibold text-accent ring-2 ring-accent';
</script>

<svelte:head><title>{m.settings.general} · hdpantry</title></svelte:head>

<h1 class={ui.pageTitle}>{m.settings.general}</h1>

<!-- Every choice is saved as soon as it is made -->
<section class={ui.card}>
	<h2 class={ui.heading}><Languages size={20} class="text-muted" />{m.settings.language}</h2>
	<form method="POST" action="?/language" use:enhance class="mt-2 grid max-w-md grid-cols-2 gap-2">
		{#each LOCALES as locale (locale)}
			<button
				name="language"
				value={locale}
				class="{choice} {data.locale === locale ? chosen : 'border-line'}"
				aria-pressed={data.locale === locale}
			>
				{m.languages[locale]}
			</button>
		{/each}
	</form>
</section>

<section class={ui.card}>
	<h2 class={ui.heading}><ScanLine size={20} class="text-muted" />{m.settings.scanning}</h2>
	<form method="POST" action="?/vibration" use:enhance class="mt-2 max-w-md">
		<button
			name="vibration"
			value={data.vibration ? 'off' : 'on'}
			class="flex w-full items-center justify-between gap-4 text-left"
			role="switch"
			aria-checked={data.vibration}
		>
			<span>
				<span class="block">{m.settings.vibration}</span>
				<span class="block text-sm text-muted">{m.settings.vibrationHint}</span>
			</span>
			<span
				class="relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors {data.vibration
					? 'bg-accent'
					: 'bg-line'}"
			>
				<span
					class="absolute top-0.5 left-0.5 size-6 rounded-full bg-surface shadow transition-transform {data.vibration
						? 'translate-x-5'
						: ''}"
				></span>
			</span>
		</button>
	</form>
</section>

<section class={ui.card}>
	<h2 class={ui.heading}><CalendarClock size={20} class="text-muted" />{m.settings.soon}</h2>
	<p class="mt-1 text-sm text-muted">{m.settings.soonHint}</p>
	<form method="POST" action="?/soon" use:enhance class="mt-2 flex max-w-md flex-wrap gap-2">
		{#each SOON_CHOICES as days (days)}
			<button
				name="days"
				value={days}
				class="{choice} min-w-16 {data.soonDays === days ? chosen : 'border-line'}"
				aria-pressed={data.soonDays === days}
			>
				{m.settings.days(days)}
			</button>
		{/each}
	</form>
</section>
