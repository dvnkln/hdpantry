<script lang="ts">
	import Brand from '$lib/components/Brand.svelte';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>{m.auth.loginTitle} · hdpantry</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center p-4">
	<h1 class="flex justify-center"><Brand large /></h1>

	<form method="POST" class="mt-8 flex flex-col gap-4">
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.auth.username}</span>
			<input
				name="username"
				value={form?.username ?? ''}
				autocomplete="username"
				autocapitalize="off"
				required
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.auth.password}</span>
			<PasswordInput name="password" autocomplete="current-password" required />
		</label>

		{#if form?.error}
			<p class="form-error" role="alert">{form.error}</p>
		{/if}

		<button class="btn-primary">{m.auth.login}</button>
	</form>
</main>
