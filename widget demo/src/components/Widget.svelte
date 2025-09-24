<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { WidgetConfig, WidgetState, Product, WidgetEvents } from '../types';
  import { SessionManager } from '../lib/session';
  import { APIClient } from '../lib/api';
  import Input from './Input.svelte';
  import Results from './Results.svelte';
  import Loading from './Loading.svelte';
  import Error from './Error.svelte';
  import '../styles/glassmorphism.css';

  export let config: WidgetConfig;
  export let events: WidgetEvents = {};

  let state: WidgetState = {
    status: 'idle',
    size: 'xs'
  };

  let sessionManager: SessionManager;
  let apiClient: APIClient;
  let isVisible = false;
  let currentQuery = '';
  let results: Product[] = [];
  let error: string | null = null;

  // Size calculations
  const sizeConfig = {
    xs: { width: '320px', height: '56px' },
    m: { width: '420px', height: '560px' },
    l: { width: '720px', height: '640px' }
  };

  // Responsive sizing
  const getResponsiveSize = () => {
    if (typeof window === 'undefined') return sizeConfig[state.size];
    
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      return {
        xs: { width: '100%', height: '56px' },
        m: { width: '100%', height: 'clamp(48vh, 560px, 70vh)' },
        l: { width: '100%', height: 'clamp(60vh, 560px, 70vh)' }
      }[state.size];
    }
    
    return {
      xs: { width: '320px', height: '56px' },
      m: { width: 'clamp(32vw, 420px, 480px)', height: 'clamp(48vh, 560px, 70vh)' },
      l: { width: 'clamp(56vw, 640px, 720px)', height: 'clamp(60vh, 560px, 70vh)' }
    }[state.size];
  };

  onMount(() => {
    initializeWidget();
    setupKeyboardNavigation();
    setupThemeDetection();
  });

  onDestroy(() => {
    sessionManager?.destroy();
  });

  function initializeWidget() {
    sessionManager = new SessionManager();
    apiClient = new APIClient(
      config.apiUrl || 'https://api.roguegarms.com',
      config.siteId
    );

    // Resume session if available
    const sessionData = sessionManager.getSessionData();
    if (sessionData?.lastQuery && sessionData.lastResults) {
      currentQuery = sessionData.lastQuery;
      results = sessionData.lastResults;
      state.size = sessionData.lastSize || 'm';
      state.status = 'results';
    }

    events.onReady?.();
  }

  function setupKeyboardNavigation() {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'Escape':
          if (state.size !== 'xs') {
            state.size = 'xs';
            state.status = 'idle';
            updateSession();
          }
          break;
        case 'g':
          if (state.size === 'm' || state.size === 'l') {
            // Toggle grid/carousel view
            e.preventDefault();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          if (state.status === 'results' && results.length > 0) {
            e.preventDefault();
            // Handle carousel navigation
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }

  function setupThemeDetection() {
    if (config.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = () => {
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      };
      
      updateTheme();
      mediaQuery.addEventListener('change', updateTheme);
      
      return () => mediaQuery.removeEventListener('change', updateTheme);
    } else {
      document.documentElement.setAttribute('data-theme', config.theme || 'dark');
    }
  }

  async function handleSearch(query: string) {
    if (!query.trim()) return;

    currentQuery = query;
    state.status = 'thinking';
    state.size = 'xs';
    error = null;

    try {
      const response = await apiClient.searchProducts(query);
      
      if (response.error) {
        throw new Error(response.error);
      }

      results = response.products;
      state.status = 'results';
      state.size = results.length > 0 ? 'm' : 'xs';
      
      // Update session
      updateSession();
      
      // Track analytics
      apiClient.trackEvent('search', {
        query,
        resultCount: results.length
      });

    } catch (err) {
      error = err instanceof Error ? err.message : 'Search failed';
      state.status = 'error';
      state.size = 'xs';
      
      events.onError?.(error);
    }
  }

  function handleProductClick(product: Product) {
    // Track click
    apiClient.trackEvent('product_click', {
      productId: product.id,
      productName: product.name,
      query: currentQuery
    });

    // Add session ID to URL
    const url = new URL(product.url, window.location.origin);
    url.searchParams.set('rg_session', sessionManager.getSessionId() || '');
    
    // Open product page
    window.location.href = url.toString();
    
    events.onAction?.('itemClick', { id: product.id, url: product.url });
  }

  function handleSizeChange(newSize: 'xs' | 'm' | 'l') {
    state.size = newSize;
    updateSession();
  }

  function handleViewToggle() {
    // Toggle between grid and carousel view
    events.onAction?.('viewToggle', { currentView: 'carousel' });
  }

  function updateSession() {
    sessionManager.updateSession({
      lastQuery: currentQuery,
      lastResults: results,
      lastSize: state.size
    });
  }

  function open() {
    isVisible = true;
    state.status = 'idle';
    state.size = 'xs';
  }

  function close() {
    isVisible = false;
    state.status = 'idle';
    state.size = 'xs';
  }

  function setQuery(query: string) {
    currentQuery = query;
    if (query.trim()) {
      handleSearch(query);
    }
  }

  // Expose methods for external API
  export { open, close, setQuery };

  // Reactive statements
  $: currentSize = getResponsiveSize();
  $: if (state.status === 'error') {
    error = 'Something went wrong. Please try again.';
  }
</script>

{#if isVisible}
  <div 
    class="rg-widget glass-surface"
    class:glass-xs={state.size === 'xs'}
    class:glass-m={state.size === 'm'}
    class:glass-l={state.size === 'l'}
    class:animate-scale-in={state.size !== 'xs'}
    style="
      position: fixed;
      {config.position?.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      {config.position?.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      width: {currentSize.width};
      height: {currentSize.height};
      z-index: var(--rg-z-widget);
      transition: all var(--rg-dur-normal) var(--rg-ease);
    "
    role="dialog"
    aria-label="Fashion Guide Widget"
    aria-modal="true"
  >
    <!-- Widget Header -->
    <div class="widget-header" style="padding: var(--rg-space-md); border-bottom: 1px solid var(--rg-stroke-in);">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h2 class="text-primary" style="margin: 0; font-size: 14px; font-weight: 600;">
          {#if state.status === 'thinking'}
            Finding options...
          {:else if state.status === 'results'}
            Items that match '{currentQuery}'
          {:else}
            Ask me anything
          {/if}
        </h2>
        
        <div style="display: flex; gap: var(--rg-space-sm);">
          {#if state.size !== 'xs'}
            <button 
              class="btn-secondary focus-ring"
              on:click={() => handleSizeChange('xs')}
              aria-label="Minimize widget"
            >
              −
            </button>
          {/if}
          
          <button 
            class="btn-secondary focus-ring"
            on:click={close}
            aria-label="Close widget"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Widget Content -->
    <div class="widget-content" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
      {#if state.status === 'idle'}
        <div style="padding: var(--rg-space-lg); text-align: center;">
          <div class="animate-pulse" style="font-size: 24px; margin-bottom: var(--rg-space-md);">👋</div>
          <p class="text-secondary" style="margin: 0;">
            Describe your style or vibe and I'll find the perfect pieces
          </p>
        </div>
      {/if}

      <!-- Input Component -->
      <Input 
        bind:value={currentQuery}
        on:submit={(e) => handleSearch(e.detail)}
        disabled={state.status === 'thinking'}
        placeholder="Try 'opium fit' or 'vintage 90s'..."
      />

      <!-- Loading State -->
      {#if state.status === 'thinking'}
        <Loading />
      {/if}

      <!-- Error State -->
      {#if state.status === 'error'}
        <Error {error} on:retry={() => handleSearch(currentQuery)} />
      {/if}

      <!-- Results -->
      {#if state.status === 'results' && results.length > 0}
        <Results 
          {results}
          {currentQuery}
          size={state.size}
          on:productClick={(e) => handleProductClick(e.detail)}
          on:viewToggle={handleViewToggle}
          on:sizeChange={handleSizeChange}
        />
      {/if}

      <!-- Empty State -->
      {#if state.status === 'results' && results.length === 0}
        <div style="padding: var(--rg-space-xl); text-align: center;">
          <p class="text-secondary">
            No items found for '{currentQuery}'. Try a different search.
          </p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .rg-widget {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .widget-header {
    flex-shrink: 0;
  }

  .widget-content {
    flex: 1;
    overflow: hidden;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .rg-widget {
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      border-radius: 0;
    }
  }
</style>
