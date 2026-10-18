<script lang="ts">
	import { formatDate, m } from '$lib/i18n/index.svelte';
	import { CalendarClock, X } from '@lucide/svelte';

	// Since when something is stored: today, unless it has been in there for a while – the
	// exception, so it is one quiet line and no field. Tapping it opens the calendar. Sent as
	// `storedOn` (YYYY-MM-DD, never later than today).
	let { today, since = $bindable() }: { today: string; since: string } = $props();

	let field = $state<HTMLInputElement>();
	// Only for browsers that cannot open their calendar from a button
	let visible = $state(false);
	function pick() {
		try {
			field?.showPicker();
		} catch {
			visible = true;
		}
	}
	// An emptied or impossible field counts as today
	let from = $derived(/^\d{4}-\d{2}-\d{2}$/.test(since) && since <= today ? since : today);
	let backdated = $derived(from !== today);
</script>

<div class="relative -ml-2 flex items-center self-start">
	<button
		type="button"
		class="flex items-center gap-1.5 btn-quiet"
		aria-label={m.item.sinceChange}
		onclick={pick}
	>
		<CalendarClock size={16} />
		<span>
			{m.item.storedSince}
			<span class="underline decoration-dotted underline-offset-4"
				>{backdated ? formatDate(from) : m.item.today}</span
			>
		</span>
	</button>
	{#if backdated}
		<button
			type="button"
			class="btn-quiet"
			aria-label={m.item.sinceReset}
			title={m.item.sinceReset}
			onclick={() => (since = today)}
		>
			<X size={16} />
		</button>
	{/if}
	<!-- The calendar of the browser hangs on this field; it is only seen where the browser cannot
	     open its calendar from a button -->
	<input
		bind:this={field}
		type="date"
		name="storedOn"
		max={today}
		bind:value={since}
		aria-label={m.item.since}
		tabindex={visible ? 0 : -1}
		class={visible
			? 'ml-2 amount-field'
			: 'pointer-events-none absolute bottom-0 left-2 size-px opacity-0'}
	/>
</div>
