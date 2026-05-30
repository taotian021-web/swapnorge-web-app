'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from './provider';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';

export interface SupabaseAuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export interface SupabaseUserState {
  user: User | null;
  session: Session | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface SupabaseProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
}

export function useSupabaseAuth(): SupabaseAuthState {
  const supabase = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err);
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return { session, user, isLoading, error };
}

export function useSupabaseUser(): SupabaseUserState {
  const { user, session, isLoading, error } = useSupabaseAuth();
  return {
    user,
    session,
    isUserLoading: isLoading,
    userError: error,
  };
}

export function useSupabaseProfile(userId: string | null | undefined): SupabaseProfileState {
  const supabase = useSupabase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            `id, uid, display_name, photo_url, stats, created_at, updated_at`
          )
          .eq('id', userId)
          .single();

        if (!mounted) return;

        if (error && error.code === 'PGRST116') {
          // Profile不存在，创建一个新的
          console.log('Creating new profile for user:', userId);
          
          try {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                uid: userId,
                display_name: `User-${userId.slice(0, 8)}`,
                stats: {
                  points: 100,
                  reputation: 5.0,
                  completedSwaps: 0,
                  memberSince: new Date().toISOString(),
                },
              });

            if (!mounted) return;

            if (insertError) {
              if (insertError.code !== '23505') {
                // 忽略唯一性约束错误
                setError(insertError);
                setProfile(null);
                setIsLoading(false);
                return;
              }
            }

            // 创建成功或profile已存在，重新加载
            const { data: newData, error: reloadError } = await supabase
              .from('profiles')
              .select(`id, uid, display_name, photo_url, stats, created_at, updated_at`)
              .eq('id', userId)
              .single();

            if (!mounted) return;

            if (reloadError) {
              setError(reloadError);
              setProfile(null);
            } else if (newData) {
              const nd = newData as unknown as Record<string, unknown>;
              const mapped: UserProfile = {
                id: (nd.id as string) ?? (nd.uid as string) ?? '',
                uid: (nd.uid as string) ?? (nd.id as string) ?? '',
                display_name: (nd.display_name as string) ?? (nd.displayName as string) ?? '',
                displayName: (nd.display_name as string) ?? (nd.displayName as string) ?? '',
                photo_url: (nd.photo_url as string) ?? (nd.photoURL as string) ?? '',
                photoURL: (nd.photo_url as string) ?? (nd.photoURL as string) ?? '',
                stats: (nd.stats as unknown as UserProfile['stats']) ?? {
                  points: 0,
                  reputation: 0,
                  completedSwaps: 0,
                  memberSince: new Date().toISOString(),
                },
              };
              setProfile(mapped);
              setError(null);
            }
          } catch (err) {
            if (!mounted) return;
            setError(err instanceof Error ? err : new Error(String(err)));
            setProfile(null);
          }
        } else if (error && error.message !== 'No rows found') {
          setError(error);
          setProfile(null);
        } else if (data) {
          const d = data as unknown as Record<string, unknown>;
          const mapped: UserProfile = {
            id: (d.id as string) ?? (d.uid as string) ?? '',
            uid: (d.uid as string) ?? (d.id as string) ?? '',
            display_name: (d.display_name as string) ?? (d.displayName as string) ?? '',
            displayName: (d.display_name as string) ?? (d.displayName as string) ?? '',
            photo_url: (d.photo_url as string) ?? (d.photoURL as string) ?? '',
            photoURL: (d.photo_url as string) ?? (d.photoURL as string) ?? '',
            stats: (d.stats as unknown as UserProfile['stats']) ?? {
              points: 0,
              reputation: 0,
              completedSwaps: 0,
              memberSince: new Date().toISOString(),
            },
          };
          setProfile(mapped);
          setError(null);
        } else {
          setProfile(null);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setProfile(null);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [supabase, userId]);

  return { profile, isLoading, error };
}
