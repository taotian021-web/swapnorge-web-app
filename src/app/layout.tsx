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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!isSupabaseConfigured) {
    return (
      <html lang="no">
        <body className="font-body bg-background text-foreground antialiased overflow-x-hidden" suppressHydrationWarning>
          <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-center">
            <div className="max-w-2xl rounded-[2rem] border border-black/[0.04] bg-white/90 p-10 shadow-[0_25px_75px_-35px_rgba(0,0,0,0.25)] backdrop-blur-xl">
              <h1 className="mb-4 text-3xl font-bold">Supabase 环境变量未配置</h1>
              <p className="mb-6 text-base leading-7 text-muted-foreground">
                当前部署缺少 <code>NEXT_PUBLIC_SUPABASE_URL</code> 或 <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>。
                请在 Vercel 仪表盘的项目环境变量中添加这两个值，然后重新部署。
              </p>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                打开 Vercel 仪表盘
              </a>
            </div>
          </div>
        </body>
      </html>
    );
  }

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
