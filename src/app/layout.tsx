
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Suspense, useEffect } from 'react';
import { FooterNav } from '@/components/swap-norge/FooterNav';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    async function initUser() {
      if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || 'Nabolagsvenn',
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
  }, [user, firestore]);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="no" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-background text-foreground antialiased overflow-x-hidden" suppressHydrationWarning>
        <FirebaseClientProvider>
          <AuthInitializer>
            <div className="relative flex min-h-screen w-full flex-col">
              <AnimatePresence mode="wait">
                <motion.main 
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex-1"
                >
                  <Suspense fallback={<div className="flex h-screen items-center justify-center font-black italic text-primary animate-pulse">SwapNorge...</div>}>
                    {children}
                  </Suspense>
                </motion.main>
              </AnimatePresence>
              <FooterNav />
            </div>
            <Toaster />
          </AuthInitializer>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
