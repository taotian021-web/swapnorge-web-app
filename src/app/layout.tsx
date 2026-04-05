
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Suspense } from 'react';
import { FooterNav } from '@/components/swap-norge/FooterNav';

export const metadata: Metadata = {
  title: 'SwapNorge - Bytt det du ikke bruker',
  description: 'Norges nye plattform for gratis bytte av gjenstander. Bruk poeng, ikke penger.',
};

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
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Laster SwapNorge...</div>}>
          <FirebaseClientProvider>
            <div className="relative flex min-h-screen w-full flex-col">
              <div className="flex-1">{children}</div>
              <FooterNav />
            </div>
            <Toaster />
          </FirebaseClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
