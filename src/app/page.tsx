'use client';

import * as React from 'react';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import type { SwapItem, GeoLocation } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight, Package, Zap, CheckCircle2, RefreshCcw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSupabase } from '@/supabase';

export default function Home() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const supabase = useSupabase();
  const [activeCategory, setActiveCategory] = React.useState<string>('Alle');
  const [userLocation, setUserLocation] = React.useState<GeoLocation | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = React.useState(false);
  const [items, setItems] = React.useState<SwapItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchItems = React.useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'available')
      .limit(24);

    if (error) {
      console.error('Supabase fetch items error:', error.message);
      setItems([]);
    } else {
      setItems(data ?? []);
    }

    setIsLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            city: 'Din posisjon',
          });
        },
        () => console.log('Location access denied')
      );
    }
  }, []);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRefresh = () => {
    fetchItems();
  };

  const displayedItems = React.useMemo(() => {
    let processed = [...items];
    if (activeCategory !== 'Alle') {
      processed = processed.filter((item) => item.category === activeCategory);
    }
    return processed;
  }, [items, activeCategory]);

  const categories: string[] = ['Alle', 'Klær', 'Elektronikk', 'Hjem', 'Bøker', 'Sport', 'Annet'];
  const categoryLabels = t.categories as Record<string, string>;
  const productCount = displayedItems.length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 pb-20 pt-0">
        <div className="container mx-auto max-w-2xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-foreground p-8 text-white shadow-[0_30px_90px_-50px_rgba(0,0,0,0.35)]"
          >
            <div className="relative z-10 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70 ring-1 ring-white/15">
                <MapPin className="h-4 w-4" />
                {userLocation ? userLocation.city : 'Lokasjon ukjent'}
              </div>
              <div className="space-y-5">
                <h1 className="max-w-xl text-4xl font-black tracking-tight leading-tight sm:text-5xl">
                  {t.home.vsFinn.title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/75">
                  {t.home.vsFinn.desc}
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button onClick={() => setIsHowItWorksOpen(true)} className="rounded-2xl bg-primary px-7 py-4 text-base font-black text-foreground shadow-xl shadow-primary/25 active-scale">
                  {t.home.vsFinn.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="text-sm text-white/70">
                  {productCount > 0 ? `${productCount} ${lang === 'no' ? 'varer funnet' : 'items found'}` : (lang === 'no' ? 'Oppdager lokalsamfunnet...' : 'Discovering local goods...')}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="sticky top-[64px] z-40 -mx-6 bg-background/95 py-5 backdrop-blur-2xl px-6 border-b border-black/[0.05]">
            <div className="no-scrollbar flex gap-3 overflow-x-auto touch-pan-x snap-x-mandatory py-1 flex-nowrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={activeCategory === cat}
                  className={cn(
                    'whitespace-nowrap min-w-[100px] px-5 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.2em] transition-all ring-1 active-scale shrink-0 snap-center',
                    activeCategory === cat
                      ? 'bg-primary text-foreground ring-primary shadow-[0_14px_40px_-28px_rgba(255,215,0,0.9)]'
                      : 'bg-white text-muted-foreground/80 ring-black/[0.06] shadow-sm hover:bg-black/5'
                  )}
                >
                  {cat === 'Alle' ? (lang === 'no' ? 'Alle' : 'All') : categoryLabels[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tighter mb-2 text-foreground/95">{t.home.title}</h2>
                <p className="text-sm text-muted-foreground/80">
                  {productCount > 0
                    ? `${productCount} ${lang === 'no' ? 'tilgjengelige varer i området' : 'available items nearby'}`
                    : t.home.noItems}
                </p>
              </div>
              {productCount > 0 ? (
                <span className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  {lang === 'no' ? 'Lokal funn' : 'Local picks'}
                </span>
              ) : null}
            </div>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div key="loading" className="grid grid-cols-2 gap-5">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="aspect-[1/1.2] w-full rounded-[3rem]" />
                  ))}
                </div>
              ) : displayedItems.length > 0 ? (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-5">
                  {displayedItems.map((item) => (
                    <ItemCard key={item.id} item={item} userLocation={userLocation} />
                  ))}
                </motion.div>
              ) : (
                <div className="flex h-80 flex-col items-center justify-center rounded-[3.5rem] bg-white/60 border border-dashed border-black/[0.08] p-12 text-center shadow-sm">
                  <p className="text-lg font-bold text-foreground mb-3">{t.home.noItems}</p>
                  <p className="max-w-md text-sm leading-6 text-muted-foreground">
                    {lang === 'no'
                      ? 'Ingen varer ble funnet for øyeblikket. Prøv å oppdatere eller legg ut noe du ønsker å bytte.'
                      : 'No items were found right now. Try refreshing or add something you want to swap.'}
                  </p>
                  <Button onClick={handleRefresh} variant="outline" className="mt-6 rounded-2xl px-6 py-3 font-black">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {lang === 'no' ? 'Oppdater varer' : 'Refresh items'}
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Dialog open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen}>
        <DialogContent className="rounded-[2.5rem] border-none bg-white p-10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic tracking-tighter">{t.home.howItWorks.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-8 space-y-8">
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                <Package className="h-7 w-7" />
              </div>
              <div>
                <h4 className="font-black text-base">{t.home.howItWorks.step1Title}</h4>
                <p className="text-sm font-medium text-muted-foreground">{t.home.howItWorks.step1Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600 shrink-0">
                <Zap className="h-7 w-7 fill-current" />
              </div>
              <div>
                <h4 className="font-black text-base">{t.home.howItWorks.step2Title}</h4>
                <p className="text-sm font-medium text-muted-foreground">{t.home.howItWorks.step2Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-primary shrink-0">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h4 className="font-black text-base">{t.home.howItWorks.step3Title}</h4>
                <p className="text-sm font-medium text-muted-foreground">{t.home.howItWorks.step3Desc}</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsHowItWorksOpen(false)} className="mt-10 h-16 w-full rounded-2xl bg-primary font-black text-base shadow-xl active-scale">
            {t.home.howItWorks.gotIt}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
