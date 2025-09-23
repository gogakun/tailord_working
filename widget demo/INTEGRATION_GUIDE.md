# Integration Guide

## Quick Integration (1 minute)

### Step 1: Add the Script

```html
<!-- Add to your <head> or before closing </body> -->
<script src="https://cdn.roguegarms.com/guide/latest.js" async></script>
```

### Step 2: Initialize the Widget

```html
<script>
  window.RGGuide && RGGuide.init({
    siteId: "your-site-id"
  });
</script>
```

That's it! The widget will appear in the bottom-right corner.

## Advanced Integration

### Custom Configuration

```html
<script>
  window.RGGuide && RGGuide.init({
    siteId: "your-site-id",
    theme: "dark",                    // 'light' | 'dark' | 'auto'
    position: "bottom-left",           // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    apiUrl: "https://your-api.com"    // Optional: Custom API endpoint
  });
</script>
```

### Event Handling

```html
<script>
  window.RGGuide && RGGuide.init({
    siteId: "your-site-id"
  });

  // Listen for widget events
  RGGuide.on('onReady', () => {
    console.log('Widget loaded successfully');
  });

  RGGuide.on('onError', (error) => {
    console.error('Widget error:', error);
    // Handle errors gracefully
  });

  RGGuide.on('onAction', (action, payload) => {
    if (action === 'itemClick') {
      // Track product clicks
      analytics.track('product_click', {
        productId: payload.id,
        productUrl: payload.url
      });
    }
  });
</script>
```

## Product Page Integration

### Resume Sessions

When users click products, add session resumption to your product pages:

```html
<script>
  // Check for session ID in URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('rg_session');
  
  if (sessionId && window.RGGuide) {
    // Resume the widget session
    RGGuide.resume(sessionId);
  }
</script>
```

### Custom Product URLs

If you need custom product URL handling:

```javascript
RGGuide.on('onAction', (action, payload) => {
  if (action === 'itemClick') {
    // Custom URL handling
    const customUrl = `/products/${payload.id}?rg_session=${sessionId}`;
    window.location.href = customUrl;
  }
});
```

## Theming Integration

### CSS Variable Override

Override the widget's appearance to match your site:

```html
<style>
  /* Light theme for light sites */
  [data-theme="light"] {
    --rg-glass-tint: rgba(255, 255, 255, 0.25);
    --rg-text: #1a1a1a;
    --rg-text-dim: rgba(26, 26, 26, 0.72);
    --rg-accent: #your-brand-color;
  }

  /* Dark theme for dark sites */
  [data-theme="dark"] {
    --rg-glass-tint: rgba(12, 14, 18, 0.36);
    --rg-text: #ffffff;
    --rg-text-dim: rgba(255, 255, 255, 0.72);
    --rg-accent: #your-brand-color;
  }
</style>
```

### Brand Color Integration

```html
<style>
  :root {
    --rg-accent: #your-brand-color;
    --rg-accent-hover: #your-brand-color-hover;
  }
</style>
```

## Analytics Integration

### Google Analytics

```javascript
RGGuide.on('onAction', (action, payload) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'widget_action', {
      event_category: 'widget',
      event_label: action,
      value: payload?.id || 0
    });
  }
});
```

### Mixpanel

```javascript
RGGuide.on('onAction', (action, payload) => {
  if (typeof mixpanel !== 'undefined') {
    mixpanel.track('Widget Action', {
      action: action,
      payload: payload,
      timestamp: Date.now()
    });
  }
});
```

### Custom Analytics

```javascript
RGGuide.on('onAction', (action, payload) => {
  // Send to your analytics endpoint
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'widget_action',
      action: action,
      payload: payload,
      timestamp: Date.now()
    })
  });
});
```

## E-commerce Integration

### Shopify

