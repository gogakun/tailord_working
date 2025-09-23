<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value = '';
  export let disabled = false;
  export let placeholder = 'Ask me anything...';

  const dispatch = createEventDispatcher<{
    submit: string;
  }>();

  function handleSubmit() {
    if (value.trim() && !disabled) {
      dispatch('submit', value.trim());
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="input-container" style="padding: var(--rg-space-md); border-top: 1px solid var(--rg-stroke-in);">
  <div style="display: flex; gap: var(--rg-space-sm); align-items: center;">
    <input
      type="text"
      bind:value
      {placeholder}
      {disabled}
      on:keydown={handleKeydown}
      class="input-field focus-ring"
      style="
        flex: 1;
        padding: var(--rg-space-sm) var(--rg-space-md);
        font-size: 13px;
      "
      aria-label="Search for fashion items"
    />
    
    <button
      on:click={handleSubmit}
      {disabled}
      class="btn-primary focus-ring"
      style="
        padding: var(--rg-space-sm) var(--rg-space-md);
        font-size: 13px;
        white-space: nowrap;
      "
      aria-label="Search"
    >
      {#if disabled}
        <div class="skeleton" style="width: 20px; height: 16px; border-radius: 4px;"></div>
      {:else}
        Search
      {/if}
    </button>
  </div>
  
  <p class="text-muted" style="margin: var(--rg-space-xs) 0 0 0; font-size: 11px;">
    Press Enter to search, Shift+Enter for new line
  </p>
</div>

<style>
  .input-container {
    flex-shrink: 0;
  }
</style>
