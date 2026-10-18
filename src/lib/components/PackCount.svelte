<script lang="ts">
	import type { PackShape } from '$lib/products';

	// The number of packs of a product, drawn as its pack – box, bag, can, jar, bottle or cup – in
	// the colour run of the fill level (--fill-from/--fill-to in layout.css), the number on its
	// front. Products have no fill level: this takes its place, so a product and a container are
	// told apart at a glance.
	let {
		count,
		shape = 'box',
		size = 24
	}: { count: number; shape?: PackShape | null; size?: number } = $props();

	// Every drawing needs a colour run of its own, hence the id
	const id = $props.id();
	let two = $derived(String(count).length > 1);
	// Where the number stands, and how large it can be in each drawing
	const NUMBER: Record<PackShape, { x: number; y: number; size: number }> = {
		box: { x: 26, y: 42, size: 30 },
		bag: { x: 32, y: 39, size: 30 },
		can: { x: 32, y: 35, size: 28 },
		jar: { x: 32, y: 39, size: 28 },
		bottle: { x: 32, y: 45, size: 22 },
		cup: { x: 32, y: 38, size: 28 }
	};
	let number = $derived(NUMBER[shape ?? 'box']);
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" class="shrink-0">
	<defs>
		<linearGradient {id} gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="10">
			<stop offset="0" class="[stop-color:var(--fill-from)]" />
			<stop offset="1" class="[stop-color:var(--fill-to)]" />
		</linearGradient>
	</defs>
	<g class="stroke-muted" stroke-width="2.5" stroke-linejoin="round">
		{#if shape === 'bag'}
			<!-- A bag sealed at the top, a little wider at the bottom -->
			<path d="M11 15h42l4 37q0 8-8 8H15q-8 0-8-8z" fill="url(#{id})" />
			<path d="M10 6h44v9H10z" class="fill-[var(--fill-to)]" />
			<path d="M14 9.5h36" fill="none" stroke-width="1.5" stroke-dasharray="3 2" />
		{:else if shape === 'can'}
			<!-- A can: round lid and bottom, two ribs -->
			<path d="M12 13v42a20 5 0 0 0 40 0V13" fill="url(#{id})" />
			<ellipse cx="32" cy="13" rx="20" ry="5" class="fill-[var(--fill-to)]" />
			<path d="M12 20a20 5 0 0 0 40 0M12 48a20 5 0 0 0 40 0" fill="none" stroke-width="1.5" />
		{:else if shape === 'jar'}
			<!-- A jar with a screw lid -->
			<path d="M14 17h36q5 0 5 6v30q0 7-7 7H16q-7 0-7-7V23q0-6 5-6z" fill="url(#{id})" />
			<rect x="15" y="5" width="34" height="11" rx="2" class="fill-muted" />
		{:else if shape === 'bottle'}
			<!-- A bottle: cap, neck, shoulders -->
			<path d="M26 12h12v6q11 4 11 13v24q0 5-5 5H20q-5 0-5-5V31q0-9 11-13z" fill="url(#{id})" />
			<rect x="25" y="3" width="14" height="8" rx="1.5" class="fill-muted" />
		{:else if shape === 'cup'}
			<!-- A cup with a foil lid, narrower at the bottom -->
			<path d="M11 15h42l-5 43q-.5 3-3.5 3h-25q-3 0-3.5-3z" fill="url(#{id})" />
			<rect x="7" y="8" width="50" height="7" rx="2" class="fill-[var(--fill-to)]" />
		{:else}
			<!-- A box seen slightly from above; the side the darkest, the top the lightest -->
			<path d="M46 22 58 10v38L46 60z" class="fill-[var(--fill-from)]" />
			<path d="M6 22 18 10h40L46 22z" class="fill-[var(--fill-to)]" />
			<rect x="6" y="22" width="40" height="38" fill="url(#{id})" />
			<path d="M20 22 32 10" class="stroke-[var(--fill-from)]" stroke-width="3" opacity="0.5" />
			<path d="M6 22h40l12-12M46 22v38" fill="none" />
		{/if}
	</g>
	<text
		x={number.x}
		y={number.y}
		text-anchor="middle"
		dominant-baseline="central"
		font-size={two ? number.size * 0.78 : number.size}
		font-weight="800"
		class="fill-surface stroke-[var(--fill-from)]"
		stroke-width="3"
		paint-order="stroke"
	>
		{count}
	</text>
</svg>
