<script lang="ts">
	import type { Feedback } from '$lib/forms.svelte';

	let { feedback }: { feedback: Feedback | undefined } = $props();
</script>

<!-- Result of a form: green on success, red on error -->
{#if feedback}
	<p
		role={feedback.ok ? 'status' : 'alert'}
		class="text-sm {feedback.ok ? 'text-good' : 'text-danger'}"
	>
		{feedback.text}
	</p>
{/if}
