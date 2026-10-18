<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Snippet } from 'svelte';
	import FeedbackText from '$lib/components/FeedbackText.svelte';
	import SubmitButton, { BUTTON_SECONDARY } from '$lib/components/SubmitButton.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import type { FormFeedback } from '$lib/forms.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui';
	import { autosave } from '$lib/autosave';
	import {
		ChevronDown,
		CircleAlert,
		CircleCheck,
		CircleDashed,
		LoaderCircle,
		Play,
		RotateCcw
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	type Props = {
		task: PageData['tasks'][number];
		frequencies: PageData['frequencies'];
		locale: string;
		forms: FormFeedback;
		// Whether the row is unfolded, and what a tap on it does
		open: boolean;
		ontoggle: () => void;
		// More fields (backup: how many to keep) and content below the form (list of backups)
		fields?: Snippet;
		children?: Snippet;
	};
	let { task, frequencies, locale, forms, open, ontoggle, fields, children }: Props = $props();

	const { label, labelText, hint, actions } = ui;
	let text = $derived(m.maintenance.tasks[task.key]);

	// Own copy, so time and weekday follow the chosen frequency at once ...
	// svelte-ignore state_referenced_locally
	let frequency = $state(task.frequency);
	// ... and the saved value again when that changes (after a reset)
	$effect.pre(() => {
		frequency = task.frequency;
	});

	let mainForm = $state<HTMLFormElement>();

	function moment(iso: string) {
		return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
	}
	function size(bytes: number) {
		const [value, unit] = bytes >= 1e6 ? [bytes / 1e6, 'megabyte'] : [bytes / 1e3, 'kilobyte'];
		return new Intl.NumberFormat(locale, {
			style: 'unit',
			unit,
			unitDisplay: 'short',
			maximumFractionDigits: value < 10 ? 1 : 0
		}).format(value);
	}
	function duration(ms: number) {
		const [value, unit] = ms < 1000 ? [Math.max(ms, 1), 'millisecond'] : [ms / 1000, 'second'];
		return new Intl.NumberFormat(locale, {
			style: 'unit',
			unit,
			unitDisplay: 'short',
			maximumFractionDigits: 1
		}).format(value);
	}
	// Monday first; the numbers are those of the calendar (0 = Sunday). 2031-06-01 is a Sunday.
	const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];
	function weekdayName(day: number) {
		return new Date(2031, 5, 1 + day).toLocaleDateString(locale, { weekday: 'long' });
	}

	// The line under the name: when it runs and how the last run went – or what went wrong
	let schedule = $derived.by(() => {
		if (!task.enabled) return m.maintenance.off;
		const often = m.maintenance.frequencies[task.frequency];
		if (task.frequency === 'hourly') return often;
		const day = task.frequency === 'weekly' ? ` ${weekdayName(task.weekday)},` : '';
		return `${often}${day} ${task.time}`;
	});
	let summary = $derived(
		task.running
			? m.maintenance.running
			: task.lastError
				? `${m.maintenance.failed} ${task.lastError}`
				: `${schedule} · ${task.lastRunAt ? m.maintenance.lastRun(moment(task.lastRunAt)) : m.maintenance.neverRun}`
	);
</script>

