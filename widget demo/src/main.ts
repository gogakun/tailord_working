import Widget from './components/Widget.svelte';
import type { WidgetConfig, WidgetAPI, WidgetEvents } from './types';

class RGGuide implements WidgetAPI {
  private widget: Widget | null = null;
  private config: WidgetConfig | null = null;
  private events: WidgetEvents = {};
  private container: HTMLElement | null = null;

  init(config: WidgetConfig): void {
    this.config = config;
    this.createWidget();
  }

  private createWidget(): void {
    if (!this.config) {
      console.error('RGGuide: Must call init() with config first');
      return;
    }

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'rg-guide-widget';
    document.body.appendChild(this.container);

    // Create Svelte component
    this.widget = new Widget({
      target: this.container,
      props: {
        config: this.config,
        events: this.events
      }
    });
  }

  open(): void {
    if (this.widget) {
      this.widget.open();
    }
  }

  close(): void {
    if (this.widget) {
      this.widget.close();
    }
  }

  setQuery(query: string): void {
    if (this.widget) {
      this.widget.setQuery(query);
    }
  }

  on(event: keyof WidgetEvents, callback: Function): void {
    this.events[event] = callback as any;
  }

  off(event: keyof WidgetEvents, callback: Function): void {
    delete this.events[event];
  }

  resume(sessionId: string): boolean {
    // This would be handled by the session manager
    // For now, just return true
    return true;
  }

  destroy(): void {
    if (this.widget) {
      this.widget.$destroy();
      this.widget = null;
    }
    
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// Global API
declare global {
  interface Window {
    RGGuide: WidgetAPI;
  }
}

// Export for module usage
export default RGGuide;

// Global setup
if (typeof window !== 'undefined') {
  window.RGGuide = new RGGuide();
}
