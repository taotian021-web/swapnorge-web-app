import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseProvider } from '@/supabase';
import React, { Suspense } from 'react';
import { type Metadata } from 'next';
import AuthInitializerWrapper from './auth-initializer';

export const metadata: Metadata = {
  title: 'SwapNorge - 邻里交换社区',
  description: '在你的社区中分享和交换物品，获得积分奖励，建立可信的邻里关系。',
  keywords: ['交换', '社区', '邻里', '二手', '物品分享', 'SwapNorge'],
  authors: [{ name: 'SwapNorge Team' }],
  creator: 'SwapNorge',
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    url: 'https://swapnorge.com',
    siteName: 'SwapNorge',
    title: 'SwapNorge - 邻里交换社区',
    description: '在你的社区中分享和交换物品，获得积分奖励，建立可信的邻里关系。',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SwapNorge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwapNorge - 邻里交换社区',
    description: '在你的社区中分享和交换物品',
    creator: '@swapnorge',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="no">
      <body className="font-body bg-background text-foreground antialiased overflow-x-hidden" suppressHydrationWarning>
        <SupabaseProvider>
          <AuthInitializerWrapper />
          <div className="relative flex min-h-screen w-full flex-col">
            <Suspense
              fallback={
                <div className="flex h-[80vh] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              }
            >
              {children}
            </Suspense>
          </div>
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
