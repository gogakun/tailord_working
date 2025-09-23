import type { SessionData } from '../types';

const SESSION_KEY = 'rg_session';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export class SessionManager {
  private sessionId: string | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.initializeSession();
    this.setupCrossTabSync();
  }

  private initializeSession(): void {
    // Try to get existing session from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const urlSessionId = urlParams.get('rg_session');
    
    if (urlSessionId) {
      this.sessionId = urlSessionId;
      this.saveSessionToStorage();
      return;
    }

    // Try to get from localStorage
    const storedSession = this.getStoredSession();
    if (storedSession && this.isSessionValid(storedSession)) {
      this.sessionId = storedSession.sessionId;
      return;
    }

    // Create new session
    this.createNewSession();
  }

  private createNewSession(): void {
    this.sessionId = this.generateSessionId();
    this.saveSessionToStorage();
  }

  private generateSessionId(): string {
    return 'rg_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private getStoredSession(): SessionData | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private isSessionValid(session: SessionData): boolean {
    const now = Date.now();
    return (now - session.timestamp) < SESSION_TTL;
  }

  private saveSessionToStorage(): void {
    if (!this.sessionId) return;

    const sessionData: SessionData = {
      sessionId: this.sessionId,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      this.setCookie();
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  }

  private setCookie(): void {
    if (!this.sessionId) return;

    const cookieValue = `rg_session=${this.sessionId}; SameSite=Lax; Max-Age=${SESSION_TTL / 1000}; Path=/`;
    document.cookie = cookieValue;
  }

  private setupCrossTabSync(): void {
    if (typeof BroadcastChannel === 'undefined') return;

    try {
      this.broadcastChannel = new BroadcastChannel('rg-guide');
      
      this.broadcastChannel.addEventListener('message', (event) => {
        if (event.data.type === 'session_update') {
          this.handleSessionUpdate(event.data.sessionData);
        }
      });

      // Listen for storage events as fallback
      window.addEventListener('storage', (event) => {
        if (event.key === SESSION_KEY && event.newValue) {
          try {
            const sessionData = JSON.parse(event.newValue);
            this.handleSessionUpdate(sessionData);
          } catch (error) {
            console.warn('Failed to parse session data from storage event:', error);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to setup cross-tab sync:', error);
    }
  }

  private handleSessionUpdate(sessionData: SessionData): void {
    if (sessionData.sessionId === this.sessionId) {
      // Update current session with new data
      this.updateSession(sessionData);
    }
  }

  public getSessionId(): string | null {
    return this.sessionId;
  }

  public updateSession(updates: Partial<SessionData>): void {
    if (!this.sessionId) return;

    const currentSession = this.getStoredSession() || {
      sessionId: this.sessionId,
      timestamp: Date.now()
    };

    const updatedSession: SessionData = {
      ...currentSession,
      ...updates,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
      
      // Broadcast to other tabs
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'session_update',
          sessionData: updatedSession
        });
      }
    } catch (error) {
      console.warn('Failed to update session:', error);
    }
  }

  public getSessionData(): SessionData | null {
    return this.getStoredSession();
  }

  public clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
      document.cookie = 'rg_session=; Max-Age=0; Path=/';
      
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'session_clear'
        });
      }
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
    
    this.createNewSession();
  }

  public resumeSession(sessionId: string): boolean {
    const storedSession = this.getStoredSession();
    if (storedSession && storedSession.sessionId === sessionId && this.isSessionValid(storedSession)) {
      this.sessionId = sessionId;
      return true;
    }
    return false;
  }

  public destroy(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}
