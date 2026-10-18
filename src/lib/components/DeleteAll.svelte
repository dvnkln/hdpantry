<script lang="ts">
	import { enhance } from '$app/forms';
	import SubmitButton, {
		BUTTON_DANGER,
		BUTTON_SECONDARY
	} from '$lib/components/SubmitButton.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui';
	import { Trash2 } from '@lucide/svelte';

	// "Delete all …": a red box below a list. Only after typing the confirmation word – the
	// server checks it too (field `confirm` of the action `?/deleteAll`).
	let {
		title,
		hint,
		question,
		error = ''
	}: { title: string; hint: string; question: string; error?: string } = $props();

	let open = $state(false);
	let typed = $state('');
</script>

<section class="mt-6 rounded-xl border border-danger/50 bg-surface/50 p-4">
	<h2 class={ui.heading}><Trash2 size={20} class="text-danger" />{title}</h2>
	<p class="mt-1 {ui.hint}">{hint}</p>
	{#if open}
		<form
			method="POST"
			action="?/deleteAll"
			use:enhance={() =>
				async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						open = false;
						typed = '';
					}
				}}
			class="mt-3 flex flex-col gap-3"
		>
			<p class="text-sm">{question}</p>
			<label class={ui.label}>
				<span class={ui.labelText}>{m.settings.typeToConfirm(m.settings.deleteWord)}</span>
				<input
					name="confirm"
					bind:value={typed}
					autocomplete="off"
					autocapitalize="characters"
					spellcheck="false"
				/>
			</label>
			{#if error}
				<p class="form-error" role="alert">{error}</p>
			{/if}
			<div class="flex gap-2">
				<button
					type="button"
					class="flex-1 {BUTTON_SECONDARY}"
					onclick={() => {
						open = false;
						typed = '';
					}}
				>
					{m.common.cancel}
				</button>
				<SubmitButton
					text={m.settings.deleteAllConfirm}
					disabled={typed.trim() !== m.settings.deleteWord}
					style="flex-1 {BUTTON_DANGER}"
				/>
			</div>
		</form>
	{:else}
		<button
			type="button"
			class="mt-2 -ml-2 flex items-center gap-1.5 btn-quiet hover:text-danger"
			onclick={() => (open = true)}
		>
			<Trash2 size={16} />
			{title}
		</button>
	{/if}
</section>
