# Rogue Garms Guide Widget

An embeddable fashion guide widget with Apple-style glassmorphism, built with Svelte for maximum performance and minimal bundle size.

## Features

- **Glassmorphism** - Beautiful translucent design with backdrop blur
- **Responsive Sizing** - Three size states (XS/M/L) with smooth transitions
- **Accessibility First** - ARIA labels, keyboard navigation, high contrast support
- **Session Management** - Anonymous sessions with cross-tab sync
- **Performance Optimized** - <80KB gzipped, lazy loading, 60fps animations
- **Security Focused** - Iframe isolation, CSP-friendly, no global CSS leaks

## Quick Start

### 1. One-Line Integration

```html
<script src="https://cdn.roguegarms.com/guide/latest.js" async></script>
<script>
  window.RGGuide && RGGuide.init({ 
    siteId: "your-site-id", 
    theme: "auto" 
  });
</script>
```

### 2. Advanced Integration

```html
<script src="https://cdn.roguegarms.com/guide/latest.js" async></script>
<script>
  window.RGGuide && RGGuide.init({
    siteId: "your-site-id",
    theme: "dark", // 'light' | 'dark' | 'auto'
    position: "bottom-right", // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    apiUrl: "https://your-api.com" // Optional custom API endpoint
  });
</script>
```

## API Reference

### Initialization

```javascript
RGGuide.init({
  siteId: string,        // Required: Your site identifier
  theme?: 'light' | 'dark' | 'auto',  // Optional: Theme preference
  position?: string,     // Optional: Widget position
  apiUrl?: string       // Optional: Custom API endpoint
});
```

### Methods

```javascript
// Open the widget
RGGuide.open();

// Close the widget
RGGuide.close();

// Set a search query programmatically
RGGuide.setQuery("opium fit");

// Resume a session (useful for product page integration)
RGGuide.resume(sessionId);
```

### Events

```javascript
// Listen for widget events
RGGuide.on('onReady', () => {
  console.log('Widget is ready!');
});

RGGuide.on('onError', (error) => {
  console.error('Widget error:', error);
});

RGGuide.on('onAction', (action, payload) => {
  console.log('Widget action:', action, payload);
});

RGGuide.on('onStateChange', (state) => {
  console.log('Widget state:', state);
});
```

## Widget States

### XS - Dock (56px height)
- **Purpose**: Minimal presence, input only
- **Shows**: Input field + gentle greeting
- **Triggers**: Idle state, first interaction

### M - Chat (420×560px)
- **Purpose**: Conversational results and carousel
- **Shows**: Results carousel + minimal LLM responses
- **Features**: Carousel navigation, view toggle

### L - Gallery (720×640px)
- **Purpose**: Dense browsing with descriptions
- **Shows**: Grid view + detailed product info
- **Features**: Grid/carousel toggle, expanded details

## Theming

### CSS Variables

The widget uses CSS custom properties for theming:

```css
:root {
  /* Glass effect */
  --rg-glass-blur: 14px;
  --rg-glass-tint: rgba(12, 14, 18, 0.36);
  
  /* Strokes */
  --rg-stroke-in: rgba(255, 255, 255, 0.22);
  --rg-stroke-out: rgba(0, 0, 0, 0.12);
  
  /* Colors */
  --rg-text: #ffffff;
  --rg-text-dim: rgba(255, 255, 255, 0.72);
  --rg-accent: #6B86FF;
  
  /* Animation */
  --rg-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --rg-dur-fast: 140ms;
}
```

### Theme Override

```html
<style>
  [data-theme="light"] {
    --rg-glass-tint: rgba(255, 255, 255, 0.25);
    --rg-text: #1a1a1a;
    --rg-text-dim: rgba(26, 26, 26, 0.72);
  }
</style>
```

## Session Management

### Anonymous Sessions

The widget automatically creates anonymous sessions using:
- `localStorage` for persistence
- First-party cookies (`rg_session`)
- `BroadcastChannel` for cross-tab sync
- 7-day TTL with automatic cleanup

### Product Page Integration

