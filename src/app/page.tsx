'use client';

import * as React from 'react';
import { Header } from '@/components/neighbor-buy/Header';
import { FeatureShowcase } from '@/components/neighbor-buy/FeatureShowcase';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tight md:text-5xl">
              您的轻量社区团购
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              邻里互助，发现身边的好物与服务
            </p>
          </div>

          <FeatureShowcase />
        </div>
      </main>
    </div>
  );
}
