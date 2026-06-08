'use client';

import React from 'react';
import { useSupabaseAuth } from '@/supabase/hooks';
import { AuthContext, type AuthContextType } from './AuthContext';
import { authSync, type AuthSyncEvent } from '@/lib/storage-sync';
import { sessionCache, userCache } from '@/lib/cache-manager';

/**
 * 🔧 Phase 4: Enhanced Auth State Synchronizer with Cross-Tab Support
 * 
 * This component initializes the global auth context with:
 * - Real Supabase state
 * - Cross-tab synchronization (BroadcastChannel + Storage events)
 * - localStorage caching for offline support
 * - Automatic sync when auth changes in other tabs
 * 
 * Should wrap the app in layout.tsx
 */

interface AuthContextProviderProps {
  children: React.ReactNode;
}

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const supabaseAuth = useSupabaseAuth();
  const [authState, setAuthState] = React.useState<AuthContextType>({
    user: supabaseAuth.user,
    session: supabaseAuth.session,
    isLoading: supabaseAuth.isLoading,
    error: supabaseAuth.error,
    isAuthReady: !supabaseAuth.isLoading, // Ready when loading completes
  });

  // Sync Supabase auth state to global context
  React.useEffect(() => {
    setAuthState({
      user: supabaseAuth.user,
      session: supabaseAuth.session,
      isLoading: supabaseAuth.isLoading,
      error: supabaseAuth.error,
      isAuthReady: !supabaseAuth.isLoading,
    });

    // 🔧 Phase 4: Always update cache when auth state changes (including logout)
    // Must always call set() to handle logout (null values will clear cache)
    sessionCache.set(supabaseAuth.session);
    userCache.set(supabaseAuth.user);

    // Broadcast auth changes to other tabs
    if (supabaseAuth.user) {
      authSync.broadcastStateChange(supabaseAuth.user.id);
    }
  }, [supabaseAuth.user, supabaseAuth.session, supabaseAuth.isLoading, supabaseAuth.error]);

  // 🔧 Phase 4: Listen for auth sync events from other tabs
  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    try {
      unsubscribe = authSync.subscribe((syncEvent: AuthSyncEvent) => {
        try {
          console.log('Auth sync event received:', syncEvent.type, {
            tabId: authSync.getTabId(),
            eventTabId: syncEvent.tabId,
          });

          if (syncEvent.type === 'AUTH_SIGN_OUT') {
            // Another tab signed out, clear our state
            setAuthState({
              user: null,
              session: null,
              isLoading: false,
              error: null,
              isAuthReady: true,
            });
            sessionCache.clear();
            userCache.clear();
          } else if (syncEvent.type === 'AUTH_SIGN_IN' && syncEvent.userId) {
            // Another tab signed in, reload our state
            console.log('Another tab signed in with user:', syncEvent.userId);
            // The useSupabaseAuth hook will handle the actual state update
            // through the Supabase auth listener
          } else if (syncEvent.type === 'AUTH_STATE_CHANGE') {
            // General state change, the auth listener will handle it
            console.log('Auth state changed in another tab');
          }
        } catch (err) {
          console.error('Error handling auth sync event:', err);
        }
      });
    } catch (err) {
      console.error('Error subscribing to auth sync:', err);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing from auth sync:', err);
        }
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
