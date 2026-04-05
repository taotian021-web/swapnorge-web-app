
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Suspense, useEffect } from 'react';
import { FooterNav } from '@/components/swap-norge/FooterNav';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    async function initUser() {
      if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Initialize new user with 100 welcome points
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
          console.log("New user initialized with 100 points!");
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
  return (
    <html lang="no" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-background text-foreground antialiased" suppressHydrationWarning>
        <Suspense fallback={<div className="flex h-screen items-center justify-center font-black italic">SwapNorge...</div>}>
          <FirebaseClientProvider>
            <AuthInitializer>
              <div className="relative flex min-h-screen w-full flex-col">
                <div className="flex-1">{children}</div>
                <FooterNav />
              </div>
              <Toaster />
            </AuthInitializer>
          </FirebaseClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
