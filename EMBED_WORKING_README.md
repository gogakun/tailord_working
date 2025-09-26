## `embed-working.js` Guide

### Purpose
- Provides a dependency-free embeddable widget for Tailord demo pages.
- Manages lifecycle (init/open/close/destroy), UI state transitions, drag/resize, and API communication.
- Exposes a minimal global API through `window.RGGuide`.

### High-Level Flow
1. Immediately invoked function expression sets up constants and module-level state (`widgetInstance`, `iframe`, `config`).
2. `RGGuide.init(config)` merges defaults and calls `createWidget()`.
3. `createWidget()` builds the DOM container, injects HTML/CSS, attaches drag/resize handlers, and boots the widget in XS mode via `setSize(SIZE.XS)`.
4. User interactions (typing, search submission, button clicks) drive transitions handled by `handleSearch`, `showResults`, `setSize`, etc.
5. The widget can be programmatically controlled via `RGGuide.open()`, `RGGuide.close()`, `RGGuide.setQuery()`, `RGGuide.on(event, cb)`, and `RGGuide.destroy()`.

### File Structure & Key Functions
- **Size management**: `SIZE` enum (`XS`, `M`, `L`) and `setSize(tier)` adjust iframe dimensions, toggle header/input layouts, and enforce viewport boundaries.
- **Widget API** (`RGGuide` object):
  - `init(config)` – required before other calls. Accepts `{ siteId, theme, position, apiUrl }`.
  - `open()` / `close()` – show/hide the container.
  - `setQuery(query)` – programmatically trigger a search.
  - `on(event, cb)` / `off(event)` – attach/remove callbacks for `onReady`, `onError`, `onAction`, etc.
  - `destroy()` – remove DOM nodes and reset state.
- **UI lifecycle helpers**:
  - `createWidget()` – builds the container markup, injects styles, installs event listeners, sets up drag/resize.
  - `initializeWidget()` – wires input syncing, header focus behaviour, unified typing, ready event.
  - `setupDragAndResize(container)` – handles pointer events, updates position/size, clamps to viewport.
  - `ensureWidgetInViewport(container)` – sanity check to keep the widget on-screen (called after size changes, window resize, and on an interval).
- **Search UX**:
  - `handleSearch()` – reads input, shows in-widget feedback, triggers `setSize(SIZE.M)` on completion, fires `onAction('search')`.
  - `showResults(results, query)` – toggles visibility of results pane and ensures size/position.
  - `resetWidget()`, `handleRetry()`, `handleSearchKeydown()` – support functions for state reset and input handling.

### Integration Steps
1. **Include the script** on your page: `<script src="embed-working.js"></script>`.
2. **Initialize** once the script loads:
   ```html
   <script>
     window.RGGuide.init({
       siteId: 'my-site',
       theme: 'auto',
       position: 'bottom-right',
       apiUrl: 'https://my-domain.com'
     });
   </script>
   ```
3. **Control the widget** with the exposed API:
   ```js
   window.RGGuide.open();
   window.RGGuide.setQuery('90s baggy jeans');
   window.RGGuide.on('onAction', (action, payload) => console.log(action, payload));
   ```
4. **Handle lifecycle** when navigating SPAs by calling `destroy()` before removing the page.

### Positioning & Resizing
- Initial position determined by `position` config (`bottom-right`, `bottom-left`, `top-right`, `top-left`).
- Dragging uses mouse events on the header; constrained to viewport with strict boundary checks.
- Resizing via bottom-right handle; updates size state (`XS` ↔ `M`) based on thresholds.
- `ensureWidgetInViewport` runs:
  - after `setSize`
  - on `window.resize`
  - every second while visible (safety net)

### Search Handling & External APIs
- The embed does **not** directly call backend APIs; it expects the host page to load `embed-working.js`, which in turn uses global functions (`handleSearch`, `handleRetry`) to simulate results.
- For production, wire `handleSearch()` to your real API (see `API_README.md`). Replace the placeholder message with actual network calls and call `showResults` when data arrives.

### Event Hooks
- `onReady` – fired after initialization finishes.
- `onAction` – receives `{ action, payload }` for search submissions, product clicks, etc.
- `onError` – fired when internal operations fail (extend as needed).

### Extending the Widget
- Update CSS by editing inline styles or attaching a shadow DOM stylesheet.
- Adapt layout by modifying HTML strings within `container.innerHTML` (consider extracting to template literals for maintainability).
- For TypeScript/Svelte version, reference `src/widget demo/src/components/Widget.svelte`; it mirrors the behaviour with framework tooling.

### Debugging Tips
- Console logs sprinkled throughout (`RGGuide:` prefix) help trace lifecycle events.
- Use the `setSize` debug logs (enabled in current code) to observe viewport calculations.
- If the widget “jumps” off-screen, check outputs from `ensureWidgetInViewport` and drag handlers.



