<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '$lib/i18n/index.svelte';
	import { proxySnippets } from '$lib/proxySnippets';
	import {
		Check,
		CircleCheck,
		Copy,
		Eye,
		EyeOff,
		Info,
		LockKeyhole,
		LockKeyholeOpen,
		TriangleAlert
	} from '@lucide/svelte';

	let { data, form } = $props();

	// ---- How this request reached hdpantry ----
	let c = $derived(data.connection);
	// A proxy passed an address along
	let viaProxy = $derived(c.forwarded !== null);
	let confirmed = $derived(viaProxy && c.via !== null);
	let pending = $derived(viaProxy && c.via === null);
	// Direct visitors that Docker forwards itself all arrive from one address and share one block
	let shared = $derived(!viaProxy && c.hidden);
	// "Recognised as" is the address wrong passwords are counted for. What an unconfirmed proxy
	// reports is shown as well, but clearly as not used yet.
	let rows = $derived(
		[
			{ label: m.settings.recognisedAs, value: c.address, note: '' },
			pending && {
				label: m.settings.proxyReports,
				value: c.forwarded!,
				note: m.settings.notUsedYet
			},
			confirmed && {
				label: m.settings.confirmedBy,
				value: c.via === 'key' ? m.settings.byKey : m.settings.byAddress,
				note: ''
			}
		].filter((row) => !!row)
	);

	// Ready-made lines for the proxy's configuration, with the key filled in
	let SNIPPETS = $derived(proxySnippets(data.proxyKeyHeader, data.proxyKey));
	let proxy = $state('Nginx Proxy Manager');
	let current = $derived(SNIPPETS.find((s) => s.name === proxy) ?? SNIPPETS[0]);
	let keyOpen = $state(false);
	let listOpen = $state(false);
	let copied = $state(false);
	// The key is hidden until asked for; copying always takes the real line
	let keyShown = $state(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(current.code);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// No clipboard without https: show the key, so the line can be marked and copied by hand
			keyShown = true;
		}
	}
</script>

<svelte:head><title>{m.settings.connection} · hdpantry</title></svelte:head>

