'use client';

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, Star, Medal, MapPin, Package, Quote, Gem, ShoppingBag, Sparkles } from 'lucide-react';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSupabase } from '@/supabase';
import type { SwapItem, UserProfile, Review } from '@/lib/types';

export default function PublicProfilePage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const translatedCategories = t.categories as Record<string, string> | undefined;
  const supabase = useSupabase();

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [items, setItems] = React.useState<SwapItem[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [isProfileLoading, setIsProfileLoading] = React.useState(true);
  const [isItemsLoading, setIsItemsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!supabase || !id) return;
      setIsProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (!mounted) return;
      if (error && error.message !== 'No rows found') {
        console.error('Supabase profile fetch error:', error.message);
        setProfile(null);
      } else {
        setProfile(data ?? null);
      }
      setIsProfileLoading(false);
    }

    async function loadItems() {
      if (!supabase || !id) return;
      setIsItemsLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('sellerId', id)
        .eq('status', 'available');

      if (!mounted) return;
      if (error) {
        console.error('Supabase items fetch error:', error.message);
        setItems([]);
      } else {
        setItems(data ?? []);
      }
      setIsItemsLoading(false);
    }

    async function loadReviews() {
      if (!supabase || !id) return;
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('toId', id)
        .order('createdAt', { ascending: false })
        .limit(20);

      if (!mounted) return;
      if (error) {
        console.error('Supabase reviews fetch error:', error.message);
        setReviews([]);
      } else {
        setReviews(data ?? []);
      }
    }

    loadProfile();
    loadItems();
    loadReviews();

    return () => {
      mounted = false;
    };
  }, [supabase, id]);

  const isOfficial = profile?.displayName === 'SwapNorge Official';

  const getRankInfo = (swaps: number) => {
    if (swaps >= 50) return { label: lang === 'no' ? 'Nabolagshelt' : 'Neighborhood Hero', color: 'text-purple-600', next: null, threshold: 50 };
    if (swaps >= 20) return { label: lang === 'no' ? 'Bytte-stjerne' : 'Swap Star', color: 'text-primary', next: 50, threshold: 20 };
    if (swaps >= 5) return { label: lang === 'no' ? 'Aktiv Nabo' : 'Active Neighbor', color: 'text-green-600', next: 20, threshold: 5 };
    return { label: lang === 'no' ? 'Ny i nabolaget' : 'Neighborhood Newbie', color: 'text-muted-foreground', next: 5, threshold: 0 };
  };

  const swaps = profile?.stats?.completedSwaps ?? 0;
  const rank = getRankInfo(swaps);
  const progressPercent = rank.next
    ? ((swaps - rank.threshold) / (rank.next - rank.threshold)) * 100
    : 100;

  const expertise = React.useMemo(() => {
    if (!items || items.length === 0) return null;
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[1] >= 2 ? sorted[0][0] : null;
  }, [items]);

  if (isProfileLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Skeleton className="h-24 w-24 rounded-[2.5rem]" />
        <Skeleton className="mt-4 h-6 w-32" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-black">{lang === 'no' ? 'Fant ikke brukeren' : 'User not found'}</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href={`/?lang=${lang}`}>{lang === 'no' ? 'Gå tilbake' : 'Go back'}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background pb-28">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background/80 p-4 backdrop-blur-xl border-b border-black/[0.03]">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" asChild>
          <Link href={`/?lang=${lang}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="text-sm font-black uppercase tracking-widest">{t.profile.neighborShop}</h1>
        <div className="w-10" />
      </header>

      <main className="container mx-auto max-w-2xl px-6 pt-0">
        <div className="mb-10 flex flex-col items-center">
          <div className="relative">
            <div className="h-28 w-28 rounded-[2.5rem] bg-white p-1 shadow-2xl ring-1 ring-black/[0.05]">
              <Avatar className="h-full w-full rounded-[2.2rem]">
                <AvatarImage src={profile.photoURL || `https://i.pravatar.cc/150?u=${profile.uid}`} />
                <AvatarFallback className="text-2xl font-black">{profile.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            {isOfficial ? (
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-foreground text-primary shadow-xl">
                <Gem className="h-4 w-4 fill-current" />
              </div>
            ) : (
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-green-500 text-white shadow-xl">
                <Medal className="h-4 w-4 fill-current" />
              </div>
            )}
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight flex items-center gap-2">
            {profile.displayName}
            {isOfficial && <Gem className="h-5 w-5 text-primary fill-primary" />}
          </h2>

          <div className="mt-4 w-full max-w-[240px] space-y-3">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
              <span className={rank.color}>{rank.label}</span>
              <span className="text-muted-foreground opacity-60">{swaps} {t.profile.swaps}</span>
            </div>
            <Progress value={progressPercent} className="h-1.5 rounded-full bg-muted" />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {expertise && (
              <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl">
                <Sparkles className="mr-1.5 h-3 w-3" />
                {t.profile.expertIn} {translatedCategories?.[expertise] || expertise}
              </Badge>
            )}
            <Badge variant="outline" className="border-black/[0.05] text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 rounded-xl">
              <MapPin className="mr-1.5 h-3 w-3" />
              Oslo, Norge
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-2 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/[0.03]">
            <TabsTrigger value="items" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">
              <Package className="mr-2 h-3.5 w-3.5" />
              {t.profile.activeListings}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">
              <Star className="mr-2 h-3.5 w-3.5" />
              {t.profile.reviews}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            {isItemsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-3xl" />)}
              </div>
            ) : items && items.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {items.map((item) => <ItemCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center rounded-[3rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-10 text-center border-2 border-dashed border-muted/50">
                <ShoppingBag className="mb-4 h-12 w-12 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{lang === 'no' ? 'Ingen aktive annonser' : 'No active listings'}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews && reviews.length > 0 ? (
                reviews.map((rev) => (
                  <motion.div
                    key={rev.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="border-none bg-white shadow-sm rounded-[2rem] ring-1 ring-black/[0.03] overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Quote className="h-6 w-6 text-primary shrink-0 opacity-20" />
                          <div className="flex-1">
                            <p className="text-sm font-bold italic leading-relaxed text-foreground/80">&ldquo;{rev.content}&rdquo;</p>
                            <div className="mt-4 flex items-center justify-between border-t border-black/[0.03] pt-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={`https://i.pravatar.cc/150?u=${rev.fromId}`} />
                                  <AvatarFallback>?</AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{rev.fromName}</span>
                              </div>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-2.5 w-2.5 fill-primary text-primary" />)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="flex h-48 items-center justify-center rounded-[2rem] bg-white text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-40 shadow-sm ring-1 ring-black/[0.03]">
                  {t.profile.noReviews}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
