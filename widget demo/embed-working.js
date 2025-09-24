/**
 * Rogue Garms Guide Widget - Working Embed Script
 * This is a simplified version that works without external dependencies
 */

(function() {
  'use strict';

  // Configuration
  const WIDGET_VERSION = '1.0.0';
  const SCRIPT_ID = 'rg-guide-script';
  const WIDGET_ID = 'rg-guide-widget';

  // Global API
  let widgetInstance = null;
  let iframe = null;
  let config = null;

  // Size state machine
  const SIZE = { XS: 'XS', M: 'M', L: 'L' };
  let currentSize = SIZE.XS;
  let isResizing = false;

  function setSize(tier, force = false) {
    if (!iframe) return;
    
    currentSize = tier;

    const content = iframe.querySelector('div[style*="flex: 1"]');
    const unifiedHeader = iframe.querySelector('#unified-header');
    const chatTaiLogo = iframe.querySelector('#chat-tai-logo');
    const bottomInputContainer = iframe.querySelector('#bottom-input-container');

    if (tier === SIZE.XS) {
      iframe.style.width = '320px';
      iframe.style.height = '56px';
      if (content) content.style.display = 'none';
      if (unifiedHeader) unifiedHeader.style.display = 'flex';
      if (chatTaiLogo) chatTaiLogo.style.display = 'none';
      if (bottomInputContainer) bottomInputContainer.style.display = 'none';
    }

    if (tier === SIZE.M) {
      iframe.style.width = '420px';
      iframe.style.height = '560px';
      if (content) content.style.display = 'flex';
      if (unifiedHeader) unifiedHeader.style.display = 'none';
      if (chatTaiLogo) chatTaiLogo.style.display = 'block';
      if (bottomInputContainer) bottomInputContainer.style.display = 'flex';
    }

    if (tier === SIZE.L) {
      iframe.style.width = '720px';
      iframe.style.height = '640px';
      if (content) content.style.display = 'flex';
      if (unifiedHeader) unifiedHeader.style.display = 'none';
      if (chatTaiLogo) chatTaiLogo.style.display = 'block';
      if (bottomInputContainer) bottomInputContainer.style.display = 'flex';
    }
  }

  // Widget API
  const RGGuide = {
    init: function(widgetConfig) {
      if (widgetInstance) {
        console.warn('RGGuide: Widget already initialized');
        return;
      }

      config = {
        siteId: widgetConfig.siteId,
        theme: widgetConfig.theme || 'auto',
        position: widgetConfig.position || 'bottom-right',
        apiUrl: widgetConfig.apiUrl || 'http://localhost:3000',
        ...widgetConfig
      };

      createWidget();
      console.log('RGGuide: Widget initialized with config', config);
    },

  open: function() {
    console.log('RGGuide: Open called, iframe exists:', !!iframe);
    if (iframe) {
      iframe.style.display = 'block';
      console.log('RGGuide: Widget opened');
    } else {
      console.error('RGGuide: Widget not found, reinitializing...');
      // Ensure we have a config before creating widget
      if (!config) {
        console.log('RGGuide: No config found, initializing with defaults...');
        this.init({
          siteId: 'default-site',
          theme: 'auto',
          position: 'bottom-right'
        });
      }
      createWidget();
      if (iframe) {
        iframe.style.display = 'block';
        console.log('RGGuide: Widget created and opened');
      } else {
        console.error('RGGuide: Failed to create widget');
      }
    }
  },

    close: function() {
      if (iframe) {
        iframe.style.display = 'none';
        console.log('RGGuide: Widget closed');
      }
    },

    setQuery: function(query) {
      if (iframe) {
        // Send query to iframe
        iframe.contentWindow.postMessage({
          type: 'setQuery',
          query: query
        }, '*');
        console.log('RGGuide: Query set to', query);
      }
    },

    on: function(event, callback) {
      if (!widgetInstance) {
        widgetInstance = {};
      }
      if (!widgetInstance.events) {
        widgetInstance.events = {};
      }
      widgetInstance.events[event] = callback;
      console.log('RGGuide: Event listener added for', event);
    },

    off: function(event, callback) {
      if (widgetInstance && widgetInstance.events) {
        delete widgetInstance.events[event];
        console.log('RGGuide: Event listener removed for', event);
      }
    },

    resume: function(sessionId) {
      if (iframe) {
        iframe.contentWindow.postMessage({
          type: 'resume',
          sessionId: sessionId
        }, '*');
        console.log('RGGuide: Session resumed', sessionId);
      }
    },

    destroy: function() {
      if (iframe) {
        iframe.remove();
        iframe = null;
      }
      widgetInstance = null;
      config = null;
      console.log('RGGuide: Widget destroyed');
    }
  };

  function createWidget() {
    // Remove existing widget
    const existing = document.getElementById(WIDGET_ID);
    if (existing) {
      existing.remove();
    }
    
    console.log('RGGuide: Creating widget...');
    
    // Ensure config exists
    if (!config) {
      console.error('RGGuide: Config is null, using default config');
      config = {
        siteId: 'default-site',
        theme: 'auto',
        position: 'bottom-right',
        apiUrl: 'http://localhost:3000'
      };
    }

    // Create widget container
    const container = document.createElement('div');
    container.id = WIDGET_ID;
    container.style.cssText = `
      position: fixed;
      ${getPositionStyles(config.position)};
      z-index: 9999;
      display: none;
      width: 320px;
      height: 56px;
      border-radius: 12px;
      background: rgba(12, 14, 18, 0.36);
      backdrop-filter: blur(14px) saturate(1.2);
      border: 1px solid rgba(255, 255, 255, 0.22);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
      cursor: move;
      user-select: none;
    `;

    // Create widget content
    container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: move;
        ">
          <!-- TAI Logo for chat format -->
          <div id="chat-tai-logo" style="
            display: none;
            font-size: 11px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
            letter-spacing: 0.3px;
            background: rgba(255, 255, 255, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            backdrop-filter: blur(4px);
          ">TAI</div>
          
          <!-- Spacer for chat format -->
          <div style="flex: 1;"></div>
          
            <div style="
              flex: 1;
              position: relative;
              align-items: center;
              display: flex;
            " id="unified-header">
              <div style="
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 11px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.7);
                letter-spacing: 0.3px;
                pointer-events: none;
                z-index: 1;
                background: rgba(255, 255, 255, 0.1);
                padding: 2px 6px;
                border-radius: 4px;
                backdrop-filter: blur(4px);
              ">TAI</div>
              <input
                id="unified-input"
                type="text"
                inputmode="text"
                autocomplete="off"
                placeholder="Type to search…"
                aria-label="Quick search"
                style="
                  margin: 0;
                  padding-left: 48px;
                  font-size: 14px;
                  font-weight: 500;
                  color: #ffffff;
                  background: transparent;
                  border: none;
                  outline: none;
                  flex: 1;
                  pointer-events: auto;
                "
              />
            </div>
            
            <div style="display: flex; gap: 8px;">
            <button 
              onclick="window.RGGuide.close()"
              style="
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.22);
                color: #ffffff;
                border-radius: 8px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
                pointer-events: auto;
              "
              onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'"
              onmouseout="this.style.background='transparent'"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Content -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 12px;
          gap: 12px;
          min-height: 0;
          overflow: hidden;
        ">
          <!-- Idle State -->
          <div id="idle-state" style="
            text-align: center;
            padding: 20px;
            pointer-events: none;
          ">
            <div style="
              font-size: 24px;
              margin-bottom: 12px;
              animation: pulse 1.6s ease-in-out infinite;
            "></div>
            <p style="
              margin: 0;
              color: rgba(255, 255, 255, 0.72);
              font-size: 13px;
            ">
              Describe your style or vibe and I'll find the perfect pieces
            </p>
          </div>

          <!-- Input at bottom for chat format -->
          <div id="bottom-input-container" style="
            display: none;
            flex-direction: column;
            gap: 8px;
            margin-top: auto;
            flex-shrink: 0;
          ">
            <div style="
              display: flex;
              gap: 8px;
              align-items: center;
            ">
              <input
                type="text"
                id="bottom-input"
                placeholder="Try 'opium fit' or 'vintage 90s'..."
                style="
                  flex: 1;
                  background: rgba(255, 255, 255, 0.1);
                  border: 1px solid rgba(255, 255, 255, 0.22);
                  border-radius: 8px;
                  padding: 8px 12px;
                  color: #ffffff;
                  font-size: 13px;
                  outline: none;
                  transition: all 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
                  pointer-events: auto;
                "
                onfocus="this.style.borderColor='#6B86FF'; this.style.background='rgba(255, 255, 255, 0.15)'"
                onblur="this.style.borderColor='rgba(255, 255, 255, 0.22)'; this.style.background='rgba(255, 255, 255, 0.1)'"
                onkeydown="handleSearchKeydown(event)"
              />
              
              <button
                onclick="handleSearch()"
                style="
                  background: #6B86FF;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  padding: 8px 12px;
                  font-size: 13px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
                  white-space: nowrap;
                  pointer-events: auto;
                "
                onmouseover="this.style.background='#5A7AFF'; this.style.transform='translateY(-1px)'"
                onmouseout="this.style.background='#6B86FF'; this.style.transform='translateY(0)'"
              >
                Send
              </button>
            </div>
          </div>

          <!-- Results -->
          <div id="results" style="
            display: none;
            flex: 1;
            overflow-y: auto;
            padding: 8px;
          ">
            <div id="results-content"></div>
          </div>

          <!-- Loading -->
          <div id="loading" style="
            display: none;
            text-align: center;
            padding: 20px;
          ">
            <div style="
              width: 32px;
              height: 32px;
              border: 2px solid rgba(255, 255, 255, 0.22);
              border-top: 2px solid #6B86FF;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 12px;
            "></div>
            <p style="
              margin: 0;
              color: rgba(255, 255, 255, 0.72);
              font-size: 13px;
            ">Finding options...</p>
          </div>

          <!-- Error -->
          <div id="error" style="
            display: none;
            text-align: center;
            padding: 20px;
          ">
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
              margin: 0 auto 12px;
            "></div>
            <h3 style="
              margin: 0 0 8px 0;
              font-size: 16px;
              font-weight: 600;
              color: #ffffff;
            ">Oops! Something went wrong</h3>
            <p style="
              margin: 0 0 16px 0;
              color: rgba(255, 255, 255, 0.72);
              font-size: 13px;
            ">We encountered an error while searching. Please try again.</p>
            <button
              onclick="handleRetry()"
              style="
                background: #6B86FF;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
              "
              onmouseover="this.style.background='#5A7AFF'"
              onmouseout="this.style.background='#6B86FF'"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(container);
    iframe = container;
    
    console.log('RGGuide: Widget created and added to DOM');
    
    // Initialize in XS mode
    setTimeout(() => {
      setSize(SIZE.XS);
      console.log('RGGuide: Widget initialized in XS mode');
    }, 50);

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.03); opacity: 1; }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; }
      }
      
      .resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        cursor: nw-resize;
        background: transparent;
        border: none;
      }
      
      .resize-handle::after {
        content: '';
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-bottom: 8px solid rgba(255, 255, 255, 0.3);
        transition: opacity 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      
      .resize-handle:hover::after {
        border-bottom-color: rgba(255, 255, 255, 0.5);
      }
      
      /* Smooth dragging performance */
      #rg-guide-widget {
        will-change: transform;
        transform: translateZ(0);
        transition: none;
        backface-visibility: hidden;
        perspective: 1000px;
      }
      
      /* Disable transitions during drag for instant response */
      #rg-guide-widget.dragging {
        transition: none !important;
        will-change: transform;
        backface-visibility: hidden;
      }
      
      /* Smooth resize performance */
      #rg-guide-widget.resizing {
        will-change: width, height;
        transition: none !important;
      }
      
      /* Input field improvements */
      #search-input::placeholder {
        color: rgba(255, 255, 255, 0.6);
        font-weight: 400;
      }
      
      #search-input:focus::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    `;
    document.head.appendChild(style);

    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    container.appendChild(resizeHandle);

    // Initialize widget
    initializeWidget();
    
    // Add drag and resize functionality
    setupDragAndResize(container);
  }

  function getPositionStyles(position) {
    const positions = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;'
    };
    return positions[position] || positions['bottom-right'];
  }

  function initializeWidget() {
    // Set up event listeners
    window.handleSearch = handleSearch;
    window.handleSearchKeydown = handleSearchKeydown;
    window.handleRetry = handleRetry;
    window.resetWidget = resetWidget;

    // Unified input functionality
    function elevateToChat(prefill, submit) {
      console.log('RGGuide: Elevating to chat with:', prefill, 'submit:', submit);
      
      // Sync input values between header and bottom input
      const unifiedInput = iframe.querySelector('#unified-input');
      const bottomInput = iframe.querySelector('#bottom-input');
      
      if (unifiedInput && bottomInput) {
        const value = prefill || unifiedInput.value;
        unifiedInput.value = value;
        bottomInput.value = value;
        
        if (submit && value.trim()) {
          console.log('RGGuide: Auto-submitting search');
          handleSearch();
        } else {
          // Only expand to show content when search is completed
          console.log('RGGuide: Expanding to show content');
          setSize(SIZE.M);
        }
      }
    }
    
    // Function to sync input values
    function syncInputValues() {
      const unifiedInput = iframe.querySelector('#unified-input');
      const bottomInput = iframe.querySelector('#bottom-input');
      
      if (unifiedInput && bottomInput) {
        // Sync from header to bottom
        unifiedInput.addEventListener('input', () => {
          bottomInput.value = unifiedInput.value;
        });
        
        // Sync from bottom to header
        bottomInput.addEventListener('input', () => {
          unifiedInput.value = bottomInput.value;
        });
      }
    }

    function setupHeaderTyping() {
      // Wait a bit for DOM to be ready
      setTimeout(() => {
        const unifiedInput = iframe.querySelector('#unified-input');
        const headerBar = iframe.querySelector('div[style*="cursor: move"]');

        console.log('RGGuide: Setting up unified typing', { 
          unifiedInput: !!unifiedInput, 
          headerBar: !!headerBar, 
          currentSize 
        });

        if (!unifiedInput) {
          console.error('RGGuide: Unified input not found!');
          return;
        }

        // Clicking the header focuses the input
        if (headerBar) {
          headerBar.addEventListener('click', (e) => {
            // ignore clicks on close button
            if (e.target.tagName === 'BUTTON') return;
            console.log('RGGuide: Header clicked, currentSize:', currentSize);
            unifiedInput.focus();
          });
        }

        unifiedInput.addEventListener('keydown', (e) => {
          console.log('RGGuide: Unified input keydown:', e.key);
          if (e.key === 'Enter') {
            e.preventDefault();
            const v = unifiedInput.value.trim();
            console.log('RGGuide: Enter pressed, value:', v);
            if (v) {
              handleSearch();
            }
          }
        });

        unifiedInput.addEventListener('input', () => {
          const v = unifiedInput.value;
          console.log('RGGuide: Unified input changed:', v, 'currentSize:', currentSize);
          
          // Don't auto-expand on typing - only expand when search is completed
        });
      }, 100);
    }
    setupHeaderTyping();
    syncInputValues();

    // Removed auto-expand on typing - widget stays in XS until manually resized

    // Trigger onReady event
    if (widgetInstance && widgetInstance.events && widgetInstance.events.onReady) {
      widgetInstance.events.onReady();
    }
  }

  function setupDragAndResize(container) {
    let isDragging = false;
    let startX, startY, startWidth, startHeight, startLeft, startTop;

    // Drag functionality
    const header = container.querySelector('div[style*="cursor: move"]');
    if (header) {
      header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return; // Don't drag when clicking buttons
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // Get current position from computed style to avoid jumps
        const rect = container.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        container.style.cursor = 'grabbing';
        container.classList.add('dragging');
        e.preventDefault();
      });
    }

    // Resize functionality
    const resizeHandle = container.querySelector('.resize-handle');
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = container.offsetWidth;
        startHeight = container.offsetHeight;
        
        container.classList.add('resizing');
        e.preventDefault();
        e.stopPropagation();
      });
    }

    // Mouse move handler with smooth dragging
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newLeft = startLeft + deltaX;
        const newTop = startTop + deltaY;
        
        // Keep widget within viewport with smooth boundaries
        const maxLeft = window.innerWidth - container.offsetWidth;
        const maxTop = window.innerHeight - container.offsetHeight;
        
        // Smooth boundary handling - allow slight overshoot for fluid movement
        const constrainedLeft = Math.max(-10, Math.min(newLeft, maxLeft + 10));
        const constrainedTop = Math.max(-10, Math.min(newTop, maxTop + 10));
        
        // Use requestAnimationFrame for smooth 60fps movement
        requestAnimationFrame(() => {
          container.style.transform = `translate(${constrainedLeft - startLeft}px, ${constrainedTop - startTop}px)`;
          container.style.left = startLeft + 'px';
          container.style.top = startTop + 'px';
          container.style.right = 'auto';
          container.style.bottom = 'auto';
        });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newWidth = Math.max(320, startWidth + deltaX);
        const newHeight = Math.max(56, startHeight + deltaY);
        
        // Direct resize for immediate response
        container.style.width = newWidth + 'px';
        container.style.height = newHeight + 'px';
        
        // Throttle state changes to prevent stuttering
        if (!container._resizeTimeout) {
          container._resizeTimeout = setTimeout(() => {
            // Change header state during resize for natural transition
            if (newWidth > 380 && newHeight > 100 && currentSize === SIZE.XS) {
              setSize(SIZE.M);
            } else if (newWidth <= 360 && newHeight <= 80 && currentSize === SIZE.M) {
              setSize(SIZE.XS);
            }
            container._resizeTimeout = null;
          }, 16); // ~60fps throttling
        }
      }
    });

    // Mouse up handler
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'move';
        container.classList.remove('dragging');
        
        // Finalize position with smooth snap-back to boundaries
        const rect = container.getBoundingClientRect();
        const maxLeft = window.innerWidth - container.offsetWidth;
        const maxTop = window.innerHeight - container.offsetHeight;
        
        // Snap back to proper boundaries if needed
        const finalLeft = Math.max(0, Math.min(rect.left, maxLeft));
        const finalTop = Math.max(0, Math.min(rect.top, maxTop));
        
        container.style.left = finalLeft + 'px';
        container.style.top = finalTop + 'px';
        container.style.transform = 'none';
      }
      
      if (isResizing) {
        isResizing = false;
        container.classList.remove('resizing');
        
        // Clear resize timeout
        if (container._resizeTimeout) {
          clearTimeout(container._resizeTimeout);
          container._resizeTimeout = null;
        }
        
        // Finalize resize - no state switching, just keep current layout
        const rect = container.getBoundingClientRect();
        const currentWidth = rect.width;
        const currentHeight = rect.height;
        
        // Ensure no transform is applied
        container.style.transform = 'none';
        
        // Determine state based on final dimensions
        if (currentWidth <= 340 && currentHeight <= 70) {
          console.log('RGGuide: Resize completed, transitioning to XS state');
          setSize(SIZE.XS, true);
        } else if (currentWidth > 400 && currentHeight > 200) {
          console.log('RGGuide: Resize completed, transitioning to M state');
          setSize(SIZE.M, true);
        }
      }
    });

    // Prevent text selection while dragging
    container.addEventListener('selectstart', (e) => {
      if (isDragging || isResizing) {
        e.preventDefault();
      }
    });
  }

  function handleSearch() {
    const unifiedInput = document.getElementById('unified-input');
    const bottomInput = document.getElementById('bottom-input');
    
    // Get query from whichever input is currently visible/active
    const query = (unifiedInput && unifiedInput.value.trim()) || (bottomInput && bottomInput.value.trim()) || '';
    
    if (!query) return;

    console.log('RGGuide: Searching for', query);
    
    // Clear both inputs
    if (unifiedInput) unifiedInput.value = '';
    if (bottomInput) bottomInput.value = '';
    
    // Show simple feedback
    const header = document.querySelector('h2');
    if (header) {
      header.textContent = `Searching for "${query}"...`;
    }
    
    // Simulate search delay
    setTimeout(() => {
      if (header) {
        header.textContent = `Found results for "${query}"`;
      }
      
      // Show simple message instead of complex results
      const idleState = document.getElementById('idle-state');
      if (idleState) {
        idleState.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 24px; margin-bottom: 12px;"></div>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.72); font-size: 13px;">
              Search completed for "${query}". Results will appear here when the LLM is connected.
            </p>
            <button 
              onclick="resetWidget()"
              style="
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.22);
                color: #ffffff;
                border-radius: 8px;
                padding: 8px 16px;
                font-size: 12px;
                cursor: pointer;
                margin-top: 12px;
                transition: all 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
              "
              onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'"
              onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'"
            >
              New Search
            </button>
          </div>
        `;
      }
      
      // Expand widget to show results when search is completed
      if (iframe) {
        console.log('RGGuide: Search completed, expanding widget to show results');
        setSize(SIZE.M);
      }
      
      // Track the search
      if (widgetInstance && widgetInstance.events && widgetInstance.events.onAction) {
        widgetInstance.events.onAction('search', { query: query });
      }
      
    }, 1000);
  }

  function resetWidget() {
    // Reset to original state
    const header = document.querySelector('h2');
    if (header) {
      header.textContent = 'TAILORD';
    }
    
    const idleState = document.getElementById('idle-state');
    if (idleState) {
      idleState.innerHTML = `
        <div style="text-align: center; padding: 20px; pointer-events: none;">
          <div style="font-size: 24px; margin-bottom: 12px; animation: pulse 1.6s ease-in-out infinite;"></div>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.72); font-size: 13px;">
            Describe your style or vibe and I'll find the perfect pieces
          </p>
        </div>
      `;
    }
    
    // Reset widget size using state machine
    if (iframe) {
      setSize(SIZE.XS);
    }
  }

  function handleSearchKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSearch();
    }
  }

  function handleRetry() {
    handleSearch();
  }

  function showLoading() {
    hideAllStates();
    document.getElementById('loading').style.display = 'block';
  }

  function showResults(results, query) {
    hideAllStates();
    
    const resultsDiv = document.getElementById('results');
    const contentDiv = document.getElementById('results-content');
    
    // Update header
    const header = document.querySelector('h2');
    header.textContent = `Items that match '${query}'`;
    
    // Create results HTML
    contentDiv.innerHTML = results.map(product => `
      <div style="
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
      " onclick="handleProductClick('${product.id}', '${product.url}')" onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.borderColor='#6B86FF'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='rgba(255, 255, 255, 0.22)'; this.style.transform='translateY(0)'">
        <div style="display: flex; gap: 12px; align-items: center;">
          <img src="${product.image}" alt="${product.name}" style="
            width: 60px;
            height: 60px;
            border-radius: 8px;
            object-fit: cover;
            background: rgba(255, 255, 255, 0.1);
          " />
          <div style="flex: 1;">
            <p style="
              margin: 0 0 4px 0;
              font-size: 11px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: rgba(255, 255, 255, 0.5);
            ">${product.brand}</p>
            <h3 style="
              margin: 0 0 4px 0;
              font-size: 13px;
              font-weight: 600;
              color: #ffffff;
              line-height: 1.3;
            ">${product.name}</h3>
            <p style="
              margin: 0 0 8px 0;
              font-size: 13px;
              font-weight: 600;
              color: rgba(255, 255, 255, 0.72);
            ">$${product.price}</p>
            <div style="display: flex; gap: 4px;">
              ${product.tags.map(tag => `
                <span style="
                  background: rgba(255, 255, 255, 0.22);
                  color: rgba(255, 255, 255, 0.72);
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
                ">${tag}</span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    resultsDiv.style.display = 'block';
    
    // Expand widget size
    if (iframe) {
      iframe.style.width = '420px';
      iframe.style.height = '560px';
    }
  }

  function handleProductClick(productId, productUrl) {
    console.log('RGGuide: Product clicked', productId, productUrl);
    
    // Track analytics
    if (widgetInstance && widgetInstance.events && widgetInstance.events.onAction) {
      widgetInstance.events.onAction('itemClick', { id: productId, url: productUrl });
    }
    
    // Simulate navigation
    alert(`Product clicked: ${productId}\nURL: ${productUrl}\n\nIn a real implementation, this would navigate to the product page.`);
  }

  function hideAllStates() {
    document.getElementById('idle-state').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('results').style.display = 'none';
  }

  // Expose global API
  window.RGGuide = RGGuide;

  // Auto-initialize if script has data attributes
  function autoInit() {
    const script = document.getElementById(SCRIPT_ID);
    if (script) {
      const siteId = script.getAttribute('data-site-id');
      const theme = script.getAttribute('data-theme') || 'auto';
      const position = script.getAttribute('data-position') || 'bottom-right';

      if (siteId) {
        RGGuide.init({
          siteId: siteId,
          theme: theme,
          position: position
        });
      }
    }
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Fallback: Initialize with defaults if not already initialized
  setTimeout(() => {
    if (!config) {
      console.log('RGGuide: Auto-initializing with default config');
      RGGuide.init({
        siteId: 'default-site',
        theme: 'auto',
        position: 'bottom-right'
      });
    }
  }, 2000);

  console.log('RGGuide: Embed script loaded successfully');

})();
