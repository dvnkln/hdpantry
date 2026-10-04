<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { large = false }: { large?: boolean } = $props();
</script>

<!-- Icon and name of the app -->
<span class="flex items-center gap-2 font-bold {large ? 'text-3xl' : 'text-lg'}">
	<img src={favicon} alt="" class={large ? 'size-10' : 'size-7'} />
	hdpantry
</span>