{#snippet step(n: number, title: string, done = false)}
	<p class="flex items-center gap-2.5 text-sm font-medium">
		<span
			class="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold {done
				? 'bg-accent text-on-accent'
				: 'border border-line bg-surface'}"
		>
			{#if done}<Check size={14} strokeWidth={3} />{:else}{n}{/if}
		</span>
		{title}
	</p>
{/snippet}

<!-- The proxy proves itself with a key: create it, add one line to the proxy, reload -->
{#snippet keySteps()}
	<div class="flex flex-col gap-4">
		<div>
			{@render step(1, m.settings.keyStep1, !!data.proxyKey)}
			<form
				method="POST"
				action="?/proxyKey"
				use:enhance={() => {
					keyOpen = true;
					return ({ update }) => update();
				}}
				class="mt-2 ml-8.5 flex flex-wrap items-center gap-3"
			>
				{#if data.proxyKey}
					<button class="btn-quiet underline">{m.settings.newKey}</button>
					<button name="remove" value="1" class="btn-quiet underline hover:text-danger">
						{m.settings.removeKey}
					</button>
				{:else}
					<button class="btn-secondary">{m.settings.createKey}</button>
				{/if}
			</form>
		</div>

		{#if data.proxyKey}
			<div>
				{@render step(2, m.settings.keyStep2)}
				<div class="mt-2 ml-8.5">
					<div class="flex flex-wrap gap-1">
						{#each SNIPPETS as snippet (snippet.name)}
							<button
								type="button"
								class="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:border-accent {proxy ===
								snippet.name
									? 'border-accent font-semibold text-accent'
									: 'border-line text-muted'}"
								aria-pressed={proxy === snippet.name}
								onclick={() => (proxy = snippet.name)}>{snippet.name}</button
							>
						{/each}
					</div>
					<div class="mt-2 rounded-lg border border-line bg-surface p-3">
						<pre class="font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">{keyShown
								? current.code
								: current.masked}</pre>
						<p class="mt-2 text-sm text-muted">{m.settings.snippetWhere[current.where]}</p>
						<div class="mt-3 flex items-center gap-2">
							<button
								type="button"
								class="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent"
								onclick={copy}
							>
								{#if copied}<Check size={16} class="text-good" />{m.settings.copied}{:else}<Copy
										size={16}
									/>{m.settings.copy}{/if}
							</button>
							<button
								type="button"
								class="rounded-lg border border-line p-2 text-muted transition-colors hover:border-accent hover:text-text"
								aria-pressed={keyShown}
								aria-label={keyShown ? m.settings.hideKey : m.settings.showKey}
								title={keyShown ? m.settings.hideKey : m.settings.showKey}
								onclick={() => (keyShown = !keyShown)}
							>
								{#if keyShown}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
			<div>{@render step(3, m.settings.keyStep3, confirmed)}</div>
		{/if}
	</div>
{/snippet}

<h1 class="text-lg font-semibold">{m.settings.connection}</h1>

<section class="mt-4 max-w-xl">
	<h2 class="font-medium">{m.settings.https}</h2>
	<p class="mt-2 flex items-center gap-2 font-medium {data.https ? 'text-good' : 'text-caution'}">
		{#if data.https}<LockKeyhole size={18} class="shrink-0" />{:else}<LockKeyholeOpen
				size={18}
				class="shrink-0"
			/>{/if}
		{data.https ? m.settings.httpsOn : m.settings.httpsOff}
	</p>
	<p class="mt-1.5 text-sm text-muted">
		{data.https ? m.settings.httpsOnHint : m.settings.httpsOffHint}
	</p>
	<p class="mt-3 text-sm text-muted">{m.settings.origins}</p>
	{#if data.origins.length}
		<ul class="mt-1 text-sm">
			{#each data.origins as origin (origin)}<li class="break-all">{origin}</li>{/each}
		</ul>
	{:else}
		<p class="mt-1 text-sm">{m.settings.originsNone}</p>
	{/if}
</section>

<section class="mt-8 max-w-xl">
	<h2 class="font-medium">{m.settings.proxy}</h2>

	<!-- Status at a glance -->
	<p
		class="mt-2 flex items-center gap-2 font-medium {pending
			? 'text-caution'
			: shared
				? ''
				: 'text-good'}"
	>
		{#if pending}<TriangleAlert size={18} class="shrink-0" />{:else if shared}<Info
				size={18}
				class="shrink-0"
			/>{:else}<CircleCheck size={18} class="shrink-0" />{/if}
		{confirmed ? m.settings.proxyConfirmed : pending ? m.settings.proxyPending : m.settings.direct}
	</p>
	<p class="mt-1.5 text-sm text-muted">
		{pending ? m.settings.pendingWhy : shared ? m.settings.sharedWhy : m.settings.ownBlock}
	</p>

	<dl class="mt-4 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1.5 text-sm">
		{#each rows as row (row.label)}
			<dt class="text-muted">{row.label}</dt>
			<dd class="break-all">
				{row.value}
				{#if row.note}<span class="ml-1 text-muted">{row.note}</span>{/if}
			</dd>
		{/each}
	</dl>
	{#if !viaProxy}<p class="mt-3 text-sm text-muted">{m.settings.directHint}</p>{/if}

	{#if pending && !c.hidden}
		<!-- The proxy has an address of its own: one tap enters it -->
		<form method="POST" action="?/proxies" use:enhance class="mt-4">
			<input
				type="hidden"
				name="proxies"
				value={[data.trustedProxies, c.peer].filter(Boolean).join(', ')}
			/>
			<button class="btn-primary">{m.settings.confirmProxy}</button>
		</form>
	{:else if pending}
		<!-- Docker hides the proxy's address: it proves itself with a key -->
		<div class="mt-5 border-t border-line pt-4">{@render keySteps()}</div>
	{:else if confirmed && c.via === 'key'}
		<details class="mt-5 border-t border-line pt-4" open={keyOpen}>
			<summary class="cursor-pointer text-sm font-medium transition-colors hover:text-accent">
				{m.settings.manageKey}
			</summary>
			<div class="mt-4">{@render keySteps()}</div>
		</details>
	{/if}

	<!-- By address: only where addresses are visible at all (or something was entered) -->
	{#if (viaProxy && !c.hidden) || data.trustedProxies}
		<details class="mt-4 border-t border-line pt-4" open={listOpen}>
			<summary class="cursor-pointer text-sm font-medium transition-colors hover:text-accent">
				{m.settings.trustedProxies}
			</summary>
			<form
				method="POST"
				action="?/proxies"
				use:enhance={() => {
					listOpen = true;
					return ({ update }) => update({ reset: false });
				}}
				class="mt-3 flex flex-col gap-3"
			>
				<label class="flex flex-col gap-1">
					<span class="text-sm text-muted">{m.settings.trustedProxiesHint}</span>
					<input
						name="proxies"
						aria-label={m.settings.trustedProxies}
						value={form?.proxies ?? data.trustedProxies}
						placeholder="192.168.1.10, 172.18.0.0/16"
						autocomplete="off"
						autocapitalize="off"
						spellcheck="false"
					/>
				</label>
				{#if form?.error}
					<p class="form-error" role="alert">{form.error}</p>
				{:else if form?.saved}
					<p class="text-sm text-good" role="status">{m.settings.proxiesSaved}</p>
				{/if}
				<button class="self-start btn-secondary">{m.common.save}</button>
			</form>
		</details>
	{/if}

	<p class="mt-4 text-sm text-muted">{m.settings.connectionGuide}</p>
</section>
