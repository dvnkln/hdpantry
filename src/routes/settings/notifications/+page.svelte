<script lang="ts">
	import { enhance } from '$app/forms';
	import { autosave } from '$lib/autosave';
	import FeedbackText from '$lib/components/FeedbackText.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import TargetList from '$lib/components/TargetList.svelte';
	import { FormFeedback } from '$lib/forms.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { NOTIFY_MODES, REMINDER_KINDS, SOON_REPEATS, type ReminderKind } from '$lib/reminders';
	import { WIKI, ui } from '$lib/ui';
	import { CalendarClock, Send } from '@lucide/svelte';

	let { data } = $props();

	const forms = new FormFeedback();
	const { card, heading, label, labelText, hint } = ui;
	const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
	// What is chosen right now (decides whether hour and occasions are shown)
	// svelte-ignore state_referenced_locally
	let mode = $state(data.prefs.mode);
	// "Expires soon" can be told once or every day; the choice sits in its row while it is on
	// svelte-ignore state_referenced_locally
	let soonOn = $state(data.prefs.kinds.soon);
	// svelte-ignore state_referenced_locally
	let soonRepeat = $state(data.prefs.soonRepeat);
	function kindHint(kind: ReminderKind) {
		return kind === 'soon'
			? m.notifications.kindHints.soon(data.soonDays, soonRepeat === 'daily')
			: m.notifications.kindHints[kind];
	}
</script>

<svelte:head><title>{m.notifications.title} · hdpantry</title></svelte:head>

<h1 class={ui.pageTitle}>{m.notifications.title}</h1>

<!-- What to be reminded of, and when. Saved the moment a choice is made. -->
<section class={card}>
	<!-- (Should saving fail, the reason is shown up here.) -->
	<div class="flex min-h-7 items-center justify-between gap-3">
		<h2 class={heading}>
			<CalendarClock size={20} class="text-muted" />{m.notifications.reminders}
		</h2>
		<FeedbackText feedback={forms.error('prefs')} />
	</div>
	<form
		method="POST"
		action="?/prefs"
		use:enhance={forms.submit('prefs')}
		use:autosave
		class="mt-4 flex flex-col gap-4"
	>
		<fieldset class="flex flex-col gap-2">
			<legend class="{labelText} mb-2">{m.notifications.mode}</legend>
			{#each NOTIFY_MODES as option (option)}
				<label class={ui.option}>
					<input type="radio" name="mode" value={option} bind:group={mode} class={ui.radio} />
					<span>{m.notifications.modes[option]}</span>
				</label>
			{/each}
		</fieldset>
		<!-- Hour and occasions only matter while reminders are on; switched off, they are kept -->
		{#if mode === 'off'}
			<input type="hidden" name="hour" value={data.prefs.hour} />
			<input type="hidden" name="soonRepeat" value={soonRepeat} />
			{#each REMINDER_KINDS as kind (kind)}
				{#if data.prefs.kinds[kind]}<input type="hidden" name={kind} value="on" />{/if}
			{/each}
		{:else}
			<label class="{label} max-w-48">
				<span class={labelText}>{m.notifications.hour}</span>
				<select name="hour" value={String(data.prefs.hour)}>
					{#each HOURS as hour (hour)}
						<option value={String(hour)}>{m.notifications.oclock(hour)}</option>
					{/each}
				</select>
			</label>
			<div>
				<p class={labelText}>{m.notifications.occasions}</p>
				<div class="mt-1 flex flex-col divide-y divide-line">
					{#each REMINDER_KINDS as kind (kind)}
						<div class="flex items-start justify-between gap-4 py-2.5">
							<div class="flex flex-col gap-1">
								<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
									<label for="kind-{kind}" class="cursor-pointer text-sm">
										{m.notifications.kinds[kind]}
									</label>
									{#if kind === 'soon'}
										<!-- Once or every day: a small two-part toggle next to the name -->
										{#if soonOn}
											<span
												role="radiogroup"
												aria-label={m.notifications.repeat}
												class="inline-flex rounded-full border border-line bg-surface p-0.5 text-xs"
											>
												{#each SOON_REPEATS as option (option)}
													<label
														class="rounded-full px-2.5 py-0.5 text-muted transition-colors hover:text-text has-checked:bg-accent has-checked:text-on-accent has-focus-visible:outline-2 has-focus-visible:outline-accent"
													>
														<input
															type="radio"
															name="soonRepeat"
															value={option}
															bind:group={soonRepeat}
															class="sr-only"
														/>
														{m.notifications.repeats[option]}
													</label>
												{/each}
											</span>
										{:else}
											<input type="hidden" name="soonRepeat" value={soonRepeat} />
										{/if}
									{/if}
								</div>
								<label for="kind-{kind}" class="cursor-pointer {hint}">{kindHint(kind)}</label>
							</div>
							{#if kind === 'soon'}
								<Switch id="kind-{kind}" name={kind} bind:checked={soonOn} />
							{:else}
								<Switch id="kind-{kind}" name={kind} checked={data.prefs.kinds[kind]} />
							{/if}
						</div>
					{/each}
				</div>
				<p class="mt-1 {hint}">{m.notifications.what}</p>
			</div>
		{/if}
	</form>
</section>

<!-- Where to: devices, Pushover, ntfy, webhooks as one list -->
<section class={card}>
	<h2 class={heading}><Send size={20} class="text-muted" />{m.notifications.targets}</h2>
	<TargetList targets={data.targets} publicKey={data.publicKey} paused={mode === 'off'} />
	<p class="mt-4 {hint}">
		<a
			class={ui.link}
			href="{WIKI}/Privacy-and-security#notifications"
			target="_blank"
			rel="noopener noreferrer">{m.notifications.learnMore}</a
		>
	</p>
</section>
