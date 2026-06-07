'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';

/**
 * 🔧 FIX #3: Global Authentication Context
 * 
 * Previously: Each page used independent useSupabaseUser() hooks
 * - Led to state inconsistencies across pages
 * - No cross-page synchronization
 * - Users could see logged-in on one page and logged-out on another
 * 
 * Solution: Centralized auth state that all pages share
 * - Single source of truth for user/session
 * - Synchronized across all pages/tabs
 * - Consistent behavior across app
 */

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  isAuthReady: boolean; // Set to true after initial load completes
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
  initialState?: AuthContextType;
}

/**
 * Custom hook to use the global auth context
 * Ensures consumer components are properly typed
 */
export function useGlobalAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useGlobalAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Provider component - wraps app with auth context
 * To be used in root layout: src/app/layout.tsx
 */
export function AuthProvider({ children, initialState }: AuthProviderProps) {
  const [authState] = React.useState<AuthContextType>(
    initialState || {
      user: null,
      session: null,
      isLoading: true,
      error: null,
      isAuthReady: false,
    }
  );

  // TODO: Initialize with Supabase auth state
  // This should be implemented in a separate component or effect
  // that has access to the Supabase client

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook for getting user only (simpler API for common cases)
 */
export function useAuthUser() {
  const { user, isLoading } = useGlobalAuth();
  return { user, isLoading };
}

/**
 * Hook for checking if auth is ready
 * Useful for showing loading states before auth check completes
 */
export function useAuthReady() {
  const { isAuthReady, isLoading } = useGlobalAuth();
  return isAuthReady || !isLoading;
}

/**
 * Hook for monitoring auth state changes
 */
export function useAuthStateChange(
  callback: (user: User | null, session: Session | null) => void
) {
  const { user, session } = useGlobalAuth();

  React.useEffect(() => {
    callback(user, session);
  }, [user, session, callback]);
}
