<script lang="ts">
	// locked: cannot be switched off, but is still sent with the form (a disabled checkbox is not)
	type Props = { name: string; id: string; checked: boolean; value?: string; locked?: boolean };
	let { name, id, checked = $bindable(), value, locked = false }: Props = $props();
</script>

<!-- On/off switch: a real checkbox (sent with the form), drawn as a sliding toggle.
     Describe it with <label for={id}> next to it. -->
<label
	class="relative inline-flex shrink-0 transition {locked
		? 'cursor-not-allowed opacity-50'
		: 'cursor-pointer hover:brightness-110'}"
>
	<input
		type="checkbox"
		{id}
		{name}
		{value}
		bind:checked
		aria-disabled={locked}
		onclick={(e) => locked && e.preventDefault()}
		class="peer sr-only"
	/>
	<span
		aria-hidden="true"
		class="h-7 w-12 rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-0.5 after:left-0.5 after:size-6 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:after:translate-x-5"
	></span>
</label>
