'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Suspense, useEffect, useState } from 'react';
import { FooterNav } from '@/components/swap-norge/FooterNav';
import { Header } from '@/components/swap-norge/Header';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Gift } from 'lucide-react';

function AuthInitializer() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [nickname, setNickname] = useState('');

  // 当用户主动登录（如点击“开始体验”）后，在 Firestore 中同步创建一个真实的个人档案
  useEffect(() => {
    async function initUser() {
      if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // 仅在用户档案不存在时（即第一次访问并登录时）执行初始化
          await setDoc(userRef, {
            uid: user.uid,
            displayName: lang === 'no' ? 'Nabolagsvenn' : 'Neighbor',
            photoURL: '',
            stats: {
              points: 100, // 初始奖励积分
              reputation: 5.0,
              completedSwaps: 0,
              memberSince: new Date().toISOString()
            }
          });

          // 如果是第一次成功登录，展示欢迎弹窗引导设置昵称
          const isOnboarded = localStorage.getItem(`sn_onboarded_${user.uid}`);
          if (!isOnboarded) {
            setShowOnboarding(true);
          }
        }
      }
    }
    initUser();
  }, [user, firestore, lang]);

  const handleCompleteOnboarding = async () => {
    if (!user || !firestore || !nickname) return;
    try {
      await updateProfile(user, { displayName: nickname });
      await updateDoc(doc(firestore, 'users', user.uid), { displayName: nickname });
      localStorage.setItem(`sn_onboarded_${user.uid}`, 'true');
      setShowOnboarding(false);
    } catch (e) {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="no">
      <body className="font-body bg-background text-foreground antialiased overflow-x-hidden" suppressHydrationWarning>
        <FirebaseClientProvider>
          <Suspense fallback={null}>
            <AuthInitializer />
            <Header />
            <FooterNav />
          </Suspense>
          <div className="relative flex min-h-screen w-full flex-col">
            <AnimatePresence mode="wait">
              <motion.main 
                key={pathname}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1" 
              >
                <Suspense fallback={
                  <div className="flex h-[80vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                }>
                  {children}
                </Suspense>
              </motion.main>
            </AnimatePresence>
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
