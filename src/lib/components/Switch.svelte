<script lang="ts">
	let {
		name,
		checked = $bindable(false),
		label
	}: { name: string; checked?: boolean; label: string } = $props();
</script>

<!-- On/off switch: a checkbox underneath, so it works in a normal form -->
<label class="flex cursor-pointer items-center justify-between gap-4">
	<span class="font-medium">{label}</span>
	<span class="relative inline-flex shrink-0">
		<input type="checkbox" {name} bind:checked class="peer sr-only" />
		<span
			class="h-7 w-12 rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
		></span>
		<span
			class="absolute top-0.5 left-0.5 size-6 rounded-full bg-surface shadow transition-transform peer-checked:translate-x-5"
		></span>
	</span>
</label>
