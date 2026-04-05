'use client';

import * as React from 'react';
import { Header } from '@/components/swap-norge/Header';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import type { SwapItem, GeoLocation, SwapRequest } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getDistanceFromLatLonInKm } from '@/lib/utils';
import { Sparkles, ArrowRight, Gift, Ticket, MapPin, CheckCircle2, Package, Zap, Repeat, Leaf, TrendingUp } from 'lucide-react';
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
import { formatDistanceToNow } from 'date-fns';
import { nb, enUS } from 'date-fns/locale';

export default function Home() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();
  const [activeCategory, setActiveCategory] = React.useState<string>('Alle');
  const [userLocation, setUserLocation] = React.useState<GeoLocation | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = React.useState(false);

  // Get user location on mount
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

  // Public items
  const publicItemsRef = useMemoFirebase(
    () => (firestore ? query(
      collection(firestore, 'items'), 
      where('isPublic', '==', true),
      where('status', '==', 'available'),
      limit(40)
    ) : null),
    [firestore]
  );
  const { data: rawItems, isLoading } = useCollection<SwapItem>(publicItemsRef);

  // Community Pulse
  const pulseRef = useMemoFirebase(
    () => (firestore ? query(
      collection(firestore, 'swapRequests'),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(3)
    ) : null),
    [firestore]
  );
  const { data: recentSwaps } = useCollection<SwapRequest>(pulseRef);

  // Global completed count for impact
  const allCompletedRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'swapRequests'), where('status', '==', 'completed')) : null),
    [firestore]
  );
  const { data: completedStats } = useCollection(allCompletedRef);

  // Process and Sort Items
  const items = React.useMemo(() => {
    if (!rawItems) return [];
    let processed = [...rawItems];

    if (activeCategory !== 'Alle') {
      processed = processed.filter(item => item.category === activeCategory);
    }

    if (userLocation) {
      processed.sort((a, b) => {
        const distA = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, a.location.latitude, a.location.longitude);
        const distB = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, b.location.latitude, b.location.longitude);
        return distA - distB;
      });
    }

    return processed;
  }, [rawItems, activeCategory, userLocation]);

  const giftPoolItems = React.useMemo(() => {
    return rawItems?.filter(item => item.category === 'Gave' || item.sellerName === 'SwapNorge Official').slice(0, 5) || [];
  }, [rawItems]);

  const localDeals = React.useMemo(() => {
    return rawItems?.filter(item => item.category === 'Kupong').slice(0, 5) || [];
  }, [rawItems]);

  const categories: string[] = ['Alle', 'Klær', 'Elektronikk', 'Hjem', 'Bøker', 'Sport', 'Gave', 'Kupong', 'Annet'];

  const totalSwaps = completedStats?.length || 12; // Fallback for better empty visual
  const co2Saved = totalSwaps * 2.5;

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
                
                <Dialog open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="rounded-full border-primary/30 bg-primary/10 px-6 py-5 text-primary hover:bg-primary hover:text-foreground font-black text-xs transition-all"
                    >
                      {t.home.vsFinn.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[3rem] border-none bg-white p-10">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black italic tracking-tighter text-center">
                        {t.home.howItWorks.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-8 space-y-8">
                      <div className="flex items-start gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Package className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm">{t.home.howItWorks.step1Title}</h4>
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed mt-1">{t.home.howItWorks.step1Desc}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-white">
                          <Zap className="h-6 w-6 fill-current" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm">{t.home.howItWorks.step2Title}</h4>
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed mt-1">{t.home.howItWorks.step2Desc}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-primary">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm">{t.home.howItWorks.step3Title}</h4>
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed mt-1">{t.home.howItWorks.step3Desc}</p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setIsHowItWorksOpen(false)}
                      className="mt-10 h-16 w-full rounded-2xl bg-primary text-foreground font-black text-base shadow-xl"
                    >
                      {t.home.howItWorks.gotIt}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
            </motion.div>
          </div>

          {/* Neighborhood Impact Card */}
          <section className="mt-8 px-4">
            <Card className="overflow-hidden border-none bg-white shadow-sm rounded-[2.5rem] ring-1 ring-black/[0.03]">
              <CardContent className="p-6">
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <TrendingUp className="h-4 w-4 text-green-500" />
                       {t.home.impact.title}
                    </h2>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 font-bold rounded-lg px-2">
                       Oslo
                    </Badge>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col">
                       <span className="text-2xl font-black italic tracking-tighter text-foreground">{totalSwaps}</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t.home.impact.itemsSaved}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-2xl font-black italic tracking-tighter text-green-600">{co2Saved.toFixed(1)}</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t.home.impact.co2Saved}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-2xl font-black italic tracking-tighter text-primary">{totalSwaps * 150}</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t.home.impact.communityPoints}</span>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </section>

          {/* Community Pulse Section */}
          <AnimatePresence>
            {recentSwaps && recentSwaps.length > 0 && (
              <section className="mt-10 px-4">
                <div className="mb-4">
                  <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-foreground">
                    <Repeat className="h-5 w-5 text-primary" />
                    {t.home.communityPulse}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                    {t.home.communityPulseDesc}
                  </p>
                </div>
                <div className="space-y-3">
                  {recentSwaps.map((req, idx) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="border-none bg-white shadow-sm rounded-2xl ring-1 ring-black/[0.03] overflow-hidden">
                        <CardContent className="p-3 flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-xl">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${req.senderId}`} />
                            <AvatarFallback>?</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-foreground line-clamp-1">
                              <span className="text-primary">{req.senderName}</span> byttet <span className="italic">{req.itemTitle}</span> med <span className="text-primary">{req.receiverName}</span>
                            </p>
                            <p className="text-[9px] font-medium text-muted-foreground opacity-60 mt-0.5">
                              {formatDistanceToNow(new Date(req.createdAt), { 
                                addSuffix: true, 
                                locale: lang === 'no' ? nb : enUS 
                              })}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-primary/10 text-primary font-black text-[10px] rounded-lg shrink-0">
                             {req.points} pts
                          </Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </AnimatePresence>

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
                    <ItemCard item={item} userLocation={userLocation} />
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
                    <ItemCard item={deal} userLocation={userLocation} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Categories Horizontal Scroll */}
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
              <div className="flex flex-col">
                <h2 className="text-xl font-black tracking-tight">
                  {userLocation ? t.home.closest : t.home.title}
                </h2>
                {userLocation && (
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    Sortert etter nabolag
                  </span>
                )}
              </div>
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
                  {items.map((item) => (
                    <ItemCard key={item.id} item={item} userLocation={userLocation} />
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
