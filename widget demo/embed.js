/**
 * Rogue Garms Guide Widget - Embed Script
 * Version: 1.0.0
 * 
 * This script creates an iframe-based widget for maximum isolation
 * and prevents CSS conflicts with the host site.
 */

(function() {
  'use strict';

  // Configuration
  const WIDGET_VERSION = '1.0.0';
  const IFRAME_SRC = 'https://guide.roguegarms.com/widget.html';
  const SCRIPT_ID = 'rg-guide-script';
  const WIDGET_ID = 'rg-guide-widget';

  // Global API
  let widgetInstance = null;
  let iframe = null;
  let config = null;

  // Message types for iframe communication
  const MESSAGE_TYPES = {
    WIDGET_READY: 'widget_ready',
    WIDGET_ERROR: 'widget_error',
    WIDGET_STATE_CHANGE: 'widget_state_change',
    WIDGET_ACTION: 'widget_action',
    PARENT_OPEN: 'parent_open',
    PARENT_CLOSE: 'parent_close',
    PARENT_SET_QUERY: 'parent_set_query',
    PARENT_RESUME: 'parent_resume'
  };

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
        apiUrl: widgetConfig.apiUrl || 'https://api.roguegarms.com',
        ...widgetConfig
      };

      createIframe();
      setupMessageListener();
    },

    open: function() {
      if (iframe) {
        iframe.style.display = 'block';
        iframe.contentWindow.postMessage({
          type: MESSAGE_TYPES.PARENT_OPEN
        }, '*');
      }
    },

    close: function() {
      if (iframe) {
        iframe.style.display = 'none';
        iframe.contentWindow.postMessage({
          type: MESSAGE_TYPES.PARENT_CLOSE
        }, '*');
      }
    },

    setQuery: function(query) {
      if (iframe) {
        iframe.contentWindow.postMessage({
          type: MESSAGE_TYPES.PARENT_SET_QUERY,
          query: query
        }, '*');
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
    },

    off: function(event, callback) {
      if (widgetInstance && widgetInstance.events) {
        delete widgetInstance.events[event];
      }
    },

    resume: function(sessionId) {
      if (iframe) {
        iframe.contentWindow.postMessage({
          type: MESSAGE_TYPES.PARENT_RESUME,
          sessionId: sessionId
        }, '*');
      }
    },

    destroy: function() {
      if (iframe) {
        iframe.remove();
        iframe = null;
      }
      widgetInstance = null;
      config = null;
    }
  };

  function createIframe() {
    // Remove existing widget
    const existing = document.getElementById(WIDGET_ID);
    if (existing) {
      existing.remove();
    }

    // Create iframe
    iframe = document.createElement('iframe');
    iframe.id = WIDGET_ID;
    iframe.src = IFRAME_SRC;
    iframe.style.cssText = `
      position: fixed;
      border: none;
      background: transparent;
      z-index: 9999;
      display: none;
      width: 320px;
      height: 56px;
      ${getPositionStyles(config.position)}
    `;

    // Add to DOM
    document.body.appendChild(iframe);

    // Handle iframe load
    iframe.onload = function() {
      // Send configuration to iframe
      iframe.contentWindow.postMessage({
        type: 'init',
        config: config
      }, '*');
    };
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

  function setupMessageListener() {
    window.addEventListener('message', function(event) {
      // Security: Only accept messages from our iframe
      if (event.source !== iframe.contentWindow) {
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case MESSAGE_TYPES.WIDGET_READY:
          handleWidgetReady();
          break;

        case MESSAGE_TYPES.WIDGET_ERROR:
          handleWidgetError(data);
          break;

        case MESSAGE_TYPES.WIDGET_STATE_CHANGE:
          handleStateChange(data);
          break;

        case MESSAGE_TYPES.WIDGET_ACTION:
          handleWidgetAction(data);
          break;
      }
    });
  }

  function handleWidgetReady() {
    if (widgetInstance && widgetInstance.events && widgetInstance.events.onReady) {
      widgetInstance.events.onReady();
    }
  }

  function handleWidgetError(error) {
    if (widgetInstance && widgetInstance.events && widgetInstance.events.onError) {
      widgetInstance.events.onError(error);
    }
  }

  function handleStateChange(state) {
    if (widgetInstance && widgetInstance.events && widgetInstance.events.onStateChange) {
      widgetInstance.events.onStateChange(state);
    }
  }

  function handleWidgetAction(action) {
    if (widgetInstance && widgetInstance.events && widgetInstance.events.onAction) {
      widgetInstance.events.onAction(action.type, action.payload);
    }
  }

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

  // Expose global API
  window.RGGuide = RGGuide;

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Handle page visibility changes
  document.addEventListener('visibilitychange', function() {
    if (iframe && document.visibilityState === 'visible') {
      // Resume session when page becomes visible
      const sessionId = getSessionId();
      if (sessionId) {
        RGGuide.resume(sessionId);
      }
    }
  });

  // Utility function to get session ID from URL or storage
  function getSessionId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('rg_session') || localStorage.getItem('rg_session');
  }

})();
