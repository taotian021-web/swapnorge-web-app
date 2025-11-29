import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Suspense } from 'react';
import { FooterNav } from '@/components/neighbor-buy/FooterNav';

export const metadata: Metadata = {
  title: 'NeighborBuy',
  description: 'Your community marketplace for local deals and group buys.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-muted/30 antialiased" suppressHydrationWarning>
        <Suspense fallback={<div>Loading...</div>}>
          <FirebaseClientProvider>
            <div className="relative flex min-h-screen w-full flex-col">
              <div className="flex-1 pb-20">{children}</div>
              <FooterNav />
            </div>
            <Toaster />
          </FirebaseClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