<!-- One task: a row that says how it stands; a tap unfolds everything about it -->
<li class="py-3">
	<div class="flex items-center gap-3">
		<button
			type="button"
			class="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-colors hover:text-accent"
			aria-expanded={open}
			onclick={ontoggle}
		>
			{#if task.running}
				<LoaderCircle size={20} class="shrink-0 animate-spin text-muted" />
			{:else if task.lastError}
				<CircleAlert size={20} class="shrink-0 text-danger" />
			{:else if task.lastRunAt && task.enabled}
				<CircleCheck size={20} class="shrink-0 text-good" />
			{:else}
				<CircleDashed size={20} class="shrink-0 text-muted" />
			{/if}
			<span class="min-w-0 flex-1">
				<span class="block truncate font-medium">{text.name}</span>
				<span class="line-clamp-2 text-xs {task.lastError ? 'text-danger' : 'text-muted'}">
					{summary}
				</span>
			</span>
		</button>
		<!-- On or off is saved the moment it is switched -->
		<form method="POST" action="?/toggle" use:enhance={forms.submit(task.key)} use:autosave>
			<input type="hidden" name="key" value={task.key} />
			<label for="enabled-{task.key}" class="sr-only">{text.name}</label>
			<Switch
				id="enabled-{task.key}"
				name="enabled"
				checked={task.enabled}
				locked={task.required}
			/>
		</form>
		<button
			type="button"
			class="rounded-lg p-1 text-muted transition-colors hover:text-text"
			aria-label={text.name}
			aria-expanded={open}
			tabindex="-1"
			onclick={ontoggle}
		>
			<ChevronDown size={18} class="transition-transform {open ? 'rotate-180' : ''}" />
		</button>
	</div>

	{#if open}
		<div class="mt-3 rounded-lg border border-line p-3">
			<p class={hint}>{text.description}</p>

			<!-- Own little form for the reset arrow (a second submit button inside the main form
			     would be the one the Enter key presses) -->
			<form
				id="reset-{task.key}"
				method="POST"
				action="?/resetSchedule"
				hidden
				use:enhance={(input) => {
					const done = forms.submit(task.key)(input);
					return async (answer) => {
						if (typeof done === 'function') await done(answer);
						// The main form shows the saved state again
						if (answer.result.type === 'success') mainForm?.dispatchEvent(new Event('saved'));
					};
				}}
			>
				<input type="hidden" name="key" value={task.key} />
			</form>

			<form
				bind:this={mainForm}
				method="POST"
				action="?/save"
				use:enhance={forms.submit(task.key)}
				class="mt-3 flex flex-col gap-4"
			>
				<input type="hidden" name="key" value={task.key} />

				<!-- Last and next run -->
				<div class="flex flex-col gap-1 text-sm">
					{#if task.running}
						<p>{m.maintenance.running}</p>
					{:else if task.lastRunAt}
						<p class="flex flex-wrap items-center gap-x-1.5 {task.lastError ? 'text-danger' : ''}">
							{#if task.lastError}
								<CircleAlert size={16} class="shrink-0" />
							{:else}
								<CircleCheck size={16} class="shrink-0 text-good" />
							{/if}
							{m.maintenance.lastRun(moment(task.lastRunAt))}
							{#if task.lastDurationMs !== null}
								<span class="text-muted">· {duration(task.lastDurationMs)}</span>
							{/if}
							{#if task.lastFreedBytes}
								<span class="text-muted">· {m.maintenance.freed(size(task.lastFreedBytes))}</span>
							{/if}
						</p>
						{#if task.lastError}
							<p class="text-xs break-words text-danger" role="alert">
								{m.maintenance.failed}
								{task.lastError}
							</p>
						{/if}
					{:else}
						<p class="text-muted">{m.maintenance.neverRun}</p>
					{/if}
					<p class="text-muted">
						{task.nextRunAt ? m.maintenance.nextRun(moment(task.nextRunAt)) : m.maintenance.off}
					</p>
					{#if task.usedBytes !== null && (task.key === 'optimize' || task.key === 'backup')}
						<p class="text-muted">{m.maintenance.stored[task.key](size(task.usedBytes))}</p>
					{/if}
				</div>

				<!-- Schedule -->
				<div class="grid grid-cols-2 gap-3">
					<div class={label}>
						<div class="flex items-center gap-2">
							<label for="frequency-{task.key}" class={labelText}>{m.maintenance.frequency}</label>
							{#if task.customSchedule}
								<!-- Small on purpose: the row is full enough -->
								<button
									form="reset-{task.key}"
									class="rounded p-0.5 text-muted transition-colors hover:text-text"
									aria-label={m.maintenance.resetSchedule}
									title={m.maintenance.resetSchedule}
								>
									<RotateCcw size={14} />
								</button>
							{/if}
						</div>
						<select id="frequency-{task.key}" name="frequency" bind:value={frequency}>
							{#each frequencies as value (value)}
								<option {value}>{m.maintenance.frequencies[value]}</option>
							{/each}
						</select>
					</div>
					{#if frequency === 'hourly'}
						<input type="hidden" name="time" value={task.time} />
					{:else}
						<label class={label}>
							<span class={labelText}>{m.maintenance.time}</span>
							<input type="time" name="time" value={task.time} required />
						</label>
					{/if}
					{#if frequency === 'weekly'}
						<label class="{label} col-span-2">
							<span class={labelText}>{m.maintenance.weekday}</span>
							<select name="weekday" value={String(task.weekday)}>
								{#each WEEKDAYS as day (day)}
									<option value={String(day)}>{weekdayName(day)}</option>
								{/each}
							</select>
						</label>
					{:else}
						<input type="hidden" name="weekday" value={task.weekday} />
					{/if}
				</div>
				{#if frequency === 'hourly' || frequency === 'monthly'}
					<p class="-mt-2 {hint}">
						{frequency === 'hourly' ? m.maintenance.hourlyHint : m.maintenance.monthlyHint}
					</p>
				{/if}

				{@render fields?.()}

				<div class={actions}>
					<SubmitButton
						text={m.common.save}
						busy={forms.busy === task.key && !forms.busyAction}
						disabled={forms.busy === task.key}
						when="changed"
					/>
					<SubmitButton
						text={m.maintenance.runNow}
						icon={Play}
						style={BUTTON_SECONDARY}
						formaction="?/run"
						busy={(forms.busy === task.key && forms.busyAction === '?/run') || task.running}
						disabled={forms.busy === task.key}
					/>
					<FeedbackText feedback={forms.messages[task.key]} />
				</div>
			</form>

			{@render children?.()}
		</div>
	{/if}
</li>
