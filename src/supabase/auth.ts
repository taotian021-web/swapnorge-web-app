'use client';

import type { SupabaseClient } from './client';

const GUEST_EMAIL_KEY = 'supabase_guest_email';
const GUEST_PASSWORD_KEY = 'supabase_guest_password';
const ANONYMOUS_SESSION_KEY = 'supabase_anon_session';

function generateGuestCredentials() {
  // 使用简化的随机ID格式，符合标准邮箱格式
  const randomId = Math.random().toString(36).substring(2, 15);
  const email = `guest-${randomId}@example.com`;
  const password = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((value) => value.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 16);
  return { email, password };
}

/**
 * 使用匿名模式登录（不需要邮箱，可避免速率限制）
 */
async function signInAnonymously(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('Anonymous sign-in failed:', error.message);
      return null;
    }
    if (data.user?.id) {
      localStorage.setItem(ANONYMOUS_SESSION_KEY, data.user.id);
    }
    return data;
  } catch (err) {
    console.error('Error in anonymous sign-in:', err);
    return null;
  }
}

async function signInWithStoredGuestCredentials(supabase: SupabaseClient) {
  const email = localStorage.getItem(GUEST_EMAIL_KEY);
  const password = localStorage.getItem(GUEST_PASSWORD_KEY);

  if (!email || !password) {
    return null;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return null;
  }

  return data;
}

/**
 * 创建用户对应的profile记录
 */
async function createUserProfile(supabase: SupabaseClient, userId: string, displayName?: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        uid: userId,
        display_name: displayName || `User-${userId.slice(0, 8)}`,
      });

    if (error && error.code !== '23505') {
      // 忽略唯一性约束错误（profile已存在）
      console.warn('Failed to create profile:', error);
    }
  } catch (err) {
    console.error('Error creating profile:', err);
  }
}

async function createGuestCredentials(supabase: SupabaseClient) {
  const { email, password } = generateGuestCredentials();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        guest: true,
      },
    },
  });

  if (error) {
    // 如果遇到速率限制，返回特殊错误标记
    if (error.message.includes('rate limit')) {
      const err = new Error('RATE_LIMIT_EXCEEDED');
      ;(err as { originalError?: unknown }).originalError = error;
      throw err;
    }
    throw error;
  }

  // 自动创建用户profile
  if (data.user?.id) {
    const randomName = Math.random().toString(36).substring(2, 8).toUpperCase();
    await createUserProfile(supabase, data.user.id, `Guest-${randomName}`);
  }

  localStorage.setItem(GUEST_EMAIL_KEY, email);
  localStorage.setItem(GUEST_PASSWORD_KEY, password);
  return { email, password, data };
}

/**
 * 确保用户有对应的profile记录
 */
export async function ensureUserProfile(supabase: SupabaseClient, userId: string, displayName?: string) {
  try {
    // 检查profile是否存在
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    // 如果不存在（No rows found），创建一个新的profile
    if (error?.code === 'PGRST116' || error?.message === 'No rows found') {
      await createUserProfile(supabase, userId, displayName);
    }
  } catch (err) {
    console.error('Error ensuring user profile:', err);
  }
}

/**
 * 改进的客人会话管理：
 * 1. 首先尝试使用已存储的凭证
 * 2. 如果没有已存储凭证，尝试注册新账户
 * 3. 如果注册失败（速率限制），使用匿名登录
 */
export async function ensureGuestSession(supabase: SupabaseClient) {
  if (typeof window === 'undefined') {
    return;
  }

  // 第一步：尝试使用已存储的凭证登录
  const currentSession = await signInWithStoredGuestCredentials(supabase);
  if (currentSession) {
    // 确保已登陆用户有profile
    if (currentSession.user?.id) {
      await ensureUserProfile(supabase, currentSession.user.id);
    }
    return currentSession;
  }

  // 第二步：尝试创建新账户
  try {
    const credentials = await createGuestCredentials(supabase);
    const signInResult = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    return signInResult.data;
  } catch (err: unknown) {
    // 如果是速率限制错误，使用匿名登录
    if (err instanceof Error && err.message === 'RATE_LIMIT_EXCEEDED') {
      console.log('Email rate limit detected, using anonymous sign-in...');
      const anonSession = await signInAnonymously(supabase);
      if (anonSession?.user?.id) {
        // 创建或确保profile存在
        const randomName = Math.random().toString(36).substring(2, 8).toUpperCase();
        await createUserProfile(supabase, anonSession.user.id, `Guest-${randomName}`);
        return anonSession;
      }
    }
    // 其他错误重新抛出
    throw err;
  }
}

export const signInGuest = ensureGuestSession;

export async function linkEmailPassword(supabase: SupabaseClient, email: string, password: string) {
  const result = await supabase.auth.updateUser({ email, password });
  
  // 更新profile中的email信息
  if (result.data?.user?.id) {
    const { error } = await supabase
      .from('profiles')
      .update({ email })
      .eq('id', result.data.user.id);
    
    if (error) {
      console.warn('Failed to update profile email:', error);
    }
  }
  
  return result;
}

export async function updateUserDisplayName(supabase: SupabaseClient, displayName: string) {
  const result = await supabase.auth.updateUser({ data: { full_name: displayName } });
  
  // 同时更新profile表中的display_name
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user?.id) {
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', sessionData.session.user.id);
    
    if (error) {
      console.warn('Failed to update profile display_name:', error);
    }
  }
  
  return result;
}