```html
<!-- Add to your theme.liquid -->
<script src="https://cdn.roguegarms.com/guide/latest.js" async></script>
<script>
  window.RGGuide && RGGuide.init({
    siteId: "{{ shop.permanent_domain }}",
    theme: "{{ settings.color_scheme }}"
  });
</script>
```

### WooCommerce

```php
// Add to your theme's functions.php
function add_rogue_garms_widget() {
    ?>
    <script src="https://cdn.roguegarms.com/guide/latest.js" async></script>
    <script>
      window.RGGuide && RGGuide.init({
        siteId: "<?php echo get_site_url(); ?>",
        theme: "auto"
      });
    </script>
    <?php
}
add_action('wp_footer', 'add_rogue_garms_widget');
```

### Magento

```xml
<!-- Add to your theme's default.xml -->
<referenceContainer name="before.body.end">
    <block class="Magento\Framework\View\Element\Template" name="rogue.garms.widget" template="Magento_Theme::rogue_garms_widget.phtml"/>
</referenceContainer>
```

## Performance Optimization

### Lazy Loading

```html
<!-- Load widget only when needed -->
<script>
  function loadWidget() {
    const script = document.createElement('script');
    script.src = 'https://cdn.roguegarms.com/guide/latest.js';
    script.async = true;
    script.onload = function() {
      window.RGGuide && RGGuide.init({
        siteId: "your-site-id"
      });
    };
    document.head.appendChild(script);
  }

  // Load on user interaction
  document.addEventListener('click', loadWidget, { once: true });
</script>
```

### Conditional Loading

```html
<script>
  // Only load on product pages
  if (window.location.pathname.includes('/products/')) {
    const script = document.createElement('script');
    script.src = 'https://cdn.roguegarms.com/guide/latest.js';
    script.async = true;
    document.head.appendChild(script);
  }
</script>
```

## Troubleshooting

### Common Issues

**Widget not appearing?**
1. Check browser console for errors
2. Verify `siteId` is correct
3. Ensure script loads before initialization
4. Check for CSP restrictions

**Styling conflicts?**
1. Widget uses iframe isolation - no conflicts should occur
2. Check for global CSS overrides
3. Verify z-index conflicts

**Session not working?**
1. Check localStorage is enabled
2. Verify cookie settings
3. Ensure same-origin policy
4. Check for ad blockers

### Debug Mode

```javascript
// Enable debug logging
RGGuide.init({
  siteId: "your-site-id",
  debug: true
});

// Check widget state
console.log('Widget state:', RGGuide.getState());
```

### Testing

```javascript
// Test widget functionality
RGGuide.open();
RGGuide.setQuery("test query");
RGGuide.close();

// Test events
RGGuide.on('onReady', () => console.log('Widget ready'));
RGGuide.on('onError', (error) => console.error('Widget error:', error));
```

## Security Considerations

### Content Security Policy

If you use CSP, add these directives:

```
script-src 'self' https://cdn.roguegarms.com;
frame-src 'self' https://guide.roguegarms.com;
```

### HTTPS Requirements

The widget requires HTTPS in production:
- Development: HTTP allowed
- Production: HTTPS required
- Mixed content: Not supported

### Data Privacy

The widget:
- ✅ Uses first-party cookies only
- ✅ Stores data in localStorage
- ✅ No third-party tracking
- ✅ GDPR compliant by design
- ❌ No personal data collection

## Support

### Getting Help

- 📧 **Email**: support@roguegarms.com
- 📖 **Documentation**: https://docs.roguegarms.com/guide
- 🐛 **Bug Reports**: https://github.com/roguegarms/guide-widget/issues
- 💬 **Community**: https://discord.gg/roguegarms

### Feature Requests

Submit feature requests via:
- GitHub Issues
- Email support
- Community Discord

### Updates

The widget auto-updates from CDN. For version pinning:

```html
<!-- Pin to specific version -->
<script src="https://cdn.roguegarms.com/guide/v1.0.0.js" async></script>
```
