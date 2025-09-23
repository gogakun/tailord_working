<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Product } from '../types';

  export let product: Product;
  export let size: 'small' | 'large' = 'small';

  const dispatch = createEventDispatcher<{
    click: Product;
    save: Product;
  }>();

  function handleClick() {
    dispatch('click', product);
  }

  function handleSave(event: Event) {
    event.stopPropagation();
    dispatch('save', product);
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
</script>

<div 
  class="product-card focus-ring"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
  aria-label="View {product.name} by {product.brand}"
  style="
    cursor: pointer;
    position: relative;
    overflow: hidden;
    {size === 'large' ? 'padding: var(--rg-space-lg);' : 'padding: var(--rg-space-md);'}
  "
>
  <!-- Product Image -->
  <div 
    class="product-image"
    style="
      width: 100%;
      aspect-ratio: 1;
      background: var(--rg-text-muted);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: var(--rg-space-sm);
      position: relative;
    "
  >
    {#if product.image}
      <img
        src={product.image}
        alt={product.name}
        style="
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--rg-dur-fast) var(--rg-ease);
        "
        on:load
        on:error
      />
    {:else}
      <div class="skeleton" style="width: 100%; height: 100%;"></div>
    {/if}
    
    <!-- Save Button -->
    <button
      on:click={handleSave}
      class="save-button"
      style="
        position: absolute;
        top: var(--rg-space-sm);
        right: var(--rg-space-sm);
        background: rgba(0, 0, 0, 0.5);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: opacity var(--rg-dur-fast) var(--rg-ease);
        color: white;
        font-size: 14px;
      "
      aria-label="Save {product.name}"
    >
      ♥
    </button>
  </div>

  <!-- Product Info -->
  <div class="product-info" style="flex: 1; display: flex; flex-direction: column; gap: var(--rg-space-xs);">
    <!-- Brand -->
    <p class="text-muted" style="margin: 0; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
      {product.brand}
    </p>
    
    <!-- Name -->
    <h3 class="text-primary" style="
      margin: 0; 
      font-size: {size === 'large' ? '14px' : '13px'}; 
      font-weight: 600; 
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    ">
      {product.name}
    </h3>
    
    <!-- Price -->
    <p class="text-secondary" style="margin: 0; font-size: 13px; font-weight: 600;">
      {formatPrice(product.price)}
    </p>
    
    <!-- Tags -->
    {#if product.tags && product.tags.length > 0}
      <div style="display: flex; gap: var(--rg-space-xs); flex-wrap: wrap;">
        {#each product.tags.slice(0, 2) as tag}
          <span 
            class="product-tag"
            style="
              background: var(--rg-stroke-in);
              color: var(--rg-text-dim);
              padding: 2px var(--rg-space-xs);
              border-radius: 4px;
              font-size: 10px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            "
          >
            {tag}
          </span>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Action Button -->
  <button
    class="btn-primary"
    style="
      margin-top: var(--rg-space-sm);
      width: 100%;
      padding: var(--rg-space-sm);
      font-size: 12px;
      font-weight: 600;
    "
    on:click={handleClick}
  >
    View Product
  </button>
</div>

<style>
  .product-card:hover .save-button {
    opacity: 1;
  }

  .product-card:hover .product-image img {
    transform: scale(1.05);
  }

  .product-card:focus {
    outline: 2px solid var(--rg-accent);
    outline-offset: 2px;
  }

  .save-button:hover {
    background: rgba(0, 0, 0, 0.7) !important;
  }

  .product-tag {
    white-space: nowrap;
  }
</style>
