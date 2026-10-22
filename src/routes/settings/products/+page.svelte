<script lang="ts">
	import { enhance } from '$app/forms';
	import { autosave } from '$lib/autosave';
	import FeedbackText from '$lib/components/FeedbackText.svelte';
	import { BUTTON_DANGER, BUTTON_SECONDARY } from '$lib/components/SubmitButton.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import { FormFeedback } from '$lib/forms.svelte';
	import { m } from '$lib/i18n/index.svelte';
	import { WIKI, ui } from '$lib/ui';
	import { Globe, Pencil, ShoppingBasket, Trash2 } from '@lucide/svelte';
	import DeleteAll from '$lib/components/DeleteAll.svelte';

	let { data, form } = $props();
	const forms = new FormFeedback();

	// The product whose deletion is being asked about
	let asking = $state<number | null>(null);
</script>

<svelte:head><title>{m.settings.products} · hdpantry</title></svelte:head>

<h1 class={ui.pageTitle}>{m.settings.products}</h1>

<!-- Looking up the name of a new product: the one connection to the outside besides
     notifications, so it is off until switched on here -->
<section class={ui.card}>
	<div class="flex min-h-7 items-center justify-between gap-3">
		<h2 class={ui.heading}><Globe size={20} class="text-muted" />{m.settings.lookup}</h2>
		<FeedbackText feedback={forms.error('lookup')} />
	</div>
	<form
		method="POST"
		action="?/lookup"
		use:enhance={forms.submit('lookup')}
		use:autosave
		class="mt-3 flex items-start justify-between gap-4"
	>
		<label for="productLookup" class="flex cursor-pointer flex-col gap-1">
			<span class="text-sm font-medium">{m.settings.lookupSwitch}</span>
			<span class={ui.hint}>{m.settings.lookupHint}</span>
		</label>
		<Switch id="productLookup" name="productLookup" checked={data.lookup} />
	</form>
	<p class="mt-3 {ui.hint}">
		<a
			class={ui.link}
			href="{WIKI}/Privacy-and-security#product-lookup"
			target="_blank"
			rel="noopener noreferrer">{m.settings.lookupMore}</a
		>
	</p>
</section>

<section class={ui.card}>
	<h2 class={ui.heading}>
		<ShoppingBasket size={20} class="text-muted" />{m.settings.productsList}
	</h2>
	<p class="mt-1 {ui.hint}">{m.settings.productsHint}</p>

	{#if data.products.length === 0}
		<p class="mt-3 text-sm text-muted">{m.settings.noProducts}</p>
	{:else}
		<ul class="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
			{#each data.products as product (product.id)}
				<li class="border-b border-line px-4 py-3 last:border-b-0">
					<div class="flex items-center gap-2">
						<span class="min-w-0 flex-1">
							<!-- Only the name leads to the product, not the whole row -->
							<a
								href="/products/{product.id}"
								class="font-medium underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
							>
								{product.name}
							</a>
							{#if product.brand}<span class="text-sm text-muted"> · {product.brand}</span>{/if}
							<span class="block truncate text-sm text-muted">
								{m.settings.productLine(product.barcode, product.packs, product.eaten)}
							</span>
						</span>
						<a
							href="/products/{product.id}/edit"
							class="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-bg hover:text-text"
							aria-label={m.item.edit}
							title={m.item.edit}
						>
							<Pencil size={18} />
						</a>
						<button
							type="button"
							class="-mr-2 shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-bg hover:text-danger"
							aria-label={m.settings.delete}
							title={m.settings.delete}
							onclick={() => (asking = asking === product.id ? null : product.id)}
						>
							<Trash2 size={18} />
						</button>
					</div>
					{#if asking === product.id}
						<form
							method="POST"
							action="?/deleteProduct"
							use:enhance={() =>
								async ({ update }) => {
									await update();
									asking = null;
								}}
							class="mt-3"
						>
							<input type="hidden" name="id" value={product.id} />
							<p class="text-sm">{m.settings.productDeleteQuestion(product.name, product.packs)}</p>
							<div class="mt-3 flex gap-2">
								<button
									type="button"
									class="flex-1 {BUTTON_SECONDARY}"
									onclick={() => (asking = null)}
								>
									{m.common.cancel}
								</button>
								<button class="flex-1 {BUTTON_DANGER}">{m.settings.deleteConfirm}</button>
							</div>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

{#if data.products.length}
	<DeleteAll
		title={m.settings.deleteAllProducts}
		hint={m.settings.deleteAllProductsHint}
		question={m.settings.deleteAllProductsQuestion(data.products.length)}
		error={form?.error ?? ''}
	/>
{/if}
