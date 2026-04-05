
'use client';

import * as React from 'react';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import type { SwapItem, GeoLocation, UserProfile } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getDistanceFromLatLonInKm } from '@/lib/utils';
import { Sparkles, ArrowRight, MapPin, CheckCircle2, Package, Zap, Leaf, TrendingUp, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from 'next/link';

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

  const heroesRef = useMemoFirebase(
    () => (firestore ? query(
      collection(firestore, 'users'),
      orderBy('stats.completedSwaps', 'desc'),
      limit(3)
    ) : null),
    [firestore]
  );
  const { data: heroes } = useCollection<UserProfile>(heroesRef);

  const items = React.useMemo(() => {
    if (!rawItems) return [];
    let processed = [...rawItems];
    if (activeCategory !== 'Alle') processed = processed.filter(item => item.category === activeCategory);
    if (userLocation) {
      processed.sort((a, b) => {
        const distA = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, a.location.latitude, a.location.longitude);
        const distB = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, b.location.latitude, b.location.longitude);
        return distA - distB;
      });
    }
    return processed;
  }, [rawItems, activeCategory, userLocation]);

  const bargains = React.useMemo(() => rawItems?.filter(item => item.points <= 50).slice(0, 8) || [], [rawItems]);
  const categories: string[] = ['Alle', 'Klær', 'Elektronikk', 'Hjem', 'Bøker', 'Sport', 'Gave', 'Kupong', 'Annet'];

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
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary fill-current" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Swap Guide</span>
              </div>
              <h3 className="text-3xl font-black italic tracking-tighter leading-none mb-4">
                {t.home.vsFinn.title}
              </h3>
              <p className="text-sm font-medium text-white/60 leading-relaxed max-w-[90%] mb-8">
                {t.home.vsFinn.desc}
              </p>
              
              <Dialog open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl bg-primary px-8 py-6 text-foreground font-black text-sm active-scale shadow-xl shadow-primary/20">
                    {t.home.vsFinn.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[3.5rem] border-none bg-white p-12">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-black italic tracking-tighter text-center">{t.home.howItWorks.title}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-10 space-y-10">
                    <div className="flex items-start gap-6">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Package className="h-7 w-7" /></div>
                      <div>
                        <h4 className="font-black text-base">{t.home.howItWorks.step1Title}</h4>
                        <p className="text-sm font-medium text-muted-foreground mt-1">{t.home.howItWorks.step1Desc}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-6">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600"><Zap className="h-7 w-7 fill-current" /></div>
                      <div>
                        <h4 className="font-black text-base">{t.home.howItWorks.step2Title}</h4>
                        <p className="text-sm font-medium text-muted-foreground mt-1">{t.home.howItWorks.step2Desc}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-6">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-foreground text-primary"><CheckCircle2 className="h-7 w-7" /></div>
                      <div>
                        <h4 className="font-black text-base">{t.home.howItWorks.step3Title}</h4>
                        <p className="text-sm font-medium text-muted-foreground mt-1">{t.home.howItWorks.step3Desc}</p>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => setIsHowItWorksOpen(false)} className="mt-12 h-16 w-full rounded-2xl bg-primary text-foreground font-black text-lg shadow-xl active-scale">{t.home.howItWorks.gotIt}</Button>
                </DialogContent>
              </Dialog>
            </div>
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />
          </motion.div>

          <section className="mt-12">
            <Card className="border-none bg-white shadow-sm rounded-[2.5rem] ring-1 ring-black/[0.02]">
              <CardContent className="p-8">
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <TrendingUp className="h-4 w-4 text-green-500" />
                       {t.home.impact.title}
                    </h2>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 font-bold rounded-lg px-2">Oslo</Badge>
                 </div>
                 <div className="grid grid-cols-3 gap-8">
                    <div className="flex flex-col">
                       <span className="text-3xl font-black italic tracking-tighter text-foreground">12</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t.home.impact.itemsSaved}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-3xl font-black italic tracking-tighter text-green-600">32.5</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t.home.impact.co2Saved}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-3xl font-black italic tracking-tighter text-primary">1.8k</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t.home.impact.communityPoints}</span>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter">
                <Medal className="h-6 w-6 text-primary" />
                {t.home.heroes.title}
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {heroes?.map((hero, idx) => (
                <Link href={`/users/${hero.uid}?lang=${lang}`} key={hero.uid}>
                  <motion.div whileTap={{ scale: 0.95 }} className="flex flex-col items-center p-4 rounded-[2rem] bg-white shadow-sm ring-1 ring-black/[0.02] border-b-4 border-transparent hover:border-primary transition-all">
                    <div className="relative mb-3">
                      <Avatar className="h-16 w-16 rounded-2xl ring-2 ring-offset-2 ring-primary/20">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${hero.uid}`} />
                        <AvatarFallback>{hero.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={cn("absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg shadow-lg text-white font-black text-[10px]", idx === 0 ? "bg-primary text-foreground" : "bg-muted text-muted-foreground")}>
                        {idx + 1}
                      </div>
                    </div>
                    <h4 className="text-[11px] font-black truncate w-full text-center">{hero.displayName}</h4>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>

          {bargains.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-black tracking-tighter text-foreground">
                <Leaf className="h-6 w-6 text-green-500" />
                {t.home.bargains}
              </h2>
              <div className="-mx-6 overflow-hidden">
                <div className="no-scrollbar flex gap-5 overflow-x-auto px-6 py-4 touch-pan-x snap-x-mandatory">
                  {bargains.map((item) => (
                    <div key={item.id} className="w-56 shrink-0 snap-center">
                      <ItemCard item={item} userLocation={userLocation} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="sticky top-[70px] z-40 -mx-6 bg-background/95 py-6 backdrop-blur-2xl px-6 border-b border-black/[0.02]">
            <div className="no-scrollbar flex gap-3 overflow-x-auto touch-pan-x snap-x-mandatory py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "whitespace-nowrap px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ring-1 active-scale shrink-0 snap-center",
                    activeCategory === cat 
                      ? "bg-primary text-foreground ring-primary shadow-xl shadow-primary/20 scale-105" 
                      : "bg-white text-muted-foreground/60 ring-black/[0.03] hover:ring-black/10 shadow-sm"
                  )}
                >
                  {cat === 'Alle' ? (lang === 'no' ? 'Alle' : 'All') : (t.categories as any)[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-black tracking-tighter mb-8 text-foreground/90">
              {userLocation ? t.home.closest : t.home.title}
            </h2>
            
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div key="loading" className="grid grid-cols-2 gap-5 md:gap-8">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-[1/1.2] w-full rounded-[3rem]" />)}
                </div>
              ) : items && items.length > 0 ? (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-5 md:gap-8">
                  {items.map((item) => <ItemCard key={item.id} item={item} userLocation={userLocation} />)}
                </motion.div>
              ) : (
                <div className="flex h-80 flex-col items-center justify-center rounded-[3.5rem] bg-white/30 border-2 border-dashed border-muted text-center p-12">
                  <span className="text-5xl mb-4">🔭</span>
                  <p className="text-sm font-bold text-muted-foreground">{t.home.noItems}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
