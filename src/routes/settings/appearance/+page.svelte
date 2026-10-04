<script lang="ts">
	import { enhance } from '$app/forms';
	import FoodIcon from '$lib/components/FoodIcon.svelte';
	import ThemePreview from '$lib/components/ThemePreview.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { THEME_KEYS } from '$lib/themes';

	let { data } = $props();
</script>

<svelte:head><title>{m.settings.appearance} · hdpantry</title></svelte:head>

<h1 class="text-lg font-semibold">{m.settings.appearance}</h1>

<section class="mt-4">
	<h2 class="font-medium">{m.settings.theme}</h2>
	<p class="mt-1 text-sm text-muted">{m.settings.themeHint}</p>
	<!-- Saved as soon as one is chosen; the root layout then switches the colours of the page -->
	<form method="POST" action="?/theme" use:enhance class="mt-3 grid max-w-xl grid-cols-3 gap-2">
		{#each THEME_KEYS as theme (theme)}
			<button
				name="theme"
				value={theme}
				class="flex flex-col items-center gap-2 rounded-xl border bg-surface p-2 transition-colors hover:border-accent {data.theme ===
				theme
					? 'border-accent ring-2 ring-accent'
					: 'border-line'}"
				aria-pressed={data.theme === theme}
			>
				<ThemePreview {theme} />
				<span class="text-sm font-medium">{m.settings.themes[theme]}</span>
			</button>
		{/each}
	</form>
</section>

<section class="mt-8">
	<h2 class="font-medium">{m.settings.icons}</h2>
	<p class="mt-1 text-sm text-muted">{m.settings.iconsHint}</p>
	<!-- Saved as soon as one is chosen -->
	<form method="POST" action="?/iconStyle" use:enhance class="mt-3 grid max-w-md grid-cols-2 gap-2">
		{#each ['color', 'line'] as const as style (style)}
			<button
				name="style"
				value={style}
				class="flex flex-col items-center gap-2 rounded-xl border bg-surface p-3 transition-colors hover:border-accent {data.iconStyle ===
				style
					? 'border-accent ring-2 ring-accent'
					: 'border-line'}"
				aria-pressed={data.iconStyle === style}
			>
				<span class="flex gap-2">
					{#each ['cheese-wedge', 'fish', 'carrot', 'bread'] as icon (icon)}
						<FoodIcon {icon} {style} size={28} />
					{/each}
				</span>
				<span class="text-sm font-medium">{m.settings.iconStyles[style]}</span>
			</button>
		{/each}
	</form>
</section>
