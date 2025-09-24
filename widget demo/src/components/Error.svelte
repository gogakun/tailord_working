<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let error: string;

  const dispatch = createEventDispatcher<{
    retry: void;
  }>();

  function handleRetry() {
    dispatch('retry');
  }
</script>

<div class="error-container" style="
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--rg-space-xl);
  text-align: center;
  gap: var(--rg-space-lg);
">
  <!-- Error Icon -->
  <div style="
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #ff4444;
  ">
    ⚠️
  </div>
  
  <!-- Error Message -->
  <div style="display: flex; flex-direction: column; gap: var(--rg-space-sm);">
    <h3 class="text-primary" style="margin: 0; font-size: 16px; font-weight: 600;">
      Oops! Something went wrong
    </h3>
    
    <p class="text-secondary" style="margin: 0; font-size: 13px; line-height: 1.4;">
      {error || 'We encountered an error while searching. Please try again.'}
    </p>
  </div>
  
  <!-- Retry Button -->
  <button
    on:click={handleRetry}
    class="btn-primary focus-ring"
    style="
      padding: var(--rg-space-sm) var(--rg-space-lg);
      font-size: 13px;
      font-weight: 600;
    "
  >
    Try Again
  </button>
  
  <!-- Help Text -->
  <p class="text-muted" style="margin: 0; font-size: 11px;">
    If this keeps happening, try refining your search terms
  </p>
</div>

<style>
  .error-container {
    animation: fade-in var(--rg-dur-normal) var(--rg-ease);
  }
</style>
