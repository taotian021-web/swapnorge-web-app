
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Suspense, useEffect } from 'react';
import { FooterNav } from '@/components/swap-norge/FooterNav';
import { Header } from '@/components/swap-norge/Header';
import { useUser, useFirestore, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';

function AuthInitializer() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'no';

  // 核心：如果没有用户且加载完毕，自动发起匿名登录
  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  useEffect(() => {
    async function initUser() {
      if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // 初始化真实用户数据
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || (lang === 'no' ? 'Nabolagsvenn' : 'Neighborhood Friend'),
            photoURL: user.photoURL || '',
            stats: {
              points: 100, // 初始欢迎积分
              reputation: 5.0,
              completedSwaps: 0,
              memberSince: new Date().toISOString()
            }
          });
        } else {
          // 同步头像
          if (user.photoURL && userSnap.data().photoURL !== user.photoURL) {
            updateDoc(userRef, { photoURL: user.photoURL });
          }
        }
      }
    }
    initUser();
  }, [user, firestore, lang]);

  return null;
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
          </Suspense>
          <div className="relative flex min-h-screen w-full flex-col">
            <Header />
            <AnimatePresence mode="wait">
              <motion.main 
                key={pathname}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1 pb-44" 
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
            <FooterNav />
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
