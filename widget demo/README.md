## Rogue Garms Guide Widget — Current Documentation

This folder contains a self-contained demo and the embed script for the RGGuide widget. The working embed is `embed-working.js`. The widget UI and behavior must remain unchanged; this README reflects the current, working state.

### File structure
- `embed-working.js`: The embed script to include on a page.
- `iframe.html`: The widget’s iframe shell used by the embed script.
- `test.html`: Minimal demo that verifies core behavior.
- `real-world-demo.html`: Loads external sites in an iframe and overlays the widget for realistic testing.
- `demo-server.js`: Simple HTTP server with mock endpoints to support demos.
- `vite.config.js`, `src/`, `package.json`: Local build/dev setup for the Svelte widget bundle.

### Quick start (Embed on any site)
Add the script and initialize the widget. Use your real `siteId` in production.

```html
<script src="/path/to/embed-working.js"></script>
<script>
  window.RGGuide && window.RGGuide.init({
    siteId: 'your-site-id',
    theme: 'auto',           // 'light' | 'dark' | 'auto'
    position: 'bottom-right' // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  });
</script>
```

### Public API
- `RGGuide.init(options)`
  - `siteId: string` (required)
  - `theme?: 'light' | 'dark' | 'auto'` (default: `auto`)
  - `position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'` (default: `bottom-right`)

- `RGGuide.open()` — programmatically open the widget
- `RGGuide.close()` — programmatically close the widget
- `RGGuide.on(eventName, handler)` — subscribe to widget events

### Events
- `onReady` — widget fully loaded
- `onError` — when the widget encounters a recoverable error (handler receives an error object)
- `onAction` — user actions inside the widget (handler receives `(action, payload)`)

Example:
```html
<script>
  window.RGGuide.on('onReady', () => console.log('Widget ready'));
  window.RGGuide.on('onError', (e) => console.error('Widget error', e));
  window.RGGuide.on('onAction', (action, payload) => console.log(action, payload));
</script>
```

### Demos
- `test.html` — simplest verification. Buttons call `RGGuide.open()`/`RGGuide.close()`.
- `real-world-demo.html` — enter a URL to preview the widget overlayed over external sites.

Open these directly in a browser, or run the local demo server (below) and visit:
- `http://localhost:3000/test.html`
- `http://localhost:3000/real-world-demo.html`

### Local demo server
From this directory:

```bash
npm install
npm run demo
# Then open http://localhost:3000/test.html
```

The server also exposes mock endpoints used by demos:
- `POST /api/fashion-search` — returns mock product results
- `POST /api/analytics` — accepts analytics payloads

The server’s root (`/`) defaults to `test.html`.

### Development & Build
The Svelte widget bundle is built with Vite. From this directory:

```bash
# Dev server for the Svelte package (if needed)
npm run dev

# Production build of the widget package (outputs dist/widget.* via Vite)
npm run build
```

Additionally, `build.js` assembles a distributable embed bundle that inlines `embed-working.js` and emits:
- `dist/guide.js` — production embed script
- `dist/widget.html` — iframe HTML
- `dist/cdn.js` — simple CDN loader

Run it with Node if you need those artifacts:

```bash
node build.js
```

### Notes
- Only `embed-working.js` is supported for embedding. Avoid `embed.js`.
- Keep `iframe.html` in sync with widget expectations; the embed script loads it.
- Do not change public API or visuals without updating this README and demos.



