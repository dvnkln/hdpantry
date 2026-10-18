<script lang="ts">
	import PackCount from '$lib/components/PackCount.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { PACK_SHAPES, type PackShape } from '$lib/products';

	// How a product is packed: one row of the six drawings, the chosen one marked. Suggested by
	// the form, a tap changes it. Sent as `shape`.
	let {
		shape,
		count = 1,
		onpick
	}: { shape: PackShape; count?: number; onpick: (shape: PackShape) => void } = $props();
</script>

<fieldset>
	<legend class="mb-1 text-sm font-medium">{m.products.shape}</legend>
	<div class="grid grid-cols-6 gap-1.5">
		{#each PACK_SHAPES as key (key)}
			<label
				class="flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border border-line bg-surface py-1.5 transition-colors hover:border-accent has-checked:ring-2 has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-accent"
				title={m.products.shapes[key]}
			>
				<input
					type="radio"
					name="shape"
					value={key}
					checked={key === shape}
					onchange={() => onpick(key)}
					class="sr-only"
				/>
				<PackCount shape={key} {count} size={34} />
				<span class="text-[11px] text-muted">{m.products.shapes[key]}</span>
			</label>
		{/each}
	</div>
</fieldset>
