<script lang="ts">
	import { enhance } from '$app/forms';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { MIN_PASSWORD_LENGTH } from '$lib/limits';

	let { data, form } = $props();
</script>

<svelte:head><title>{m.settings.account} · hdpantry</title></svelte:head>

<h1 class="text-lg font-semibold">{m.settings.account}</h1>

<section class="mt-4">
	<h2 class="font-medium">{m.settings.accountName}</h2>
	<!-- The typed name stays in the field, the password is emptied -->
	<form
		method="POST"
		action="?/username"
		use:enhance={({ formElement }) =>
			async ({ update }) => {
				await update({ reset: false });
				const password = formElement.querySelector<HTMLInputElement>('input[name=password]');
				if (password) password.value = '';
			}}
		class="mt-2 flex max-w-md flex-col gap-3"
	>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.settings.accountNameNew}</span>
			<input
				name="username"
				value={form?.username ?? data.user?.username ?? ''}
				autocomplete="username"
				autocapitalize="off"
				required
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.settings.accountPasswordCurrent}</span>
			<PasswordInput name="password" autocomplete="current-password" required />
		</label>
		{#if form?.nameError}
			<p class="form-error" role="alert">{form.nameError}</p>
		{:else if form?.nameDone}
			<p class="text-sm text-good" role="status">{m.settings.accountNameSaved}</p>
		{/if}
		<button class="self-start btn-secondary">{m.settings.accountNameSave}</button>
	</form>
</section>

<section class="mt-8">
	<h2 class="font-medium">{m.settings.accountPassword}</h2>
	<p class="mt-1 text-sm text-muted">{m.settings.accountPasswordHint}</p>
	<form method="POST" action="?/password" use:enhance class="mt-3 flex max-w-md flex-col gap-3">
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.settings.accountPasswordCurrent}</span>
			<PasswordInput name="current" autocomplete="current-password" required />
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.settings.accountPasswordNew(MIN_PASSWORD_LENGTH)}</span>
			<PasswordInput
				name="password"
				autocomplete="new-password"
				minlength={MIN_PASSWORD_LENGTH}
				required
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">{m.settings.accountPasswordRepeat}</span>
			<PasswordInput
				name="confirm"
				autocomplete="new-password"
				minlength={MIN_PASSWORD_LENGTH}
				required
			/>
		</label>
		{#if form?.passwordError}
			<p class="form-error" role="alert">{form.passwordError}</p>
		{:else if form?.passwordDone}
			<p class="text-sm text-good" role="status">{m.settings.accountPasswordSaved}</p>
		{/if}
		<button class="self-start btn-secondary">{m.settings.accountPasswordSave}</button>
	</form>
</section>

<section class="mt-8">
	<h2 class="font-medium">{m.settings.accountDevices}</h2>
	<!-- The button is only there while another device is logged in -->
	{#if data.otherDevices > 0}
		<p class="mt-1 text-sm text-muted">{m.settings.accountDevicesCount(data.otherDevices)}</p>
		<form method="POST" action="?/logoutOthers" use:enhance class="mt-3">
			<button class="btn-secondary">{m.settings.accountDevicesLogout}</button>
		</form>
	{:else}
		<p class="mt-1 text-sm text-muted">
			{form?.devicesDone ? m.settings.accountDevicesDone : m.settings.accountDevicesNone}
		</p>
	{/if}
</section>
