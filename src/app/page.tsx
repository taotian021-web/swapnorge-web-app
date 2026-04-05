
'use client';

import * as React from 'react';
import { Header } from '@/components/swap-norge/Header';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import type { SwapItem } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Skeleton } from '@/components/ui/skeleton';
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

  // Gift Pool items
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
      
      <main className="flex-1 pb-44 pt-2">
        <div className="container mx-auto max-w-2xl">
          
          {/* Competitive Banner */}
          <div className="px-4 mt-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-[2.5rem] bg-foreground p-7 text-white shadow-2xl"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                    <Sparkles className="h-3.5 w-3.5 text-primary fill-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Swap Tips</span>
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter leading-none mb-3">
                  {t.home.vsFinn.title}
                </h3>
                <p className="text-xs font-medium text-white/60 leading-relaxed max-w-[85%] mb-5">
                  {t.home.vsFinn.desc}
                </p>
                <Button 
                  variant="outline" 
                  className="rounded-full border-primary/30 bg-primary/10 px-6 py-5 text-primary hover:bg-primary hover:text-foreground font-black text-xs transition-all"
                >
                  {t.home.vsFinn.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
                 <Gift className="h-32 w-32 rotate-12" />
              </div>
            </motion.div>
          </div>

          {/* Gift Pool Section */}
          {giftPoolItems.length > 0 && (
            <section className="mt-10 px-4">
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
                  <Gift className="h-5 w-5 text-primary" />
                  {t.home.giftPool}
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                  {t.home.giftPoolDesc}
                </p>
              </div>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4 touch-pan-x">
                {giftPoolItems.map((item) => (
                  <div key={item.id} className="w-48 shrink-0">
                    <ItemCard item={item} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Local Deals Section */}
          {localDeals.length > 0 && (
            <section className="mt-10 px-4">
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
                  <Ticket className="h-5 w-5 text-primary" />
                  {t.home.localDeals}
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                  {t.home.localDealsDesc}
                </p>
              </div>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4 touch-pan-x">
                {localDeals.map((deal) => (
                  <div key={deal.id} className="w-48 shrink-0">
                    <ItemCard item={deal} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Categories Horizontal Scroll - Optimized for sliding */}
          <div className="sticky top-[144px] z-40 bg-background/95 py-3 backdrop-blur-md">
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 touch-pan-x">
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "whitespace-nowrap px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shrink-0 ring-1",
                    activeCategory === cat 
                      ? "bg-primary text-foreground ring-primary shadow-lg shadow-primary/20" 
                      : "bg-white text-muted-foreground ring-black/[0.05] hover:ring-black/10 shadow-sm"
                  )}
                >
                  {cat === 'Alle' ? (lang === 'no' ? 'Alle' : 'All') : (t.categories as any)[cat] || cat}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Items Container */}
          <div className="px-4 mt-4">
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
