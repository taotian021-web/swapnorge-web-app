
'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, orderBy, limit } from 'firebase/firestore';
import type { SwapItem, UserProfile, Review } from '@/lib/types';
import { getTranslations, type Language } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Star, Medal, MapPin, Package, Quote, Gem, ShoppingBag } from 'lucide-react';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();

  // Fetch Public User Profile
  const userRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'users', id as string) : null),
    [firestore, id]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  // Fetch User's Active Items
  const itemsQuery = useMemoFirebase(
    () => (firestore && id ? query(
      collection(firestore, 'items'), 
      where('sellerId', '==', id),
      where('status', '==', 'available')
    ) : null),
    [firestore, id]
  );
  const { data: items, isLoading: isItemsLoading } = useCollection<SwapItem>(itemsQuery);

  // Fetch Reviews for this User
  const reviewsQuery = useMemoFirebase(
    () => (firestore && id ? query(
      collection(firestore, 'reviews'), 
      where('toId', '==', id),
      orderBy('createdAt', 'desc'),
      limit(20)
    ) : null),
    [firestore, id]
  );
  const { data: reviews } = useCollection<Review>(reviewsQuery);

  const isOfficial = profile?.displayName === 'SwapNorge Official';

  const getRank = (swaps: number) => {
    if (swaps >= 50) return { label: lang === 'no' ? 'Nabolagshelt' : 'Neighborhood Hero', color: 'text-purple-600' };
    if (swaps >= 20) return { label: lang === 'no' ? 'Bytte-stjerne' : 'Swap Star', color: 'text-primary' };
    if (swaps >= 5) return { label: lang === 'no' ? 'Aktiv Nabo' : 'Active Neighbor', color: 'text-green-600' };
    return { label: lang === 'no' ? 'Ny i nabolaget' : 'Neighborhood Newbie', color: 'text-muted-foreground' };
  };

  const rank = getRank(profile?.stats?.completedSwaps ?? 0);

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
    <div className="flex min-h-screen w-full flex-col bg-background pb-32">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background/80 p-4 backdrop-blur-xl border-b border-black/[0.03]">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" asChild>
          <Link href={`/?lang=${lang}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="text-sm font-black uppercase tracking-widest">{t.profile.neighborShop}</h1>
        <div className="w-10" />
      </header>

      <main className="container mx-auto max-w-2xl px-6 pt-10">
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
          <div className="mt-2 flex items-center gap-2">
             <Badge variant="secondary" className={`bg-transparent p-0 font-black uppercase tracking-[0.1em] text-[10px] ${rank.color}`}>
               {rank.label}
             </Badge>
             <span className="text-[10px] text-muted-foreground">•</span>
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                {profile.stats?.completedSwaps ?? 0} {t.profile.swaps}
             </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-[0.1em]">
            <MapPin className="h-3 w-3" />
            <span>Oslo, Norge</span>
            <span className="mx-1">•</span>
            <span>{t.profile.memberSince} {profile.stats?.memberSince ? format(new Date(profile.stats.memberSince), 'yyyy') : '2024'}</span>
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
                {items.map(item => <ItemCard key={item.id} item={item} />)}
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
                reviews.map(rev => (
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
                              <p className="text-sm font-bold italic leading-relaxed text-foreground/80">"{rev.content}"</p>
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
