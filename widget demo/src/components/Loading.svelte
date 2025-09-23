<script lang="ts">
  // Loading component with skeleton states
</script>

<div class="loading-container" style="
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--rg-space-xl);
  gap: var(--rg-space-lg);
">
  <!-- Animated Spinner -->
  <div class="spinner" style="
    width: 32px;
    height: 32px;
    border: 2px solid var(--rg-stroke-in);
    border-top: 2px solid var(--rg-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  "></div>
  
  <!-- Loading Text -->
  <p class="text-secondary" style="margin: 0; text-align: center;">
    Finding options...
  </p>
  
  <!-- Skeleton Cards -->
  <div class="skeleton-grid" style="
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--rg-space-md);
    width: 100%;
    max-width: 300px;
  ">
    {#each Array(4) as _}
      <div class="skeleton-card" style="
        background: var(--rg-stroke-in);
        border-radius: 8px;
        padding: var(--rg-space-md);
        display: flex;
        flex-direction: column;
        gap: var(--rg-space-sm);
      ">
        <div class="skeleton" style="
          width: 100%;
          height: 120px;
          border-radius: 6px;
        "></div>
        <div class="skeleton" style="
          width: 60%;
          height: 12px;
          border-radius: 4px;
        "></div>
        <div class="skeleton" style="
          width: 40%;
          height: 10px;
          border-radius: 4px;
        "></div>
        <div class="skeleton" style="
          width: 80%;
          height: 10px;
          border-radius: 4px;
        "></div>
      </div>
    {/each}
  </div>
</div>

<style>
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .skeleton-grid {
    animation: fade-in var(--rg-dur-normal) var(--rg-ease);
  }

  .skeleton-card {
    animation: slide-up var(--rg-dur-normal) var(--rg-ease);
  }

  .skeleton-card:nth-child(1) { animation-delay: 0ms; }
  .skeleton-card:nth-child(2) { animation-delay: 50ms; }
  .skeleton-card:nth-child(3) { animation-delay: 100ms; }
  .skeleton-card:nth-child(4) { animation-delay: 150ms; }
</style>
