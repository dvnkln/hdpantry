<script lang="ts">
	import { enhance } from '$app/forms';
	import { codeLabel } from '$lib/containers';
	import { m } from '$lib/i18n/index.svelte';
	import { Combine, Info, Pencil, Trash2 } from '@lucide/svelte';
	import type { SubmitFunction } from './$types';

	let { data, form } = $props();

	// What is open right now: one question or small form at a time
	type Panel =
		{ kind: 'delete' | 'code' | 'merge' | 'info'; id: number } | { kind: 'all'; id: 0 } | null;
	let panel = $state<Panel>(null);
	let typed = $state('');
	let code = $state('');

	// Tapping the same action again closes its panel
	function open(next: Panel, startCode = '') {
		if (next && panel?.kind === next.kind && panel.id === next.id) next = null;
		panel = next;
		typed = '';
		code = startCode;
	}
	const isOpen = (kind: string, id: number) => panel?.kind === kind && panel.id === id;

	// Closes the panel when the action went through; errors stay visible in it
	const submit: SubmitFunction =
		() =>
		async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') open(null);
		};
</script>

<svelte:head><title>{m.settings.containers} · hdpantry</title></svelte:head>

<section>
	<h1 class="text-lg font-semibold">{m.settings.containers}</h1>
	<p class="mt-1 text-sm text-muted">{m.settings.containersHint}</p>

	{#if data.containers.length === 0}
		<p class="mt-3 text-sm text-muted">{m.settings.noContainers}</p>
	{:else}
		<ul class="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
			{#each data.containers as container (container.id)}
				<li class="border-b border-line px-4 py-3 last:border-b-0">
					<!-- Name (leads to the container) and, always at the same place, the bin -->
					<div class="flex items-center gap-2">
						<span class="min-w-0 flex-1">
							<!-- Only the label itself leads to the container, not the whole row -->
							<a
								href="/containers/{container.id}"
								class="font-medium underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
								title={m.settings.open}
							>
								{codeLabel(container)}
							</a>
							<span class="block truncate text-sm text-muted">
								{[
									container.manual ? m.settings.typed : '',
									container.content ?? m.settings.empty,
									container.history ? m.settings.history(container.history) : ''
								]
									.filter(Boolean)
									.join(' · ')}
							</span>
						</span>
						{#if container.rawContent}
							<button
								type="button"
								class="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-bg hover:text-text"
								aria-label={m.settings.showCode}
								title={m.settings.showCode}
								aria-expanded={isOpen('info', container.id)}
								onclick={() => open({ kind: 'info', id: container.id })}
							>
								<Info size={18} />
							</button>
						{/if}
						<button
							type="button"
							class="-mr-2 shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-bg hover:text-danger"
							aria-label={m.settings.delete}
							title={m.settings.delete}
							onclick={() => open({ kind: 'delete', id: container.id })}
						>
							<Trash2 size={18} />
						</button>
					</div>
					<!-- Only containers recorded by hand have more to offer -->
					{#if container.manual}
						<div class="mt-1 -ml-2 flex gap-x-1">
							<button
								type="button"
								class="flex items-center gap-1.5 btn-quiet"
								onclick={() => open({ kind: 'code', id: container.id }, container.code)}
							>
								<Pencil size={16} />
								{m.settings.changeCode}
							</button>
							{#if container.twin}
								<button
									type="button"
									class="flex items-center gap-1.5 btn-quiet"
									onclick={() => open({ kind: 'merge', id: container.id })}
								>
									<Combine size={16} />
									{m.settings.merge}
								</button>
							{/if}
						</div>
					{/if}

					{#if isOpen('info', container.id)}
						<div class="mt-3">
							<p class="text-sm text-muted">{m.settings.codeContent}</p>
							<p class="font-mono text-xs break-all">{container.rawContent}</p>
						</div>
					{:else if isOpen('delete', container.id)}
						<form method="POST" action="?/deleteContainer" use:enhance={submit} class="mt-3">
							<input type="hidden" name="id" value={container.id} />
							<p class="text-sm">
								{m.settings.deleteQuestion(
									codeLabel(container),
									container.content,
									container.history
								)}
							</p>
							<div class="mt-3 flex gap-2">
								<button type="button" class="flex-1 btn-secondary" onclick={() => open(null)}>
									{m.common.cancel}
								</button>
								<button class="flex-1 btn-danger">{m.settings.deleteConfirm}</button>
							</div>
						</form>
					{:else if isOpen('code', container.id)}
						<form
							method="POST"
							action="?/changeCode"
							use:enhance={submit}
							class="mt-3 flex flex-col gap-3"
						>
							<input type="hidden" name="id" value={container.id} />
							<label class="flex flex-col gap-1">
								<span class="text-sm font-medium">{m.settings.newCode}</span>
								<!-- svelte-ignore a11y_autofocus -->
								<input
									name="code"
									bind:value={code}
									autocomplete="off"
									autocapitalize="characters"
									spellcheck="false"
									autofocus
									class="font-mono"
								/>
							</label>
							{#if form?.error && form.id === container.id}
								<p class="form-error" role="alert">{form.error}</p>
							{/if}
							<div class="flex gap-2">
								<button type="button" class="flex-1 btn-secondary" onclick={() => open(null)}>
									{m.common.cancel}
								</button>
								<button class="flex-1 btn-primary" disabled={!code.trim()}>{m.common.save}</button>
							</div>
						</form>
					{:else if isOpen('merge', container.id) && container.bothFull}
						<!-- Not possible right now: only say why -->
						<p class="mt-3 notice" role="status">
							<Info size={18} class="mt-0.5 shrink-0" />
							{m.settings.mergeProblems.bothFull}
						</p>
					{:else if isOpen('merge', container.id)}
						<form method="POST" action="?/merge" use:enhance={submit} class="mt-3">
							<input type="hidden" name="id" value={container.id} />
							<p class="text-sm">{m.settings.mergeQuestion(container.code)}</p>
							{#if form?.error && form.id === container.id}
								<p class="mt-3 form-error" role="alert">{form.error}</p>
							{/if}
							<div class="mt-3 flex gap-2">
								<button type="button" class="flex-1 btn-secondary" onclick={() => open(null)}>
									{m.common.cancel}
								</button>
								<button class="flex-1 btn-primary">{m.settings.mergeConfirm}</button>
							</div>
						</form>
					{/if}
				</li>
			{/each}
		</ul>

		<div class="mt-6 rounded-xl border border-danger p-4">
			<h3 class="font-semibold">{m.settings.deleteAll}</h3>
			<p class="mt-1 text-sm text-muted">{m.settings.deleteAllHint}</p>
			{#if isOpen('all', 0)}
				<form
					method="POST"
					action="?/deleteAll"
					use:enhance={submit}
					class="mt-3 flex flex-col gap-3"
				>
					<p class="text-sm">{m.settings.deleteAllQuestion(data.containers.length)}</p>
					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium">
							{m.settings.typeToConfirm(m.settings.deleteWord)}
						</span>
						<input
							name="confirm"
							bind:value={typed}
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
						/>
					</label>
					{#if form?.error && form.id === 0}
						<p class="form-error" role="alert">{form.error}</p>
					{/if}
					<div class="flex gap-2">
						<button type="button" class="flex-1 btn-secondary" onclick={() => open(null)}>
							{m.common.cancel}
						</button>
						<button
							class="flex-1 btn-danger disabled:opacity-50"
							disabled={typed.trim() !== m.settings.deleteWord}
						>
							{m.settings.deleteAllConfirm}
						</button>
					</div>
				</form>
			{:else}
				<button
					type="button"
					class="mt-2 -ml-2 flex items-center gap-1.5 btn-quiet hover:text-danger"
					onclick={() => open({ kind: 'all', id: 0 })}
				>
					<Trash2 size={16} />
					{m.settings.deleteAll}
				</button>
			{/if}
		</div>
	{/if}
</section>
