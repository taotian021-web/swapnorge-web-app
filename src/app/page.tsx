
'use client';

import * as React from 'react';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import type { SwapItem, GeoLocation } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight, Package, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Home() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();
  const [activeCategory, setActiveCategory] = React.useState<string>('Alle');
  const [userLocation, setUserLocation] = React.useState<GeoLocation | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = React.useState(false);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            city: 'Din posisjon'
          });
        },
        () => console.log('Location access denied')
      );
    }
  }, []);

  const publicItemsRef = useMemoFirebase(
    () => (firestore ? query(
      collection(firestore, 'items'), 
      where('isPublic', '==', true),
      where('status', '==', 'available'),
      limit(24)
    ) : null),
    [firestore]
  );
  const { data: rawItems, isLoading } = useCollection<SwapItem>(publicItemsRef);

  const items = React.useMemo(() => {
    if (!rawItems) return [];
    let processed = [...rawItems];
    if (activeCategory !== 'Alle') processed = processed.filter(item => item.category === activeCategory);
    return processed;
  }, [rawItems, activeCategory]);

  const categories: string[] = ['Alle', 'Klær', 'Elektronikk', 'Hjem', 'Bøker', 'Sport', 'Annet'];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 pb-44 pt-4">
        <div className="container mx-auto max-w-2xl px-6">
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-foreground p-8 text-white shadow-2xl"
          >
            <div className="relative z-10">
              <h3 className="text-3xl font-black italic tracking-tighter leading-none mb-4">
                {t.home.vsFinn.title}
              </h3>
              <p className="text-sm font-medium text-white/60 leading-relaxed mb-8">
                {t.home.vsFinn.desc}
              </p>
              <Button onClick={() => setIsHowItWorksOpen(true)} className="rounded-2xl bg-primary px-8 py-6 text-foreground font-black text-sm active-scale shadow-xl">
                {t.home.vsFinn.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* 优化后的物理滑动分类栏 */}
          <div className="sticky top-[70px] z-40 -mx-6 bg-background/95 py-6 backdrop-blur-2xl px-6 border-b border-black/[0.02]">
            <div className="no-scrollbar flex gap-3 overflow-x-auto touch-pan-x snap-x-mandatory py-1 flex-nowrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "whitespace-nowrap px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ring-1 active-scale shrink-0 snap-center",
                    activeCategory === cat 
                      ? "bg-primary text-foreground ring-primary shadow-xl scale-105" 
                      : "bg-white text-muted-foreground/60 ring-black/[0.03] shadow-sm"
                  )}
                >
                  {cat === 'Alle' ? (lang === 'no' ? 'Alle' : 'All') : (t.categories as any)[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-black tracking-tighter mb-8 text-foreground/90">{t.home.title}</h2>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div key="loading" className="grid grid-cols-2 gap-5">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-[1/1.2] w-full rounded-[3rem]" />)}
                </div>
              ) : items && items.length > 0 ? (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-5">
                  {items.map((item) => <ItemCard key={item.id} item={item} userLocation={userLocation} />)}
                </motion.div>
              ) : (
                <div className="flex h-80 flex-col items-center justify-center rounded-[3.5rem] bg-white/30 border-2 border-dashed border-muted text-center p-12">
                  <p className="text-sm font-bold text-muted-foreground">{t.home.noItems}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Dialog open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen}>
        <DialogContent className="rounded-[3.5rem] border-none bg-white p-12">
          <DialogHeader><DialogTitle className="text-3xl font-black text-center">{t.home.howItWorks.title}</DialogTitle></DialogHeader>
          <div className="mt-10 space-y-10">
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Package className="h-7 w-7" /></div>
              <div><h4 className="font-black text-base">{t.home.howItWorks.step1Title}</h4><p className="text-sm font-medium text-muted-foreground">{t.home.howItWorks.step1Desc}</p></div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600"><Zap className="h-7 w-7 fill-current" /></div>
              <div><h4 className="font-black text-base">{t.home.howItWorks.step2Title}</h4><p className="text-sm font-medium text-muted-foreground">{t.home.howItWorks.step2Desc}</p></div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-primary"><CheckCircle2 className="h-7 w-7" /></div>
              <div><h4 className="font-black text-base">{t.home.howItWorks.step3Title}</h4><p className="text-sm font-medium text-muted-foreground">{t.home.howItWorks.step3Desc}</p></div>
            </div>
          </div>
          <Button onClick={() => setIsHowItWorksOpen(false)} className="mt-12 h-16 w-full rounded-2xl bg-primary font-black text-lg">Skjønner!</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
