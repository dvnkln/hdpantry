<script lang="ts">
	import { WIKI, ui } from '$lib/ui';
	import { enhance } from '$app/forms';
	import { m } from '$lib/i18n/index.svelte';
	import { FREQUENCIES, KEEP_CHOICES } from '$lib/schedule';
	import FeedbackText from '$lib/components/FeedbackText.svelte';
	import SubmitButton, { BUTTON_SECONDARY } from '$lib/components/SubmitButton.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import { FormFeedback } from '$lib/forms.svelte';
	import { Archive, DatabaseBackup, Download, Trash2 } from '@lucide/svelte';

	let { data } = $props();

	const forms = new FormFeedback();
	const { card, heading, label, labelText, hint, actions } = ui;

	// What the form shows right now (decides which fields are there)
	// svelte-ignore state_referenced_locally
	let enabled = $state(data.enabled);
	// svelte-ignore state_referenced_locally
	let frequency = $state(data.schedule.frequency);
	// The backup whose deletion is being asked about
	let asking = $state<string | null>(null);

	function moment(iso: string) {
		return new Date(iso).toLocaleString(data.locale, { dateStyle: 'medium', timeStyle: 'short' });
	}
	function size(bytes: number) {
		const mb = bytes / (1024 * 1024);
		return `${mb.toLocaleString(data.locale, { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
	}
	// Monday first; the numbers are those of the calendar (0 = Sunday)
	const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];
	function weekdayName(day: number) {
		// 2031-06-01 is a Sunday
		return new Date(2031, 5, 1 + day).toLocaleDateString(data.locale, { weekday: 'long' });
	}
	let total = $derived(data.files.reduce((sum, file) => sum + file.size, 0));
</script>

<svelte:head><title>{m.settings.maintenance} · hdpantry</title></svelte:head>

<h1 class={ui.pageTitle}>{m.settings.maintenance}</h1>

<section class={card}>
	<h2 class={heading}><DatabaseBackup size={20} class="text-muted" />{m.settings.backup}</h2>
	<p class="mt-1 {hint}">{m.settings.backupText}</p>

	<!-- Switch and schedule belong together: one form, saved with its button -->
	<form
		method="POST"
		action="?/save"
		use:enhance={forms.submit('backup')}
		class="mt-4 flex flex-col gap-4"
	>
		<div class="flex items-center justify-between gap-4">
			<label for="backupEnabled" class="cursor-pointer {labelText}">{m.settings.backupSwitch}</label
			>
			<Switch id="backupEnabled" name="enabled" bind:checked={enabled} />
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 {enabled ? '' : 'opacity-50'}">
			<label class={label}>
				<span class={labelText}>{m.settings.backupHow}</span>
				<select name="frequency" bind:value={frequency}>
					{#each FREQUENCIES as option (option)}
						<option value={option}>{m.settings.backupFrequencies[option]}</option>
					{/each}
				</select>
				{#if frequency === 'monthly'}<span class={hint}>{m.settings.backupMonthlyHint}</span>{/if}
			</label>
			{#if frequency === 'weekly'}
				<label class={label}>
					<span class={labelText}>{m.settings.backupWeekday}</span>
					<select name="weekday" value={String(data.schedule.weekday)}>
						{#each WEEKDAYS as day (day)}
							<option value={String(day)}>{weekdayName(day)}</option>
						{/each}
					</select>
				</label>
			{/if}
			<label class={label}>
				<span class={labelText}>{m.settings.backupTime}</span>
				<input type="time" name="time" value={data.schedule.time} required />
			</label>
			<label class={label}>
				<span class={labelText}>{m.settings.backupKeep}</span>
				<select name="keep" value={String(data.keep)}>
					{#each KEEP_CHOICES as keep (keep)}
						<option value={String(keep)}>{keep}</option>
					{/each}
				</select>
				<span class={hint}>{m.settings.backupKeepHint}</span>
			</label>
		</div>

		<div class={actions}>
			<SubmitButton text={m.common.save} busy={forms.busy === 'backup'} when="changed" />
			<FeedbackText feedback={forms.messages.backup} />
		</div>
	</form>

	<div class="mt-4 flex flex-col gap-1 border-t border-line pt-4 text-sm">
		{#if data.next}<p>{m.settings.backupNext(moment(data.next))}</p>{/if}
		{#if data.lastError}
			<p class="text-danger" role="alert">{m.settings.backupFailed(data.lastError)}</p>
		{:else if data.lastRun}
			<p class="text-muted">{m.settings.backupLast(moment(data.lastRun))}</p>
		{:else}
			<p class="text-muted">{m.settings.backupNever}</p>
		{/if}
	</div>
	<form method="POST" action="?/run" use:enhance={forms.submit('run')} class="mt-3 {actions}">
		<SubmitButton
			text={forms.busy === 'run' ? m.settings.backupRunning : m.settings.backupNow}
			busy={forms.busy === 'run'}
			style={BUTTON_SECONDARY}
		/>
		<FeedbackText feedback={forms.error('run')} />
	</form>
</section>

<section class={ui.card}>
	<h2 class={ui.heading}><Archive size={20} class="text-muted" />{m.settings.backupFiles}</h2>
	<p class="mt-1 text-sm text-muted">
		{m.settings.backupSizes(size(data.databaseSize), size(total))}
	</p>
	{#if data.files.length}
		<ul class="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
			{#each data.files as file (file.name)}
				<li class="border-b border-line px-3 py-2 last:border-b-0">
					<div class="flex items-center gap-2">
						<span class="min-w-0 flex-1">
							<span class="block text-sm">{moment(file.createdAt)}</span>
							<span class="block text-xs text-muted">{size(file.size)}</span>
						</span>
						<a
							href="/settings/maintenance/backups/{file.name}"
							download
							class="btn-quiet"
							aria-label={m.settings.backupDownload}
							title={m.settings.backupDownload}
						>
							<Download size={18} />
						</a>
						<button
							type="button"
							class="btn-quiet hover:text-danger"
							aria-label={m.settings.delete}
							title={m.settings.delete}
							onclick={() => (asking = asking === file.name ? null : file.name)}
						>
							<Trash2 size={18} />
						</button>
					</div>
					{#if asking === file.name}
						<form
							method="POST"
							action="?/delete"
							use:enhance
							class="mt-2 flex flex-wrap items-center justify-end gap-2"
						>
							<input type="hidden" name="name" value={file.name} />
							<span class="mr-auto text-sm">{m.settings.backupDeleteQuestion}</span>
							<button type="button" class="btn-secondary" onclick={() => (asking = null)}>
								{m.common.cancel}
							</button>
							<button class="btn-danger">{m.settings.deleteConfirm}</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-3 text-sm text-muted">{m.settings.backupNone}</p>
	{/if}
	<p class="mt-3 text-sm text-muted">
		{m.settings.backupRestore}
		<a href="{WIKI}/Backups-and-restore" target="_blank" rel="noopener noreferrer" class={ui.link}
			>{m.settings.backupRestoreLink}</a
		>
	</p>
</section>
