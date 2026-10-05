<script lang="ts">
	import { WIKI, ui } from '$lib/ui';
	import { enhance } from '$app/forms';
	import { MAX_BACKUP_BYTES, backupCounts, parseBackup, type BackupResult } from '$lib/backup';
	import SubmitButton, {
		BUTTON_DANGER,
		BUTTON_SECONDARY
	} from '$lib/components/SubmitButton.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { Download, FileDown, FileUp, TriangleAlert, Upload } from '@lucide/svelte';

	let { data, form } = $props();

	// The chosen file is read here in the browser first: it shows what is in it (or what is
	// wrong with it) before anything is sent.
	let content = $state('');
	let chosen = $state<BackupResult | null>(null);
	let typed = $state('');
	let picker = $state<HTMLInputElement>();
	// True while the import is on its way
	let busy = $state(false);

	async function choose(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		typed = '';
		if (!file) return reset();
		if (file.size > MAX_BACKUP_BYTES) {
			content = '';
			chosen = { ok: false, problem: { kind: 'tooLarge' } };
			return;
		}
		content = await file.text();
		chosen = parseBackup(content);
	}

	function reset() {
		content = '';
		chosen = null;
		typed = '';
		if (picker) picker.value = '';
	}

	let problem = $derived.by(() => {
		if (!chosen || chosen.ok) return null;
		const { problem } = chosen;
		return problem.kind === 'invalid'
			? m.settings.dataProblems.invalid(problem.where)
			: m.settings.dataProblems[problem.kind];
	});
	let file = $derived(chosen?.ok ? chosen.backup : null);
	let fileCounts = $derived(file ? backupCounts(file) : null);
	const ROWS = ['containers', 'filled', 'history', 'memory'] as const;

	function day(iso: string) {
		return new Date(iso).toLocaleDateString(data.locale, { dateStyle: 'long' });
	}
</script>

<svelte:head><title>{m.settings.data} · hdpantry</title></svelte:head>

<h1 class={ui.pageTitle}>{m.settings.data}</h1>

<section class={ui.card}>
	<h2 class={ui.heading}><FileDown size={20} class="text-muted" />{m.settings.dataExport}</h2>
	<p class="mt-1 text-sm text-muted">{m.settings.dataExportText}</p>
	<p class="mt-2 text-sm">{m.settings.dataNow(data.counts.containers, data.counts.filled)}</p>
	<!-- A plain download from the own server -->
	<a href="/settings/data/export" download class="mt-3 {BUTTON_SECONDARY}">
		<Download size={18} />{m.settings.dataExportButton}
	</a>
</section>

<section class={ui.card}>
	<h2 class={ui.heading}><FileUp size={20} class="text-muted" />{m.settings.dataImport}</h2>
	<p class="mt-1 text-sm text-muted">
		{m.settings.dataImportText}
		<a href="{WIKI}/Export-and-import" target="_blank" rel="noopener noreferrer" class={ui.link}
			>{m.settings.learnMore}</a
		>
	</p>

	{#if form?.imported && !chosen}
		<p class="mt-3 text-sm text-good" role="status">
			{m.settings.dataImported(form.imported.containers, form.imported.filled)}
		</p>
	{/if}

	<label
		class="mt-3 cursor-pointer {BUTTON_SECONDARY} has-focus-visible:outline-2 has-focus-visible:outline-accent"
	>
		<Upload size={18} />{m.settings.dataChoose}
		<input
			bind:this={picker}
			type="file"
			accept="application/json,.json"
			class="sr-only"
			onchange={choose}
		/>
	</label>

	{#if problem}
		<p class="mt-3 form-error" role="alert">{problem}</p>
	{:else if file && fileCounts}
		<form
			method="POST"
			action="?/import"
			use:enhance={() => {
				busy = true;
				return async ({ result, update }) => {
					await update();
					busy = false;
					if (result.type === 'success') reset();
				};
			}}
			class="mt-4 flex flex-col gap-3"
		>
			<input type="hidden" name="backup" value={content} />
			<!-- What is there now and what will be there afterwards -->
			<div class="overflow-hidden rounded-xl border border-line bg-surface">
				<p class="border-b border-line px-3 py-2 text-sm font-medium">
					{m.settings.dataFileFrom(day(file.exportedAt))}
				</p>
				<table class="w-full text-sm">
					<thead>
						<tr class="text-muted">
							<td class="px-3 pt-2"></td>
							<th scope="col" class="px-3 pt-2 text-right font-normal">
								{m.settings.dataNowColumn}
							</th>
							<th scope="col" class="px-3 pt-2 text-right font-normal">
								{m.settings.dataAfterColumn}
							</th>
						</tr>
					</thead>
					<tbody>
						{#each ROWS as row (row)}
							<tr>
								<th scope="row" class="px-3 py-1.5 text-left font-normal">
									{m.settings.dataRows[row]}
								</th>
								<td class="px-3 py-1.5 text-right text-muted tabular-nums">{data.counts[row]}</td>
								<td class="px-3 py-1.5 text-right font-semibold tabular-nums">
									{fileCounts[row]}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="notice">
				<TriangleAlert size={18} class="mt-0.5 shrink-0 text-warn" />
				<span>{m.settings.dataWarning}</span>
			</p>
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">{m.settings.typeToConfirm(m.settings.dataWord)}</span>
				<input
					name="confirm"
					bind:value={typed}
					autocomplete="off"
					autocapitalize="characters"
					spellcheck="false"
				/>
			</label>
			{#if form?.error}
				<p class="form-error" role="alert">{form.error}</p>
			{/if}
			<div class="flex gap-2">
				<button type="button" class="flex-1 {BUTTON_SECONDARY}" onclick={reset} disabled={busy}>
					{m.common.cancel}
				</button>
				<!-- Greyed out until the word is typed -->
				<SubmitButton
					text={busy ? m.settings.dataBusy : m.settings.dataReplace}
					{busy}
					disabled={typed.trim() !== m.settings.dataWord}
					style="flex-1 {BUTTON_DANGER}"
				/>
			</div>
		</form>
	{/if}
</section>
