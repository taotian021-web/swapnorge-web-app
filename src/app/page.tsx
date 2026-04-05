
'use client';

import * as React from 'react';
import { Header } from '@/components/swap-norge/Header';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import type { SwapItem, ItemCategory } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowRight, Gift, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();
  const [activeCategory, setActiveCategory] = React.useState<string>('Alle');

  // Public items
  const publicItemsRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'items'), where('isPublic', '==', true), limit(20)) : null),
    [firestore]
  );
  const { data: items, isLoading } = useCollection<SwapItem>(publicItemsRef);

  // Gift Pool items (Special filter or query)
  const giftPoolItems = React.useMemo(() => {
    return items?.filter(item => item.category === 'Gave' || item.sellerName === 'SwapNorge Official').slice(0, 5) || [];
  }, [items]);

  // Local Deals items
  const localDeals = React.useMemo(() => {
    return items?.filter(item => item.category === 'Kupong').slice(0, 5) || [];
  }, [items]);

  const categories: string[] = ['Alle', 'Klær', 'Elektronikk', 'Hjem', 'Bøker', 'Sport', 'Gave', 'Kupong', 'Annet'];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-32">
        <div className="container mx-auto max-w-2xl">
          
          {/* Competitive Banner */}
          <div className="px-4 mt-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[2.5rem] bg-foreground p-6 text-white shadow-2xl"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Dagens tips</span>
                </div>
                <h3 className="text-xl font-black italic tracking-tighter leading-tight">
                  {t.home.vsFinn.title}
                </h3>
                <p className="mt-2 text-xs font-medium text-white/70 leading-relaxed max-w-[80%]">
                  {t.home.vsFinn.desc}
                </p>
                <Button variant="link" className="mt-4 p-0 h-auto text-primary font-black text-xs group">
                  {t.home.vsFinn.cta}
                  <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            </motion.div>
          </div>

          {/* Gift Pool Section (Horizontal) */}
          {giftPoolItems.length > 0 && (
            <section className="mt-8 px-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
                    <Gift className="h-5 w-5 text-primary" />
                    {t.home.giftPool}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.home.giftPoolDesc}</p>
                </div>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-4 pb-4">
                  {giftPoolItems.map((item) => (
                    <div key={item.id} className="w-48 shrink-0">
                      <ItemCard item={item} />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
              </ScrollArea>
            </section>
          )}

          {/* Local Deals Section (Horizontal) */}
          {localDeals.length > 0 && (
            <section className="mt-8 px-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
                    <Ticket className="h-5 w-5 text-primary" />
                    {t.home.localDeals}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.home.localDealsDesc}</p>
                </div>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-4 pb-4">
                  {localDeals.map((deal) => (
                    <div key={deal.id} className="w-48 shrink-0">
                      <ItemCard item={deal} />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
              </ScrollArea>
            </section>
          )}

          {/* Categories Horizontal Scroll */}
          <div className="sticky top-[148px] z-40 bg-background/80 py-4 backdrop-blur-md">
            <ScrollArea className="w-full whitespace-nowrap px-4">
              <div className="flex space-x-3 pb-2">
                {categories.map((cat) => (
                  <motion.button
                    key={cat}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm",
                      activeCategory === cat 
                        ? "bg-primary text-foreground shadow-primary/20 scale-105" 
                        : "bg-white text-muted-foreground hover:bg-white/80"
                    )}
                  >
                    {cat === 'Alle' ? (lang === 'no' ? 'Alle' : 'All') : (t.categories as any)[cat]}
                  </motion.button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          </div>

          {/* Items Container */}
          <div className="px-4 mt-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black tracking-tight">{t.home.title}</h2>
              <div className="h-1 w-12 bg-primary rounded-full" />
            </div>
            
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div key="loading" className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="aspect-[1/1.1] w-full rounded-[2.5rem]" />
                  ))}
                </div>
              ) : items && items.length > 0 ? (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 gap-4 md:gap-6"
                >
                  {items
                    .filter(item => activeCategory === 'Alle' || item.category === activeCategory)
                    .map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-80 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-muted bg-white/50 px-8 text-center"
                >
                  <div className="mb-4 text-4xl">🔎</div>
                  <p className="text-sm font-bold text-muted-foreground">{t.home.noItems}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
