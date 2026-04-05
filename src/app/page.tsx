
'use client';

import * as React from 'react';
import { Header } from '@/components/swap-norge/Header';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import type { SwapItem, ItemCategory } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function Home() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();

  const publicItemsRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'items'), where('isPublic', '==', true), limit(20)) : null),
    [firestore]
  );
  const { data: items, isLoading } = useCollection<SwapItem>(publicItemsRef);

  const categories: ItemCategory[] = ['Klær', 'Elektronikk', 'Hjem', 'Bøker', 'Sport', 'Annet'];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-20">
        <div className="container mx-auto max-w-2xl py-4">
          
          {/* Categories Horizontal Scroll */}
          <div className="mb-6 px-4">
            <h2 className="mb-3 text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {t.home.categories}
            </h2>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-2 pb-2">
                {categories.map((cat) => (
                  <Badge 
                    key={cat} 
                    variant="secondary" 
                    className="cursor-pointer bg-white px-4 py-2 text-sm hover:bg-primary"
                  >
                    {t.categories[cat]}
                  </Badge>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Featured Grid */}
          <div className="px-4">
            <h2 className="mb-4 text-xl font-bold">{t.home.title}</h2>
            
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
                ))}
              </div>
            ) : items && items.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ItemCard item={item} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex h-60 items-center justify-center rounded-2xl border-2 border-dashed bg-white">
                <p className="text-center text-muted-foreground">{t.home.noItems}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
