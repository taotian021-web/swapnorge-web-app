'use client';

import * as React from 'react';
import { Header } from '@/components/neighbor-buy/Header';
import { OfferCard } from '@/components/neighbor-buy/OfferCard';
import type { Product } from '@/lib/types';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const publicProductsRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'products'), where('isPublic', '==', true), orderBy('postedDate', 'desc')) : null),
    [firestore]
  );
  const { data: publicProducts, isLoading: isLoadingProducts } = useCollection<Product>(publicProductsRef);

  React.useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-6 md:px-8">
          <div className="space-y-4">
            <h1 className="font-headline mb-4 text-xl font-bold md:text-2xl">
              {t.home.feedTitle}
            </h1>

            {isLoadingProducts ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : publicProducts && publicProducts.length > 0 ? (
              <div className="space-y-4">
                {publicProducts.map((product) => (
                  <OfferCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                <p className="text-center text-muted-foreground">{t.home.noItems}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}
