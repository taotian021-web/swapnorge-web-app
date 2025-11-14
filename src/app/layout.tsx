import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'NeighborBuy',
  description: 'Your community marketplace for local deals and group buys.',
};

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      {children}
      <Toaster />
    </FirebaseClientProvider>
  );
}

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
      <body className="font-body bg-background antialiased" suppressHydrationWarning>
        <Suspense fallback={<div>Loading...</div>}>
          <RootLayoutContent>{children}</RootLayoutContent>
        </Suspense>
      </body>
    </html>
  );
}
