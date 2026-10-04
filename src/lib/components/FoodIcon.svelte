<script lang="ts">
	import { page } from '$app/state';
	import { FALLBACK_ICON, isIcon, lineFile } from '$lib/food/icons';

	let {
		icon,
		size = 32,
		style
	}: {
		icon: string | null;
		size?: number;
		// 'color' or 'line'; normally the setting of the installation
		style?: 'color' | 'line';
	} = $props();

	let key = $derived(isIcon(icon) ? icon : FALLBACK_ICON);
	let look = $derived(style ?? (page.data.iconStyle === 'line' ? 'line' : 'color'));
</script>

<!-- A food symbol in the chosen style. Purely decorative: the name always stands next to it. -->
{#if look === 'color'}
	<img
		src="/food/color/{key}.svg"
		alt=""
		width={size}
		height={size}
		class="shrink-0"
		loading="lazy"
	/>
{:else}
	<!-- The line icon is used as a mask, so it takes the colour of the text around it -->
	<span
		aria-hidden="true"
		class="inline-block shrink-0 bg-current"
		style:width="{size}px"
		style:height="{size}px"
		style:mask="url(/food/line/{lineFile(key)}.svg) center / contain no-repeat"
		style:-webkit-mask="url(/food/line/{lineFile(key)}.svg) center / contain no-repeat"
	></span>
{/if}
