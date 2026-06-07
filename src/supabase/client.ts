import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './config';

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase environment variables are not configured: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __supabase_client: SupabaseClient | undefined;
}

export function createSupabaseClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    if (!globalThis.__supabase_client) {
      globalThis.__supabase_client = createClient(
        supabaseUrl || 'http://localhost:54321',
        supabaseAnonKey || 'public-anon-key'
      );
    }
    return globalThis.__supabase_client;
  }

  return createClient(
    supabaseUrl || 'http://localhost:54321',
    supabaseAnonKey || 'public-anon-key'
  );
}

export type { SupabaseClient };
