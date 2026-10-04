<script lang="ts">
	import Brand from '$lib/components/Brand.svelte';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import { LOCALES, m, setLocale, type Locale } from '$lib/i18n/index.svelte';
	import { MIN_PASSWORD_LENGTH } from '$lib/limits';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Starts with the language of the browser; choosing another one switches the page right away.
	// svelte-ignore state_referenced_locally
	let language = $state<Locale>(form?.language ?? data.locale);
	$effect.pre(() => setLocale(language));
</script>

<svelte:head><title>{m.auth.setupTitle} · hdpantry</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center p-4">
	<h1 class="flex justify-center"><Brand large /></h1>
	<p class="mt-4 text-center text-sm text-muted">{m.auth.welcome}</p>

	<form method="POST" class="mt-8 flex flex-col gap-4">
		<fieldset class="flex flex-col gap-1">
			<legend class="mb-1 text-sm font-medium">{m.auth.language}</legend>
			<div class="grid grid-cols-2 gap-2">
				{#each LOCALES as locale (locale)}
					<label
						class="cursor-pointer rounded-lg border border-line bg-surface p-2.5 text-center transition-colors hover:border-accent has-checked:border-accent has-checked:font-semibold has-checked:text-accent has-focus-visible:outline-2 has-focus-visible:outline-accent"
					>
						<input
							type="radio"
							name="language"
							value={locale}
							bind:group={language}
							class="sr-only"
						/>
						{m.languages[locale]}
					</label>
				{/each}
			</div>
		</fieldset>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.auth.username}</span>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				name="username"
				value={form?.username ?? ''}
				autocomplete="username"
				autocapitalize="off"
				required
				autofocus
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.auth.passwordMin(MIN_PASSWORD_LENGTH)}</span>
			<PasswordInput
				name="password"
				autocomplete="new-password"
				minlength={MIN_PASSWORD_LENGTH}
				required
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.auth.passwordRepeat}</span>
			<PasswordInput
				name="confirm"
				autocomplete="new-password"
				minlength={MIN_PASSWORD_LENGTH}
				required
			/>
		</label>

		{#if form?.error}
			<p class="form-error" role="alert">{form.error}</p>
		{/if}

		<button class="btn-primary">{m.auth.createAccount}</button>
	</form>
</main>
