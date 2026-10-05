<script lang="ts">
	import { onMount } from 'svelte';
	import { deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { m } from '$lib/i18n/index.svelte';
	import { NOTIFY_MODES, REMINDER_KINDS } from '$lib/reminders';
	import { WIKI, ui } from '$lib/ui';
	import {
		Bell,
		BellOff,
		BellRing,
		CalendarClock,
		Check,
		LoaderCircle,
		MonitorSmartphone,
		Pencil,
		Send,
		Trash2,
		TriangleAlert
	} from '@lucide/svelte';

	let { data, form } = $props();

	// ---- This device ----
	// What this browser can do, found out after loading (the server cannot know it).
	type State = 'checking' | 'unsupported' | 'insecure' | 'blocked' | 'off' | 'on';
	let support = $state<State>('checking');
	// Address of this browser at its push service, if it is subscribed
	let endpoint = $state<string | null>(null);
	let busy = $state(false);
	let sending = $state(false);
	let feedback = $state<{ ok: boolean; text: string } | undefined>();
	// Device whose name is being changed
	let editing = $state<number | null>(null);

	// "On" only if the server knows this device too (it may have been removed elsewhere).
	let known = $derived(data.devices.some((device) => device.endpoint === endpoint));

	async function check() {
		if (!window.isSecureContext) return (support = 'insecure');
		if (
			!('serviceWorker' in navigator) ||
			!('PushManager' in window) ||
			!('Notification' in window)
		) {
			return (support = 'unsupported');
		}
		if (Notification.permission === 'denied') return (support = 'blocked');
		const registration = await navigator.serviceWorker.getRegistration();
		const subscription = await registration?.pushManager.getSubscription();
		endpoint = subscription?.endpoint ?? null;
		support = subscription ? 'on' : 'off';
	}
	onMount(() => {
		check().catch(() => (support = 'unsupported'));
	});

	// Sends a form action without a form (the subscription comes from the browser, not from fields).
	async function post(action: string, fields: Record<string, string>) {
		const body = new FormData();
		for (const [key, value] of Object.entries(fields)) body.set(key, value);
		const response = await fetch(`?/${action}`, {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await response.text());
		const answer = (
			result.type === 'success' || result.type === 'failure' ? result.data : null
		) as { message?: string; error?: string } | null;
		await invalidateAll();
		return answer?.error
			? { ok: false, text: answer.error }
			: { ok: result.type === 'success', text: answer?.message ?? '' };
	}

	async function enable() {
		busy = true;
		feedback = undefined;
		try {
			if ((await Notification.requestPermission()) !== 'granted') {
				support = Notification.permission === 'denied' ? 'blocked' : 'off';
				return;
			}
			const registration = await navigator.serviceWorker.getRegistration();
			if (!registration) {
				feedback = { ok: false, text: m.notifications.notReady };
				return;
			}
			// A subscription left over from before (e.g. made for another installation's key) would
			// make subscribing fail: start clean.
			const old = await registration.pushManager.getSubscription();
			await old?.unsubscribe();
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: data.publicKey
			});
			// The old address is dead now: the server takes it out of the list, so a test does not
			// report a device that is no longer there
			const answer = await post('subscribe', {
				subscription: JSON.stringify(subscription),
				replaces: old?.endpoint ?? ''
			});
			// The server did not take it: do not stay subscribed for nothing
			if (!answer.ok) await subscription.unsubscribe();
			feedback = answer;
			await check();
		} catch (err) {
			console.error(err);
			feedback = { ok: false, text: m.notifications.failed };
		} finally {
			busy = false;
		}
	}

	// Ends the subscription in this browser (used when this device is removed from the list).
	async function forget(removedEndpoint: string) {
		if (removedEndpoint !== endpoint) return;
		const registration = await navigator.serviceWorker.getRegistration();
		await (await registration?.pushManager.getSubscription())?.unsubscribe();
		await check();
	}

	const STATUS = $derived(
		{
			checking: { text: '…', tone: 'text-muted', icon: Bell, note: '' },
			unsupported: {
				text: m.notifications.unsupported,
				tone: 'text-caution',
				icon: TriangleAlert,
				note: m.notifications.unsupportedHint
			},
			insecure: {
				text: m.notifications.needsHttps,
				tone: 'text-caution',
				icon: TriangleAlert,
				note: m.notifications.needsHttpsHint
			},
			blocked: {
				text: m.notifications.blocked,
				tone: 'text-danger',
				icon: BellOff,
				note: m.notifications.blockedHint
			},
			off: { text: m.notifications.off, tone: 'text-muted', icon: BellOff, note: '' },
			on: { text: m.notifications.on, tone: 'text-good', icon: BellRing, note: '' }
		}[support === 'on' && !known ? 'off' : support]
	);

	function day(iso: string) {
		return new Date(iso).toLocaleDateString(data.locale, { dateStyle: 'medium' });
	}
	function moment(iso: string) {
		return new Date(iso).toLocaleString(data.locale, { dateStyle: 'medium', timeStyle: 'short' });
	}
	const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
	const choice =
		'cursor-pointer rounded-lg border bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-accent';
	const chosen = 'border-accent font-semibold text-accent ring-2 ring-accent';
	function kindHint(kind: (typeof REMINDER_KINDS)[number]) {
		return kind === 'soon'
			? m.notifications.kindHints.soon(data.soonDays)
			: m.notifications.kindHints[kind];
	}
	const iconButton =
		'inline-flex shrink-0 items-center rounded-lg border border-line p-2 text-muted transition-colors hover:border-accent hover:text-text';
