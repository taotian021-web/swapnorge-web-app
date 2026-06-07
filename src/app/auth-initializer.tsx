'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSupabase } from '@/supabase';
import { useSupabaseUser, useSupabaseProfile } from '@/supabase/hooks';
import { updateUserDisplayName } from '@/supabase/auth';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Gift } from 'lucide-react';
import { FooterNav } from '@/components/swap-norge/FooterNav';
import { Header } from '@/components/swap-norge/Header';

function AuthInitializer() {
  const supabase = useSupabase();
  const { user, session } = useSupabaseUser();
  const { profile } = useSupabaseProfile(user?.id ?? null);
  const searchParams = useSearchParams();
  const lang = ((searchParams?.get('lang')) || 'no') as Language;
  const t = getTranslations(lang);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  // Check if this is a verification callback by looking for auth-related query params
  useEffect(() => {
    async function handleVerificationCallback() {
      if (typeof window === 'undefined') return;
      
      const params = new URLSearchParams(window.location.search);
      const hasAuthParams = params.has('code') || params.has('access_token') || params.has('error');
      
      // If URL has auth params, Supabase should be processing them
      if (hasAuthParams) {
        // Wait a bit for Supabase to process the callback
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setIsCheckingVerification(false);
    }

    handleVerificationCallback();
  }, []);

  useEffect(() => {
    async function initUser() {
      if (!user || !profile || typeof window === 'undefined' || isCheckingVerification) return;

      const onboardedKey = `sn_onboarded_${user.id}`;
      const isOnboarded = localStorage.getItem(onboardedKey);
      const pendingEmail = localStorage.getItem('sn_pending_verification_email');
      
      // User is logged in after verification
      const isVerificationCallback = session && !isOnboarded;
      const shouldShowOnboarding = !isOnboarded;
      const shouldShowWelcomeMessage = isVerificationCallback || !!pendingEmail;

      if (shouldShowWelcomeMessage) {
        localStorage.removeItem('sn_pending_verification_email');
      }

      if (shouldShowOnboarding && !showOnboarding) {
        setShowWelcomeAlert(shouldShowWelcomeMessage);
        setShowOnboarding(true);
      }
    }

    initUser();
  }, [user, profile, session, showOnboarding, lang, isCheckingVerification]);

  const handleCompleteOnboarding = async () => {
    if (!user || !supabase || !nickname) return;
    try {
      await updateUserDisplayName(supabase, nickname);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`sn_onboarded_${user.id}`, 'true');
      }
      setShowOnboarding(false);
    } catch {
      setShowOnboarding(false);
    }
  };

  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="rounded-[3rem] border-none bg-white p-10 z-[200]">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary shadow-2xl shadow-primary/30">
            <Gift className="h-10 w-10 text-foreground" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic tracking-tighter mb-2">{t.onboarding.title}</DialogTitle>
          </DialogHeader>
          {showWelcomeAlert ? (
            <div className="mb-4 rounded-3xl bg-emerald-50 px-5 py-4 text-emerald-900 text-sm font-semibold shadow-sm ring-1 ring-emerald-100">
              {t.profile.verifySuccess}
            </div>
          ) : null}
          <p className="mb-8 text-sm font-medium text-muted-foreground leading-relaxed px-4">
            {t.onboarding.desc}
          </p>

          <div className="w-full space-y-4">
            <div className="flex flex-col items-start gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">{t.onboarding.nicknameLabel}</span>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t.onboarding.nicknamePlaceholder}
                className="h-14 rounded-2xl border-none bg-muted px-6 font-bold"
              />
            </div>
          </div>

          <Button
            onClick={handleCompleteOnboarding}
            className="mt-10 h-16 w-full rounded-2xl bg-primary font-black text-base shadow-xl active-scale"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {t.onboarding.startButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AuthInitializerWrapper() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthInitializer />
        <Header />
        <FooterNav />
      </Suspense>
    </>
  );
}
