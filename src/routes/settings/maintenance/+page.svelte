<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormFeedback } from '$lib/forms.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { WIKI, ui } from '$lib/ui';
	import { Download, Trash2 } from '@lucide/svelte';
	import Notice from '$lib/components/Notice.svelte';
	import TaskCard from './TaskCard.svelte';

	let { data } = $props();

	const forms = new FormFeedback();
	const { label, labelText, hint } = ui;
	// The backup whose deletion is being asked about
	let asking = $state<string | null>(null);
	// "Delete all" needs a second tap
	let confirmDeleteAll = $state(false);

	function moment(iso: string) {
		return new Date(iso).toLocaleString(data.locale, { dateStyle: 'medium', timeStyle: 'short' });
	}
	function size(bytes: number) {
		const mb = bytes / (1024 * 1024);
		return `${mb.toLocaleString(data.locale, { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
	}
</script>

<svelte:head><title>{m.settings.maintenance} · hdpantry</title></svelte:head>

<h1 class={ui.pageTitle}>{m.settings.maintenance}</h1>

<p class="mt-2 {hint}">{m.maintenance.intro(data.timeZone)}</p>

{#each data.tasks as task (task.key)}
	{#if task.key === 'backup'}
		<TaskCard {task} frequencies={data.frequencies} locale={data.locale} {forms}>
			{#snippet fields()}
				<label class={label}>
					<span class={labelText}>{m.maintenance.keep}</span>
					<input
						type="number"
						name="keep"
						min="1"
						max={data.maxKeep}
						value={data.keep}
						required
						class="w-28"
					/>
				</label>
				<div class="sm:col-span-2"><Notice>{m.maintenance.volumeHint}</Notice></div>
			{/snippet}

			<!-- The backups that are there -->
			<div class="mt-6 border-t border-line pt-4">
				<div class="flex min-h-9 items-center justify-between gap-3">
					<h3 class="font-medium">{m.maintenance.backups}</h3>
					{#if data.files.length}
						<form
							method="POST"
							action="?/deleteAll"
							use:enhance={() =>
								async ({ update }) => {
									await update();
									confirmDeleteAll = false;
								}}
						>
							{#if confirmDeleteAll}
								<span class="flex items-center gap-2 text-sm">
									<button class="btn-danger py-1.5!">{m.maintenance.deleteAllConfirm}</button>
									<button
										type="button"
										class="btn-quiet"
										onclick={() => (confirmDeleteAll = false)}
									>
										{m.common.cancel}
									</button>
								</span>
							{:else}
								<button
									type="button"
									class="rounded-lg px-3 py-1.5 text-sm text-danger transition-colors hover:bg-danger/10"
									onclick={() => (confirmDeleteAll = true)}
								>
									{m.maintenance.deleteAll}
								</button>
							{/if}
						</form>
					{/if}
				</div>
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
										aria-label={m.maintenance.download}
										title={m.maintenance.download}
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
										<span class="mr-auto text-sm">{m.maintenance.deleteQuestion}</span>
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
					<p class="mt-2 text-sm text-muted">{m.maintenance.noBackups}</p>
				{/if}
				<p class="mt-3 {hint}">
					{m.maintenance.restoreHint}
					<a
						href="{WIKI}/Backups-and-restore"
						target="_blank"
						rel="noopener noreferrer"
						class={ui.link}>{m.maintenance.restoreLink}</a
					>
				</p>
			</div>
		</TaskCard>
	{:else}
		<TaskCard {task} frequencies={data.frequencies} locale={data.locale} {forms} />
	{/if}
{/each}