</script>

<svelte:head><title>{m.notifications.title} · hdpantry</title></svelte:head>

{#snippet note(ok: boolean, text: string)}
	<p class="text-sm {ok ? 'text-good' : 'text-danger'}" role={ok ? 'status' : 'alert'}>{text}</p>
{/snippet}

<h1 class={ui.pageTitle}>{m.notifications.title}</h1>

<!-- This device: status in colour, one button -->
<section class={ui.card}>
	<h2 class={ui.heading}><Bell size={20} class="text-muted" />{m.notifications.thisDevice}</h2>
	<p class="mt-3 flex items-center gap-2 font-medium {STATUS.tone}">
		<STATUS.icon size={18} class="shrink-0" />{STATUS.text}
	</p>
	{#if STATUS.note}<p class="mt-1 text-sm text-muted">{STATUS.note}</p>{/if}
	{#if support === 'off' || (support === 'on' && !known)}
		<div class="mt-4 flex flex-wrap items-center gap-3">
			<button
				type="button"
				class="inline-flex items-center gap-2 btn-primary disabled:opacity-50"
				disabled={busy}
				onclick={enable}
			>
				{#if busy}<LoaderCircle size={18} class="animate-spin" />{/if}
				{m.notifications.enable}
			</button>
			{#if feedback}{@render note(feedback.ok, feedback.text)}{/if}
		</div>
	{:else if feedback}
		<div class="mt-3">{@render note(feedback.ok, feedback.text)}</div>
	{/if}
	<p class="mt-4 text-sm text-muted">
		<a href="{WIKI}/Privacy-and-security" target="_blank" rel="noopener noreferrer" class={ui.link}
			>{m.notifications.learnMore}</a
		>
	</p>
</section>

<!-- What to be reminded of, and when. Every choice is saved as soon as it is made. -->
<section class={ui.card}>
	<h2 class={ui.heading}>
		<CalendarClock size={20} class="text-muted" />{m.notifications.reminders}
	</h2>
	<form method="POST" action="?/prefs" use:enhance class="mt-3">
		<fieldset>
			<legend class="text-sm font-medium">{m.notifications.mode}</legend>
			<div class="mt-1 flex flex-col gap-2">
				{#each NOTIFY_MODES as mode (mode)}
					<button
						name="mode"
						value={mode}
						class="{choice} {data.prefs.mode === mode ? chosen : 'border-line'}"
						aria-pressed={data.prefs.mode === mode}
					>
						{m.notifications.modes[mode]}
					</button>
				{/each}
			</div>
		</fieldset>
	</form>

	<!-- The rest only matters while reminders are on -->
	{#if data.prefs.mode !== 'off'}
		{#if data.devices.length === 0}
			<p class="mt-3 notice">
				<TriangleAlert size={18} class="mt-0.5 shrink-0 text-warn" />
				<span>{m.notifications.needsDevice}</span>
			</p>
		{/if}
		<form
			method="POST"
			action="?/prefs"
			use:enhance={() =>
				({ update }) =>
					update({ reset: false })}
			class="mt-4"
		>
			<label class="flex max-w-48 flex-col gap-1">
				<span class="text-sm font-medium">{m.notifications.hour}</span>
				<select
					name="hour"
					value={String(data.prefs.hour)}
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
				>
					{#each HOURS as hour (hour)}
						<option value={String(hour)}>{m.notifications.oclock(hour)}</option>
					{/each}
				</select>
			</label>
		</form>

		<p class="mt-4 text-sm font-medium">{m.notifications.occasions}</p>
		<div class="mt-1 flex flex-col divide-y divide-line">
			{#each REMINDER_KINDS as kind (kind)}
				{@const on = data.prefs.kinds[kind]}
				<form method="POST" action="?/prefs" use:enhance class="py-2.5">
					<input type="hidden" name="kind" value={kind} />
					<button
						name="on"
						value={on ? 'off' : 'on'}
						class="flex w-full items-center justify-between gap-4 text-left"
						role="switch"
						aria-checked={on}
					>
						<span>
							<span class="block text-sm">{m.notifications.kinds[kind]}</span>
							<span class="block text-xs text-muted">{kindHint(kind)}</span>
						</span>
						<span
							class="relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors {on
								? 'bg-accent'
								: 'bg-line'}"
						>
							<span
								class="absolute top-0.5 left-0.5 size-6 rounded-full bg-surface shadow transition-transform {on
									? 'translate-x-5'
									: ''}"
							></span>
						</span>
					</button>
				</form>
			{/each}
		</div>
		<p class="mt-2 text-sm text-muted">{m.notifications.what}</p>
	{/if}
</section>

<!-- All devices, with a test message -->
<section class={ui.card}>
	<h2 class={ui.heading}>
		<MonitorSmartphone size={20} class="text-muted" />{m.notifications.devices}
	</h2>
	<!-- Also shown when the last device just went (a test found it gone) -->
	{#if form && (form.section === 'test' || form.section === 'devices')}
		<div class="mt-3">
			{@render note(!('error' in form), ('error' in form ? form.error : form.message) ?? '')}
		</div>
	{/if}
	{#if data.devices.length === 0}
		<p class="mt-3 text-sm text-muted">{m.notifications.noDevices}</p>
	{:else}
		<ul class="mt-3 flex flex-col divide-y divide-line">
			{#each data.devices as device (device.id)}
				<li class="flex items-center justify-between gap-3 py-2.5">
					{#if editing === device.id}
						<!-- Renaming: the name becomes a field; Enter or the tick saves -->
						<form
							method="POST"
							action="?/rename"
							use:enhance={() =>
								async ({ result, update }) => {
									await update();
									if (result.type === 'success') editing = null;
								}}
							class="flex min-w-0 flex-1 items-center gap-2"
						>
							<input type="hidden" name="id" value={device.id} />
							<!-- svelte-ignore a11y_autofocus -->
							<input
								name="label"
								value={device.label}
								maxlength="40"
								required
								autofocus
								aria-label={m.notifications.name}
								class="min-w-0 flex-1"
								onkeydown={(e) => e.key === 'Escape' && (editing = null)}
							/>
							<button class={iconButton} title={m.common.save} aria-label={m.common.save}>
								<Check size={18} />
							</button>
						</form>
					{:else}
						<div class="min-w-0 flex-1">
							<p class="flex items-center gap-1.5 text-sm font-medium">
								<span class="truncate">{device.label}</span>
								<button
									type="button"
									class="shrink-0 rounded p-1 text-muted transition-colors hover:text-text"
									title={m.notifications.rename}
									aria-label={m.notifications.rename}
									onclick={() => (editing = device.id)}
								>
									<Pencil size={14} />
								</button>
								{#if device.endpoint === endpoint}
									<span class="shrink-0 font-normal text-good">· {m.notifications.here}</span>
								{/if}
							</p>
							<p class="text-xs text-muted">
								{m.notifications.added(day(device.createdAt))} ·
								{device.lastOkAt
									? m.notifications.lastReached(moment(device.lastOkAt))
									: m.notifications.neverReached}
							</p>
						</div>
					{/if}
					<form
						method="POST"
						action="?/unsubscribe"
						use:enhance={() =>
							async ({ result, update }) => {
								await update();
								if (result.type === 'success') await forget(device.endpoint);
							}}
					>
						<input type="hidden" name="id" value={device.id} />
						<button
							class="{iconButton} hover:text-danger"
							title={m.notifications.remove}
							aria-label={m.notifications.remove}
						>
							<Trash2 size={18} />
						</button>
					</form>
				</li>
			{/each}
		</ul>
		<form
			method="POST"
			action="?/test"
			use:enhance={() => {
				sending = true;
				return async ({ update }) => {
					await update();
					sending = false;
					// A device the push service no longer knows was removed: show the list as it is now
					await invalidateAll();
				};
			}}
			class="mt-4 flex flex-wrap items-center gap-3"
		>
			<button
				class="inline-flex items-center gap-2 btn-secondary disabled:opacity-50"
				disabled={sending}
			>
				{#if sending}<LoaderCircle size={18} class="animate-spin" />{:else}<Send size={18} />{/if}
				{m.notifications.test}
			</button>
		</form>
	{/if}
</section>
