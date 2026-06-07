'use client';

import React from 'react';
import { useSupabaseAuth } from '@/supabase/hooks';
import { AuthContext, type AuthContextType } from './AuthContext';

/**
 * 🔧 FIX #3B: Auth State Synchronizer
 * 
 * This component initializes the global auth context with real Supabase state
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
  }, [supabaseAuth.user, supabaseAuth.session, supabaseAuth.isLoading, supabaseAuth.error]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
