'use client';

import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from './types';

/**
 * 🔧 Phase 4: Cache Manager
 * 
 * Manages caching of auth state and user data for:
 * - Offline support
 * - Faster page loads
 * - Cross-tab synchronization
 */

const CACHE_KEYS = {
  SESSION: 'auth_session_cache',
  USER: 'auth_user_cache',
  PROFILE: 'user_profile_cache',
  PROFILE_EXPIRY: 'user_profile_cache_expiry',
  CACHE_TIMESTAMP: 'cache_timestamp',
  NETWORK_STATUS: 'network_status',
} as const;

const CACHE_DURATION = {
  SESSION: 24 * 60 * 60 * 1000, // 24 hours
  PROFILE: 60 * 60 * 1000, // 1 hour
} as const;

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Check if cache entry is still valid
 */
export function isCacheValid(expiresAt: number): boolean {
  return Date.now() < expiresAt;
}

/**
 * Cache management for auth session
 */
export const sessionCache = {
  get(): Session | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.SESSION);
      if (!cached) return null;

      const entry: CacheEntry<Session> = JSON.parse(cached);
      if (!isCacheValid(entry.expiresAt)) {
        sessionCache.clear();
        return null;
      }

      return entry.data;
    } catch (err) {
      console.error('Error reading session cache:', err);
      return null;
    }
  },

  set(session: Session | null): void {
    try {
      if (!session) {
        sessionCache.clear();
        return;
      }

      const entry: CacheEntry<Session> = {
        data: session,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION.SESSION,
      };

      localStorage.setItem(CACHE_KEYS.SESSION, JSON.stringify(entry));
    } catch (err) {
      console.error('Error writing session cache:', err);
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.SESSION);
    } catch (err) {
      console.error('Error clearing session cache:', err);
    }
  },
};

/**
 * Cache management for user data
 */
export const userCache = {
  get(): User | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.USER);
      if (!cached) return null;

      const entry: CacheEntry<User> = JSON.parse(cached);
      if (!isCacheValid(entry.expiresAt)) {
        userCache.clear();
        return null;
      }

      return entry.data;
    } catch (err) {
      console.error('Error reading user cache:', err);
      return null;
    }
  },

  set(user: User | null): void {
    try {
      if (!user) {
        userCache.clear();
        return;
      }

      const entry: CacheEntry<User> = {
        data: user,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION.SESSION,
      };

      localStorage.setItem(CACHE_KEYS.USER, JSON.stringify(entry));
    } catch (err) {
      console.error('Error writing user cache:', err);
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.USER);
    } catch (err) {
      console.error('Error clearing user cache:', err);
    }
  },
};

/**
 * Cache management for user profiles
 */
export const profileCache = {
  get(userId: string): UserProfile | null {
    try {
      const cached = localStorage.getItem(`${CACHE_KEYS.PROFILE}_${userId}`);
      if (!cached) return null;

      const entry: CacheEntry<UserProfile> = JSON.parse(cached);
      if (!isCacheValid(entry.expiresAt)) {
        profileCache.clear(userId);
        return null;
      }

      return entry.data;
    } catch (err) {
      console.error('Error reading profile cache:', err);
      return null;
    }
  },

  set(userId: string, profile: UserProfile | null): void {
    try {
      if (!profile) {
        profileCache.clear(userId);
        return;
      }

      const entry: CacheEntry<UserProfile> = {
        data: profile,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION.PROFILE,
      };

      localStorage.setItem(`${CACHE_KEYS.PROFILE}_${userId}`, JSON.stringify(entry));
    } catch (err) {
      console.error('Error writing profile cache:', err);
    }
  },

  clear(userId?: string): void {
    try {
      if (userId) {
        localStorage.removeItem(`${CACHE_KEYS.PROFILE}_${userId}`);
      } else {
        // Clear all profile caches
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(CACHE_KEYS.PROFILE)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (err) {
      console.error('Error clearing profile cache:', err);
    }
  },
};

/**
 * Clear all caches (useful on logout)
 */
export function clearAllCaches(): void {
  sessionCache.clear();
  userCache.clear();
  profileCache.clear();
}

/**
 * Get cache info for debugging
 */
export function getCacheInfo() {
  return {
    session: {
      exists: !!localStorage.getItem(CACHE_KEYS.SESSION),
      key: CACHE_KEYS.SESSION,
      duration: CACHE_DURATION.SESSION,
    },
    user: {
      exists: !!localStorage.getItem(CACHE_KEYS.USER),
      key: CACHE_KEYS.USER,
      duration: CACHE_DURATION.SESSION,
    },
    profile: {
      count: Object.keys(localStorage).filter((k) => k.startsWith(CACHE_KEYS.PROFILE))
        .length,
      duration: CACHE_DURATION.PROFILE,
    },
  };
}
