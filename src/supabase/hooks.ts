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
            `id, uid, display_name, photo_url, created_at, updated_at`
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
              .select(`id, uid, display_name, photo_url, created_at, updated_at`)
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
                display_name: (nd.display_name as string) ?? '',
                displayName: (nd.display_name as string) ?? '',
                photo_url: (nd.photo_url as string) ?? '',
                photoURL: (nd.photo_url as string) ?? '',
                stats: {
                  points: 0,
                  reputation: 5.0,
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
            display_name: (d.display_name as string) ?? '',
            displayName: (d.display_name as string) ?? '',
            photo_url: (d.photo_url as string) ?? '',
            photoURL: (d.photo_url as string) ?? '',
            stats: {
              points: 0,
              reputation: 5.0,
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

/**
 * 使用 Supabase 实时订阅来监听 profile 变更
 * 遵循正确的模式：
 * 1. 创建通道并链接所有 .on() 方法
 * 2. 最后调用 .subscribe()
 * 3. 在清理函数中调用 supabase.removeChannel()
 * 4. 管理依赖项以确保用户切换时重新订阅
 */
export function useSupabaseRealtimeProfile(
  userId: string | null | undefined
): SupabaseProfileState {
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

    // 首先加载初始数据
    const loadInitialProfile = async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select(
            `id, uid, display_name, photo_url, created_at, updated_at`
          )
          .eq('id', userId)
          .single();

        if (!mounted) return;

        if (queryError) {
          if (queryError.code === 'PGRST116') {
            // Profile 不存在，创建一个新的
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

              if (insertError && insertError.code !== '23505') {
                // 忽略唯一性约束错误
                setError(insertError);
                setProfile(null);
                setIsLoading(false);
                return;
              }

              // 重新加载创建的 profile
              const { data: newData, error: reloadError } = await supabase
                .from('profiles')
                .select(
                  `id, uid, display_name, photo_url, created_at, updated_at`
                )
                .eq('id', userId)
                .single();

              if (!mounted) return;

              if (reloadError) {
                setError(reloadError);
                setProfile(null);
              } else if (newData) {
                setProfile(mapProfileData(newData));
                setError(null);
              }
            } catch (err) {
              if (!mounted) return;
              setError(
                err instanceof Error ? err : new Error(String(err))
              );
              setProfile(null);
            }
          } else if (queryError.message !== 'No rows found') {
            setError(queryError);
            setProfile(null);
          }
        } else if (data) {
          setProfile(mapProfileData(data));
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

    loadInitialProfile();

    // ✅ 正确的实时订阅模式
    // 1. 创建通道并立即链接所有 .on() 方法
    // 2. 最后调用 .subscribe()
    const channel = supabase
      .channel(`profile:${userId}`) // 使用唯一的通道名
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (!mounted) return;
          console.log('Profile 实时更新:', payload.new);
          const newData = payload.new as unknown;
          setProfile(mapProfileData(newData));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        () => {
          if (!mounted) return;
          console.log('Profile 已删除');
          setProfile(null);
        }
      )
      .subscribe((status) => {
        if (!mounted) return;
        console.log(`通道 profile:${userId} 状态:`, status);
      });

    // ✅ 清理函数：移除通道，防止内存泄漏和重复订阅
    return () => {
      mounted = false;
      supabase
        .removeChannel(channel)
        .then(() => {
          console.log(`通道 profile:${userId} 已移除`);
        })
        .catch((err) => {
          console.error(`移除通道失败: ${err}`);
        });
    };
  }, [supabase, userId]); // 依赖 userId，当用户切换时重新订阅

  return { profile, isLoading, error };
}

/**
 * 辅助函数：映射 Supabase 返回的数据到 UserProfile 类型
 */
function mapProfileData(data: unknown): UserProfile {
  const d = data as unknown as Record<string, unknown>;
  return {
    id: (d.id as string) ?? (d.uid as string) ?? '',
    uid: (d.uid as string) ?? (d.id as string) ?? '',
    display_name: (d.display_name as string) ?? '',
    displayName: (d.display_name as string) ?? '',
    photo_url: (d.photo_url as string) ?? '',
    photoURL: (d.photo_url as string) ?? '',
    stats: {
      points: 0,
      reputation: 5.0,
      completedSwaps: 0,
      memberSince: new Date().toISOString(),
    },
  };
}
