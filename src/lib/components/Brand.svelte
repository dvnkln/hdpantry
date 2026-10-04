<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	// Logo + "hdpantry" wordmark. "large" is used on the login and set-up pages.
	let { large = false }: { large?: boolean } = $props();
</script>

<span class="inline-flex items-center {large ? 'gap-3' : 'gap-2'}">
	<img src={favicon} alt="" class={large ? 'size-12' : 'size-7'} />
	<span
		class="font-brand leading-none font-semibold tracking-tight {large ? 'text-4xl' : 'text-xl'}"
	>
		<span
			class="bg-linear-to-r from-(--brand-from) to-(--brand-to) bg-clip-text font-extrabold text-transparent"
			>hd</span
		>pantry
	</span>
</span>
