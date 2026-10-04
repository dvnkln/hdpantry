<script lang="ts">
	import { enhance } from '$app/forms';
	import { codeLabel, containerLabel, MAX_CONTAINER_NAME } from '$lib/containers';
	import { formatDate, m } from '$lib/i18n/index.svelte';
	import { ArrowLeft, Check, Trash2 } from '@lucide/svelte';

	let { data, form } = $props();
	let container = $derived(data.container);

	// What is typed into the name field; starts with the saved name
	// svelte-ignore state_referenced_locally
	let name = $state(data.container.name ?? '');
	let changed = $derived(name.trim() !== (container.name ?? ''));
	let confirmDelete = $state(false);
</script>

<svelte:head><title>{containerLabel(container)} · hdpantry</title></svelte:head>

<main class="mx-auto max-w-md px-4 py-6">
	<a href="/containers" class="-ml-2 inline-flex items-center gap-1.5 btn-quiet">
		<ArrowLeft size={16} />
		{m.containers.title}
	</a>

	<h1 class="mt-2 text-xl font-bold break-words">{containerLabel(container)}</h1>
	{#if container.name}
		<p class="font-mono text-sm text-muted">{codeLabel(container)}</p>
	{/if}

	<p class="mt-4 rounded-xl border border-line bg-surface p-3 text-sm text-muted">
		{m.containers.emptyContainer}
	</p>

	<!-- reset: false keeps the typed name in the field after saving -->
	<form
		method="POST"
		action="?/rename"
		use:enhance={() =>
			({ update }) =>
				update({ reset: false })}
		class="mt-6 flex flex-col gap-1"
	>
		<label for="name" class="text-sm font-medium">{m.containers.nameOptional}</label>
		<div class="flex gap-2">
			<input
				id="name"
				name="name"
				bind:value={name}
				maxlength={MAX_CONTAINER_NAME}
				placeholder={m.containers.namePlaceholder}
				autocomplete="off"
				class="min-w-0 flex-1"
			/>
			<button class="btn-primary" disabled={!changed}>{m.common.save}</button>
		</div>
		{#if form?.saved && !changed}
			<p class="flex items-center gap-1 text-sm text-accent" role="status">
				<Check size={14} />
				{m.common.saved}
			</p>
		{/if}
	</form>

	<dl class="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
		<dt class="text-muted">{m.containers.code}</dt>
		<dd class="font-mono">{container.code}</dd>
		{#if container.size}
			<dt class="text-muted">{m.containers.size}</dt>
			<dd>{container.size.toUpperCase()}</dd>
		{/if}
		<dt class="text-muted">{m.containers.added}</dt>
		<dd>{formatDate(container.createdAt)}</dd>
		<dt class="text-muted">{m.containers.rawContent}</dt>
		<dd class="font-mono text-xs break-all">{container.rawContent}</dd>
	</dl>

	<div class="mt-8 border-t border-line pt-4">
		{#if confirmDelete}
			<p class="text-sm">{m.containers.deleteQuestion}</p>
			<form method="POST" action="?/delete" use:enhance class="mt-3 flex gap-2">
				<button type="button" class="flex-1 btn-secondary" onclick={() => (confirmDelete = false)}>
					{m.common.cancel}
				</button>
				<button class="flex-1 btn-danger">{m.containers.deleteConfirm}</button>
			</form>
		{:else}
			<button
				type="button"
				class="-ml-2 flex items-center gap-1.5 btn-quiet hover:text-danger"
				onclick={() => (confirmDelete = true)}
			>
				<Trash2 size={16} />
				{m.containers.delete}
			</button>
		{/if}
	</div>
</main>
