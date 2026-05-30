'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createSupabaseClient, type SupabaseClient } from './client';

interface SupabaseProviderProps {
  children: ReactNode;
}

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}

export function useSupabase(): SupabaseClient {
  const supabase = useContext(SupabaseContext);
  if (!supabase) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return supabase;
}
