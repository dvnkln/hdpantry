<script lang="ts">
	import { enhance } from '$app/forms';
	import { autosave } from '$lib/autosave';
	import FeedbackText from '$lib/components/FeedbackText.svelte';
	import FoodIcon from '$lib/components/FoodIcon.svelte';
	import ThemePreview from '$lib/components/ThemePreview.svelte';
	import { FormFeedback } from '$lib/forms.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { THEMES, THEME_KEYS, type Theme } from '$lib/themes';
	import { ui } from '$lib/ui';
	import { Palette, Utensils } from '@lucide/svelte';

	let { data } = $props();

	const forms = new FormFeedback();
	const { card, heading, hint } = ui;
	const tile =
		'flex cursor-pointer flex-col gap-2 rounded-xl border bg-surface p-2 transition-colors hover:border-accent has-checked:border-accent has-checked:ring-2 has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-accent';

	// A tap switches the whole app at once (no reload); saving is done by `use:autosave`.
	function applyTheme(next: Theme) {
		document.documentElement.dataset.theme = next;
		document
			.querySelectorAll('meta[name="theme-color"]')
			.forEach((meta, i) => meta.setAttribute('content', THEMES[next].bar[i]));
	}
</script>

<svelte:head><title>{m.settings.appearance} · hdpantry</title></svelte:head>

<h1 class={ui.pageTitle}>{m.settings.appearance}</h1>

<section class={card}>
	<div class="flex min-h-7 items-center justify-between gap-3">
		<h2 class={heading}><Palette size={20} class="text-muted" />{m.settings.theme}</h2>
		<FeedbackText feedback={forms.error('theme')} />
	</div>
	<p class="mt-1 {hint}">{m.settings.themeHint}</p>
	<form
		method="POST"
		action="?/theme"
		use:enhance={forms.submit('theme')}
		use:autosave
		class="mt-4 grid max-w-xl grid-cols-3 gap-2"
	>
		{#each THEME_KEYS as theme (theme)}
			<label class="{tile} border-line">
				<ThemePreview {theme} />
				<span class="flex items-center gap-2 px-1 text-sm font-medium">
					<input
						type="radio"
						name="theme"
						value={theme}
						checked={data.theme === theme}
						onchange={() => applyTheme(theme)}
						class={ui.radio}
					/>
					{m.settings.themes[theme]}
				</span>
			</label>
		{/each}
	</form>
</section>

<section class={card}>
	<div class="flex min-h-7 items-center justify-between gap-3">
		<h2 class={heading}><Utensils size={20} class="text-muted" />{m.settings.icons}</h2>
		<FeedbackText feedback={forms.error('icons')} />
	</div>
	<p class="mt-1 {hint}">{m.settings.iconsHint}</p>
	<form
		method="POST"
		action="?/iconStyle"
		use:enhance={forms.submit('icons')}
		use:autosave
		class="mt-4 grid max-w-md grid-cols-2 gap-2"
	>
		{#each ['color', 'line'] as const as style (style)}
			<label class="{tile} border-line p-3!">
				<span class="flex justify-center gap-2">
					{#each ['cheese-wedge', 'fish', 'carrot', 'bread'] as icon (icon)}
						<FoodIcon {icon} {style} size={28} />
					{/each}
				</span>
				<span class="flex items-center gap-2 text-sm font-medium">
					<input
						type="radio"
						name="style"
						value={style}
						checked={data.iconStyle === style}
						class={ui.radio}
					/>
					{m.settings.iconStyles[style]}
				</span>
			</label>
		{/each}
	</form>
</section>
