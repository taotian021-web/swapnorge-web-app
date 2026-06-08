'use client';

/**
 * 🔧 Phase 4: Cross-Tab Synchronization
 * 
 * Synchronizes auth state across multiple browser tabs/windows using:
 * 1. BroadcastChannel API (modern browsers)
 * 2. Storage events (fallback for older browsers)
 * 3. localStorage as the shared state medium
 */

export type AuthSyncEvent = {
  type: 'AUTH_SIGN_IN' | 'AUTH_SIGN_OUT' | 'AUTH_STATE_CHANGE' | 'REQUEST_STATE';
  userId?: string;
  timestamp: number;
  tabId: string;
};

export type AuthSyncListener = (event: AuthSyncEvent) => void;

const SYNC_CHANNEL_NAME = 'auth_sync_channel';
const SYNC_EVENT_KEY = 'auth_sync_event';
const TAB_ID_KEY = 'tab_id';

/**
 * Generate unique tab identifier
 */
function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get or create tab ID for this window
 */
function getTabId(): string {
  try {
    let tabId = sessionStorage.getItem(TAB_ID_KEY);
    if (!tabId) {
      tabId = generateTabId();
      sessionStorage.setItem(TAB_ID_KEY, tabId);
    }
    return tabId;
  } catch {
    return generateTabId();
  }
}

/**
 * StorageSyncManager - Uses localStorage events as fallback
 */
class StorageSyncManager {
  private listeners: AuthSyncListener[] = [];
  private tabId: string;

  constructor() {
    this.tabId = getTabId();
  }

  /**
   * Subscribe to auth sync events
   */
  subscribe(listener: AuthSyncListener): () => void {
    this.listeners.push(listener);

    // Listen for storage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SYNC_EVENT_KEY && event.newValue) {
        try {
          const syncEvent: AuthSyncEvent = JSON.parse(event.newValue);
          // Only process events from other tabs
          if (syncEvent.tabId !== this.tabId) {
            try {
              listener(syncEvent);
            } catch (err) {
              console.error('Error calling auth sync listener:', err);
            }
          }
        } catch (err) {
          console.error('Error processing storage sync event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }

  /**
   * Broadcast auth event to other tabs
   */
  broadcast(event: Omit<AuthSyncEvent, 'tabId' | 'timestamp'>): void {
    try {
      const syncEvent: AuthSyncEvent = {
        ...event,
        tabId: this.tabId,
        timestamp: Date.now(),
      };

      localStorage.setItem(SYNC_EVENT_KEY, JSON.stringify(syncEvent));
    } catch (err) {
      console.error('Error broadcasting sync event:', err);
    }
  }
}

/**
 * BroadcastChannelSyncManager - Uses BroadcastChannel API
 */
class BroadcastChannelSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: AuthSyncListener[] = [];
  private tabId: string;

  constructor() {
    this.tabId = getTabId();
    this.initChannel();
  }

  private initChannel(): void {
    try {
      this.channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        try {
          const syncEvent = event.data as AuthSyncEvent;
          // Validate syncEvent structure
          if (!syncEvent || typeof syncEvent !== 'object' || !syncEvent.type) {
            return;
          }
          // Only process events from other tabs
          if (syncEvent.tabId !== this.tabId) {
            this.listeners.forEach((listener) => {
              try {
                listener(syncEvent);
              } catch (err) {
                console.error('Error calling auth sync listener:', err);
              }
            });
          }
        } catch (err) {
          console.error('Error processing BroadcastChannel message:', err);
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel not available, using storage events:', err);
      // Fall back to storage events
    }
  }

  /**
   * Subscribe to auth sync events
   */
  subscribe(listener: AuthSyncListener): () => void {
    this.listeners.push(listener);

    // Also listen via storage events as fallback
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SYNC_EVENT_KEY && event.newValue) {
        try {
          const syncEvent: AuthSyncEvent = JSON.parse(event.newValue);
          if (syncEvent.tabId !== this.tabId) {
            try {
              listener(syncEvent);
            } catch (err) {
              console.error('Error calling auth sync listener:', err);
            }
          }
        } catch (err) {
          console.error('Error processing storage sync event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }

  /**
   * Broadcast auth event to other tabs
   */
  broadcast(event: Omit<AuthSyncEvent, 'tabId' | 'timestamp'>): void {
    const syncEvent: AuthSyncEvent = {
      ...event,
      tabId: this.tabId,
      timestamp: Date.now(),
    };

    // Send via BroadcastChannel if available
    if (this.channel) {
      try {
        this.channel.postMessage(syncEvent);
      } catch (err) {
        console.error('Error broadcasting via BroadcastChannel:', err);
      }
    }

    // Also broadcast via localStorage (fallback)
    try {
      localStorage.setItem(SYNC_EVENT_KEY, JSON.stringify(syncEvent));
    } catch (err) {
      console.error('Error broadcasting via localStorage:', err);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close();
    }
  }
}

/**
 * Select the best available sync manager
 */
function createSyncManager(): BroadcastChannelSyncManager | StorageSyncManager {
  // Try to use BroadcastChannel, fall back to storage events
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      return new BroadcastChannelSyncManager();
    }
  } catch {
    // BroadcastChannel not available
  }

  return new StorageSyncManager();
}

/**
 * Global sync manager instance
 */
let syncManager: BroadcastChannelSyncManager | StorageSyncManager | null = null;

/**
 * Get or create global sync manager
 */
function getSyncManager(): BroadcastChannelSyncManager | StorageSyncManager {
  if (!syncManager) {
    syncManager = createSyncManager();
  }
  return syncManager;
}

/**
 * Public API for auth sync
 */
export const authSync = {
  /**
   * Subscribe to auth changes from other tabs
   */
  subscribe(listener: AuthSyncListener): () => void {
    const manager = getSyncManager();
    return manager.subscribe(listener);
  },

  /**
   * Broadcast sign-in event
   */
  broadcastSignIn(userId: string): void {
    getSyncManager().broadcast({
      type: 'AUTH_SIGN_IN',
      userId,
    });
  },

  /**
   * Broadcast sign-out event
   */
  broadcastSignOut(): void {
    getSyncManager().broadcast({
      type: 'AUTH_SIGN_OUT',
    });
  },

  /**
   * Broadcast general auth state change
   */
  broadcastStateChange(userId?: string): void {
    getSyncManager().broadcast({
      type: 'AUTH_STATE_CHANGE',
      userId,
    });
  },

  /**
   * Request current auth state from other tabs
   */
  requestState(): void {
    getSyncManager().broadcast({
      type: 'REQUEST_STATE',
    });
  },

  /**
   * Get current tab ID
   */
  getTabId(): string {
    return getTabId();
  },
};

/**
 * Export manager for testing/debugging
 */
export function _getSyncManager() {
  return getSyncManager();
}

/**
 * Destroy sync manager (for cleanup)
 */
export function _destroySyncManager() {
  if (syncManager) {
    if ('destroy' in syncManager) {
      syncManager.destroy();
    }
    syncManager = null;
  }
}
