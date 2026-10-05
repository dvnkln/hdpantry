<script lang="ts">
	import { enhance } from '$app/forms';
	import { autosave } from '$lib/autosave';
	import FeedbackText from '$lib/components/FeedbackText.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import { FormFeedback } from '$lib/forms.svelte';
	import { LOCALES, m } from '$lib/i18n/index.svelte';
	import { SOON_CHOICES } from '$lib/stock';
	import { ui } from '$lib/ui';
	import { Monitor, ScanLine } from '@lucide/svelte';

	let { data } = $props();

	const forms = new FormFeedback();
	const { card, heading, label, labelText, hint } = ui;
</script>

<svelte:head><title>{m.settings.general} · hdpantry</title></svelte:head>

<h1 class={ui.pageTitle}>{m.settings.general}</h1>

<!-- Every choice is saved the moment it is made; only a failure is mentioned (next to the heading) -->
<section class={card}>
	<div class="flex min-h-7 items-center justify-between gap-3">
		<h2 class={heading}><Monitor size={20} class="text-muted" />{m.settings.display}</h2>
		<FeedbackText feedback={forms.error('display')} />
	</div>
	<form
		method="POST"
		action="?/display"
		use:enhance={forms.submit('display')}
		use:autosave
		class="mt-4 flex flex-col gap-4"
	>
		<label class={label}>
			<span class={labelText}>{m.settings.language}</span>
			<select name="uiLanguage" value={data.locale}>
				{#each LOCALES as locale (locale)}
					<option value={locale}>{m.languages[locale]}</option>
				{/each}
			</select>
		</label>
		<label class={label}>
			<span class={labelText}>{m.settings.soon}</span>
			<select name="soonDays" value={String(data.soonDays)}>
				{#each SOON_CHOICES as days (days)}
					<option value={String(days)}>{m.settings.days(days)}</option>
				{/each}
			</select>
			<span class={hint}>{m.settings.soonHint}</span>
		</label>
	</form>
</section>

<section class={card}>
	<div class="flex min-h-7 items-center justify-between gap-3">
		<h2 class={heading}><ScanLine size={20} class="text-muted" />{m.settings.scanning}</h2>
		<FeedbackText feedback={forms.error('scanning')} />
	</div>
	<form
		method="POST"
		action="?/scanning"
		use:enhance={forms.submit('scanning')}
		use:autosave
		class="mt-4"
	>
		<div class="flex items-start justify-between gap-4">
			<label for="scanVibration" class="flex cursor-pointer flex-col gap-1">
				<span class={labelText}>{m.settings.vibration}</span>
				<span class={hint}>{m.settings.vibrationHint}</span>
			</label>
			<Switch id="scanVibration" name="scanVibration" checked={data.vibration} />
		</div>
	</form>
</section>
