<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '$lib/i18n/index.svelte';
	import { FREQUENCIES, KEEP_CHOICES } from '$lib/schedule';
	import { Download, LoaderCircle, Trash2 } from '@lucide/svelte';

	let { data } = $props();

	const choice =
		'cursor-pointer rounded-lg border bg-surface px-3 py-2 text-center text-sm transition-colors hover:border-accent';
	const chosen = 'border-accent font-semibold text-accent ring-2 ring-accent';

	// True while "Back up now" is running
	let busy = $state(false);
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
	function send(event: Event & { currentTarget: HTMLInputElement | HTMLSelectElement }) {
		event.currentTarget.form?.requestSubmit();
	}
	let total = $derived(data.files.reduce((sum, file) => sum + file.size, 0));
</script>

<svelte:head><title>{m.settings.maintenance} · hdpantry</title></svelte:head>

<h1 class="text-lg font-semibold">{m.settings.maintenance}</h1>

<section class="mt-4 max-w-xl">
	<h2 class="font-medium">{m.settings.backup}</h2>
	<p class="mt-1 text-sm text-muted">{m.settings.backupText}</p>

	<form method="POST" action="?/toggle" use:enhance class="mt-3">
		<button
			name="enabled"
			value={data.enabled ? 'off' : 'on'}
			class="flex w-full items-center justify-between gap-4 text-left"
			role="switch"
			aria-checked={data.enabled}
		>
			<span>{m.settings.backupSwitch}</span>
			<span
				class="relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors {data.enabled
					? 'bg-accent'
					: 'bg-line'}"
			>
				<span
					class="absolute top-0.5 left-0.5 size-6 rounded-full bg-surface shadow transition-transform {data.enabled
						? 'translate-x-5'
						: ''}"
				></span>
			</span>
		</button>
	</form>

	<!-- The schedule only matters while backups are on -->
	{#if data.enabled}
		<form
			method="POST"
			action="?/schedule"
			use:enhance={() =>
				({ update }) =>
					update({ reset: false })}
			class="mt-4 flex flex-col gap-4"
		>
			<fieldset>
				<legend class="text-sm font-medium">{m.settings.backupHow}</legend>
				<div class="mt-1 grid grid-cols-3 gap-2">
					{#each FREQUENCIES as frequency (frequency)}
						<button
							name="frequency"
							value={frequency}
							class="{choice} {data.schedule.frequency === frequency ? chosen : 'border-line'}"
							aria-pressed={data.schedule.frequency === frequency}
						>
							{m.settings.backupFrequencies[frequency]}
						</button>
					{/each}
				</div>
				{#if data.schedule.frequency === 'monthly'}
					<p class="mt-1 text-sm text-muted">{m.settings.backupMonthlyHint}</p>
				{/if}
			</fieldset>
			<div class="grid grid-cols-2 gap-2">
				{#if data.schedule.frequency === 'weekly'}
					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium">{m.settings.backupWeekday}</span>
						<select name="weekday" value={String(data.schedule.weekday)} onchange={send}>
							{#each WEEKDAYS as day (day)}
								<option value={String(day)}>{weekdayName(day)}</option>
							{/each}
						</select>
					</label>
				{/if}
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium">{m.settings.backupTime}</span>
					<input type="time" name="time" value={data.schedule.time} required onchange={send} />
				</label>
			</div>
			<fieldset>
				<legend class="text-sm font-medium">{m.settings.backupKeep}</legend>
				<div class="mt-1 grid grid-cols-4 gap-2">
					{#each KEEP_CHOICES as keep (keep)}
						<button
							name="keep"
							value={keep}
							class="{choice} {data.keep === keep ? chosen : 'border-line'}"
							aria-pressed={data.keep === keep}
						>
							{keep}
						</button>
					{/each}
				</div>
				<p class="mt-1 text-sm text-muted">{m.settings.backupKeepHint}</p>
			</fieldset>
		</form>
	{/if}

	<div class="mt-4 flex flex-col gap-1 text-sm">
		{#if data.next}<p>{m.settings.backupNext(moment(data.next))}</p>{/if}
		{#if data.lastError}
			<p class="form-error" role="alert">{m.settings.backupFailed(data.lastError)}</p>
		{:else if data.lastRun}
			<p class="text-muted">{m.settings.backupLast(moment(data.lastRun))}</p>
		{:else}
			<p class="text-muted">{m.settings.backupNever}</p>
		{/if}
	</div>

	<form
		method="POST"
		action="?/run"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
		class="mt-3"
	>
		<button
			class="inline-flex items-center gap-2 btn-secondary disabled:opacity-50"
			disabled={busy}
		>
			{#if busy}
				<LoaderCircle size={18} class="animate-spin" />{m.settings.backupRunning}
			{:else}
				{m.settings.backupNow}
			{/if}
		</button>
	</form>
</section>

<section class="mt-8 max-w-xl">
	<h2 class="font-medium">{m.settings.backupFiles}</h2>
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
	<p class="mt-3 text-sm text-muted">{m.settings.backupRestore}</p>
</section>
