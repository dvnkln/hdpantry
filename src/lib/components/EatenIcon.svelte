<script lang="ts">
	let { size = 18 }: { size?: number } = $props();
</script>

<!-- "Eaten": a round mouth snapping at crumbs. Drawn for this app, in the style of the line icons. -->
<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	class="shrink-0"
>
	<!-- the mouth: three quarters of a circle, open to the right -->
	<path d="M15.4 5.6A8 8 0 1 0 15.4 18.4L10.6 12Z" />
	<!-- an eye -->
	<circle cx="10" cy="7.6" r="0.7" fill="currentColor" />
	<!-- crumbs -->
	<circle cx="17.2" cy="12" r="1" fill="currentColor" />
	<circle cx="21.5" cy="12" r="1" fill="currentColor" />
</svg>
