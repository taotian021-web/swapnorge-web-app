import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './config';

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase environment variables are not configured: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

export function createSupabaseClient(): SupabaseClient {
  return createClient(
    supabaseUrl || 'http://localhost:54321',
    supabaseAnonKey || 'public-anon-key'
  );
}

export type { SupabaseClient };
