export interface WidgetConfig {
  siteId: string;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  apiUrl?: string;
}

export interface WidgetState {
  status: 'idle' | 'thinking' | 'results' | 'chat' | 'error';
  size: 'xs' | 'm' | 'l';
  query?: string;
  results?: Product[];
  error?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  url: string;
  tags: string[];
  description?: string;
}

export interface SessionData {
  sessionId: string;
  lastQuery?: string;
  lastResults?: Product[];
  lastSize?: 'xs' | 'm' | 'l';
  timestamp: number;
}

export interface WidgetEvents {
  onReady?: () => void;
  onError?: (error: string) => void;
  onAction?: (action: string, payload?: any) => void;
  onStateChange?: (state: WidgetState) => void;
}

export interface WidgetAPI {
  init: (config: WidgetConfig) => void;
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  on: (event: keyof WidgetEvents, callback: Function) => void;
  off: (event: keyof WidgetEvents, callback: Function) => void;
  resume: (sessionId: string) => void;
  destroy: () => void;
}
