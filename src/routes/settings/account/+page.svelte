<script lang="ts">
	import { enhance } from '$app/forms';
	import FeedbackText from '$lib/components/FeedbackText.svelte';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import SubmitButton, { BUTTON_SECONDARY } from '$lib/components/SubmitButton.svelte';
	import { FormFeedback } from '$lib/forms.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { MIN_PASSWORD_LENGTH } from '$lib/limits';
	import { ui } from '$lib/ui';
	import { AtSign, KeyRound, LogOut, MonitorSmartphone } from '@lucide/svelte';

	let { data, form } = $props();

	const forms = new FormFeedback();
	const { card, heading, label, labelText, hint, actions } = ui;
</script>

<svelte:head><title>{m.settings.account} · hdpantry</title></svelte:head>

<h1 class={ui.pageTitle}>{m.settings.account}</h1>

<!-- Username: the button wakes up once both fields are filled in -->
<section class={card}>
	<h2 class={heading}><AtSign size={20} class="text-muted" />{m.settings.accountName}</h2>
	<form
		method="POST"
		action="?/username"
		use:enhance={forms.submit('username')}
		class="mt-4 flex max-w-md flex-col gap-4"
	>
		<label class={label}>
			<span class={labelText}>{m.settings.accountNameNew}</span>
			<input
				name="username"
				value={form && 'username' in form && form.username ? form.username : data.user?.username}
				autocomplete="username"
				autocapitalize="off"
				required
			/>
			<span class={hint}>{m.auth.usernameRule}</span>
		</label>
		<label class={label}>
			<span class={labelText}>{m.settings.accountPasswordConfirm}</span>
			<PasswordInput name="password" autocomplete="current-password" required />
		</label>
		<div class={actions}>
			<SubmitButton
				text={m.settings.accountNameSave}
				busy={forms.busy === 'username'}
				when="filled"
			/>
			<FeedbackText feedback={forms.messages.username} />
		</div>
	</form>
</section>

<!-- Password -->
<section class={card}>
	<h2 class={heading}><KeyRound size={20} class="text-muted" />{m.settings.accountPassword}</h2>
	<p class="mt-1 {hint}">{m.settings.accountPasswordHint}</p>
	<form
		method="POST"
		action="?/password"
		use:enhance={forms.submit('password', true)}
		class="mt-4 flex max-w-md flex-col gap-4"
	>
		<!-- Hidden username helps password managers to update the right entry -->
		<input
			type="text"
			name="username"
			value={data.user?.username}
			autocomplete="username"
			hidden
			readonly
		/>
		<label class={label}>
			<span class={labelText}>{m.settings.accountPasswordCurrent}</span>
			<PasswordInput name="current" autocomplete="current-password" required />
		</label>
		<label class={label}>
			<span class={labelText}>{m.settings.accountPasswordNew(MIN_PASSWORD_LENGTH)}</span>
			<PasswordInput
				name="password"
				autocomplete="new-password"
				minlength={MIN_PASSWORD_LENGTH}
				required
			/>
		</label>
		<label class={label}>
			<span class={labelText}>{m.settings.accountPasswordRepeat}</span>
			<PasswordInput
				name="confirm"
				autocomplete="new-password"
				minlength={MIN_PASSWORD_LENGTH}
				required
			/>
		</label>
		<div class={actions}>
			<SubmitButton
				text={m.settings.accountPasswordSave}
				busy={forms.busy === 'password'}
				when="filled"
				icon={KeyRound}
			/>
			<FeedbackText feedback={forms.messages.password} />
		</div>
	</form>
</section>

<!-- Other devices: the button is only there while another device is logged in -->
<section class={card}>
	<h2 class={heading}>
		<MonitorSmartphone size={20} class="text-muted" />{m.settings.accountDevices}
	</h2>
	{#if data.otherDevices > 0}
		<p class="mt-2 {hint}">{m.settings.accountDevicesCount(data.otherDevices)}</p>
		<form
			method="POST"
			action="?/logoutOthers"
			use:enhance={forms.submit('logoutOthers')}
			class="mt-4 {actions}"
		>
			<SubmitButton
				text={m.settings.accountDevicesLogout}
				busy={forms.busy === 'logoutOthers'}
				icon={LogOut}
				style={BUTTON_SECONDARY}
			/>
		</form>
	{:else}
		<p class="mt-2 {hint}">{m.settings.accountDevicesNone}</p>
	{/if}
	<div class="mt-2"><FeedbackText feedback={forms.messages.logoutOthers} /></div>
</section>
