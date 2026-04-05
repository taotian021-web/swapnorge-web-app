
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Suspense, useEffect } from 'react';
import { FooterNav } from '@/components/swap-norge/FooterNav';
import { Header } from '@/components/swap-norge/Header';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';

function AuthInitializer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'no';

  useEffect(() => {
    async function initUser() {
      if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || (lang === 'no' ? 'Nabolagsvenn' : 'Neighborhood Friend'),
            photoURL: user.photoURL || '',
            stats: {
              points: 100,
              reputation: 5.0,
              completedSwaps: 0,
              memberSince: new Date().toISOString()
            }
          });
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
