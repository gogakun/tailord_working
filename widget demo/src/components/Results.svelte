<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Product } from '../types';
  import ProductCard from './ProductCard.svelte';

  export let results: Product[];
  export let currentQuery: string;
  export let size: 'xs' | 'm' | 'l';

  const dispatch = createEventDispatcher<{
    productClick: Product;
    viewToggle: void;
    sizeChange: 'xs' | 'm' | 'l';
  }>();

  let currentView: 'carousel' | 'grid' = 'carousel';
  let currentIndex = 0;

  function handleProductClick(product: Product) {
    dispatch('productClick', product);
  }

  function handleViewToggle() {
    currentView = currentView === 'carousel' ? 'grid' : 'carousel';
    dispatch('viewToggle');
  }

  function handleSizeChange(newSize: 'xs' | 'm' | 'l') {
    dispatch('sizeChange', newSize);
  }

  function nextItem() {
    if (currentView === 'carousel') {
      currentIndex = (currentIndex + 1) % results.length;
    }
  }

  function prevItem() {
    if (currentView === 'carousel') {
      currentIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prevItem();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextItem();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="results-container" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
  <!-- Results Header -->
  <div style="padding: var(--rg-space-md); border-bottom: 1px solid var(--rg-stroke-in); flex-shrink: 0;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <p class="text-secondary" style="margin: 0; font-size: 12px;">
        {results.length} item{results.length !== 1 ? 's' : ''} found
      </p>
      
      {#if size === 'm' || size === 'l'}
        <div style="display: flex; gap: var(--rg-space-sm);">
          <button
            on:click={handleViewToggle}
            class="btn-secondary focus-ring"
            style="padding: var(--rg-space-xs) var(--rg-space-sm); font-size: 11px;"
            aria-label="Toggle view"
          >
            {currentView === 'carousel' ? 'Grid' : 'Carousel'}
          </button>
          
          {#if size === 'm'}
            <button
              on:click={() => handleSizeChange('l')}
              class="btn-secondary focus-ring"
              style="padding: var(--rg-space-xs) var(--rg-space-sm); font-size: 11px;"
              aria-label="Expand to gallery view"
            >
              Expand
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Results Content -->
  <div class="results-content" style="flex: 1; overflow: hidden;">
    {#if currentView === 'carousel'}
      <!-- Carousel View -->
      <div class="carousel-container" style="height: 100%; position: relative; overflow: hidden;">
        <div 
          class="carousel-track"
          style="
            display: flex;
            height: 100%;
            transform: translateX(-{currentIndex * 100}%);
            transition: transform var(--rg-dur-normal) var(--rg-ease);
          "
        >
          {#each results as product, index}
            <div 
              class="carousel-item"
              style="
                flex: 0 0 100%;
                padding: var(--rg-space-md);
                display: flex;
                flex-direction: column;
                gap: var(--rg-space-md);
              "
            >
              <ProductCard 
                {product}
                on:click={() => handleProductClick(product)}
                size="large"
              />
              
              {#if index < results.length - 1}
                <div style="display: flex; justify-content: center; gap: var(--rg-space-md);">
                  <button
                    on:click={nextItem}
                    class="btn-secondary focus-ring"
                    style="padding: var(--rg-space-sm);"
                    aria-label="Next item"
                  >
                    Next →
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Carousel Navigation -->
        {#if results.length > 1}
          <div style="
            position: absolute;
            bottom: var(--rg-space-md);
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: var(--rg-space-xs);
          ">
            {#each results as _, index}
              <button
                on:click={() => currentIndex = index}
                class="carousel-dot"
                class:active={index === currentIndex}
                style="
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  border: none;
                  background: {index === currentIndex ? 'var(--rg-accent)' : 'var(--rg-text-muted)'};
                  cursor: pointer;
                  transition: background var(--rg-dur-fast) var(--rg-ease);
                "
                aria-label="Go to item {index + 1}"
              />
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <!-- Grid View -->
      <div class="grid-container" style="
        height: 100%;
        overflow-y: auto;
        padding: var(--rg-space-md);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--rg-space-md);
        align-content: start;
      ">
        {#each results as product}
          <ProductCard 
            {product}
            on:click={() => handleProductClick(product)}
            size="small"
          />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .results-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .results-content {
    flex: 1;
    overflow: hidden;
  }

  .carousel-container {
    position: relative;
  }

  .carousel-track {
    display: flex;
    height: 100%;
  }

  .carousel-item {
    flex: 0 0 100%;
    display: flex;
    flex-direction: column;
  }

  .grid-container {
    display: grid;
    gap: var(--rg-space-md);
    align-content: start;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .grid-container {
      grid-template-columns: 1fr;
    }
  }
</style>