When users click products, the widget:
1. Adds `?rg_session=<id>` to the product URL
2. Product pages can call `RGGuide.resume(sessionId)` to restore state
3. Maintains search context across page navigation

### Example Product Page Integration

```html
<script>
  // On product pages, resume the widget session
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('rg_session');
  
  if (sessionId && window.RGGuide) {
    RGGuide.resume(sessionId);
  }
</script>
```

## Accessibility

### Keyboard Navigation
- `Enter` - Submit search
- `Shift+Enter` - New line (chat mode)
- `←/→` - Navigate carousel
- `Esc` - Minimize to XS
- `g` - Toggle grid/carousel view

### ARIA Support
- Proper `role` attributes
- `aria-label` for all interactive elements
- Focus management and trapping
- Screen reader announcements

### Motion Preferences
- Respects `prefers-reduced-motion`
- Disables animations for accessibility
- Static alternatives for visual cues

### High Contrast
- Auto-elevates contrast to 4.5:1 minimum
- Respects `prefers-contrast: high`
- Enhanced borders and focus indicators

## Performance

### Bundle Size
- **Core**: <80KB gzipped
- **Lazy Loading**: Heavy libraries loaded on demand
- **Tree Shaking**: Unused code eliminated
- **Compression**: Terser minification + gzip

### Runtime Performance
- **60fps Target**: Optimized for mid-range laptops
- **Idle Loading**: Non-critical resources deferred
- **Blur Optimization**: Limited to key surfaces only
- **Memory Management**: Proper cleanup and disposal

### Loading Strategy
```javascript
// Lazy load heavy dependencies
const loadHeavyLib = async () => {
  if (needsHeavyLib) {
    const { HeavyLibrary } = await import('./heavy-lib.js');
    return HeavyLibrary;
  }
};
```

## Security

### Iframe Isolation
- Complete CSS isolation
- No global variable pollution
- Sandboxed execution context
- CSP-friendly implementation

### Data Privacy
- No third-party cookies
- First-party session storage only
- No personal data collection
- GDPR-compliant by design

### Content Security
- All text sanitized before rendering
- No untrusted HTML injection
- XSS protection built-in
- Secure postMessage communication

## Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Features Used**: ES2015+, CSS Grid, Backdrop Filter, BroadcastChannel
- **Fallbacks**: Graceful degradation for older browsers
- **Mobile**: iOS 14+, Android 8+

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Project Structure

```
src/
├── components/          # Svelte components
│   ├── Widget.svelte    # Main widget component
│   ├── Input.svelte     # Search input
│   ├── Results.svelte   # Results display
│   ├── ProductCard.svelte # Product cards
│   ├── Loading.svelte   # Loading states
│   └── Error.svelte     # Error handling
├── lib/                 # Utilities
│   ├── session.ts       # Session management
│   └── api.ts          # API client
├── styles/              # CSS
│   └── glassmorphism.css # Glassmorphism styles
└── main.ts             # Entry point
```

### Building

```bash
# Development build
npm run build

# Production build with optimizations
NODE_ENV=production npm run build
```

## Analytics & Monitoring

### Built-in Metrics
- Search queries and results
- Click-through rates
- View toggles (grid/carousel)
- Session duration
- Error rates

### Custom Analytics
```javascript
RGGuide.on('onAction', (action, payload) => {
  // Send to your analytics service
  analytics.track('widget_action', {
    action,
    payload,
    timestamp: Date.now()
  });
});
```

## Troubleshooting

### Common Issues

**Widget not loading?**
- Check console for errors
- Verify `siteId` is correct
- Ensure HTTPS for production

**Styling conflicts?**
- Widget uses iframe isolation
- No global CSS should leak
- Check for CSP restrictions

**Session not persisting?**
- Verify localStorage is enabled
- Check cookie settings
- Ensure same-origin policy

### Debug Mode

```javascript
// Enable debug logging
RGGuide.init({
  siteId: "your-site-id",
  debug: true
});
```

## License

MIT License - see LICENSE file for details.

## Support

- 📧 Email: support@roguegarms.com
- 📖 Docs: https://docs.roguegarms.com/guide
- 🐛 Issues: https://github.com/roguegarms/guide-widget/issues
