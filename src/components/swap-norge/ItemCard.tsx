
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { SwapItem, GeoLocation } from '@/lib/types';
import { Star, MapPin, Heart, Clock, ShieldCheck, Eye, Flame } from 'lucide-react';
import { getTranslations, Language } from '@/lib/translations';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { cn, getDistanceFromLatLonInKm } from '@/lib/utils';
import React from 'react';

type ItemCardProps = {
  item: SwapItem;
  userLocation?: GeoLocation | null;
};

export function ItemCard({ item, userLocation }: ItemCardProps) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const { user } = useUser();
  const firestore = useFirestore();

  const isReserved = item.status === 'reserved';
  const isSwapped = item.status === 'swapped';
  const isOfficial = item.sellerName === 'SwapNorge Official' || item.category === 'Gave';
  const isHot = (item.views || 0) > 10;

  // Check if item is favorited
  const favRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid, 'favorites', item.id) : null),
    [user, firestore, item.id]
  );
  const { data: favorite } = useDoc(favRef);
  const isFavorited = !!favorite;

  const distance = React.useMemo(() => {
    if (!userLocation || !item.location) return null;
    return getDistanceFromLatLonInKm(
      userLocation.latitude,
      userLocation.longitude,
      item.location.latitude,
      item.location.longitude
    );
  }, [userLocation, item.location]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !firestore) return;

    const ref = doc(firestore, 'users', user.uid, 'favorites', item.id);
    if (isFavorited) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        itemId: item.id,
        savedAt: new Date().toISOString()
      });
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link href={`/items/${item.id}?lang=${lang}`}>
        <Card className="group overflow-hidden border-none bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] rounded-[2.5rem]">
          <div className="relative aspect-[1/1.1] w-full overflow-hidden">
            <Image
              src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/700`}
              alt={item.title}
              fill
              className={cn(
                "object-cover transition-transform duration-700 group-hover:scale-110",
                (isReserved || isSwapped) && "grayscale-[0.5] opacity-80"
              )}
              data-ai-hint="product photo"
            />
            
            {/* Status Overlays */}
            {isReserved && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                 <Badge className="bg-orange-500 text-white font-black px-4 py-2 text-xs uppercase tracking-widest rounded-xl shadow-xl">
                   <Clock className="mr-1.5 h-3.5 w-3.5" />
                   {t.item.reserved}
                 </Badge>
              </div>
            )}
            
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
               {isHot && !isReserved && !isSwapped && (
                 <Badge className="bg-red-500 text-white font-black px-3 py-1 text-[9px] uppercase tracking-[0.1em] rounded-lg shadow-xl animate-pulse border-none">
                    <Flame className="mr-1 h-3 w-3 fill-white" />
                    {lang === 'no' ? 'Populær' : 'Hot'}
                 </Badge>
               )}
            </div>

            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
              <Button 
                size="icon" 
                variant="secondary" 
                className={cn(
                  "h-10 w-10 rounded-full backdrop-blur-md transition-all shadow-lg",
                  isFavorited ? "bg-red-500 text-white" : "bg-white/80 text-muted-foreground hover:bg-white hover:text-red-500"
                )}
                onClick={toggleFavorite}
              >
                <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
              </Button>
              {isOfficial && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-primary shadow-lg ring-2 ring-white/20">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              )}
            </div>
            
            <div className="absolute bottom-4 left-4 z-10">
              <Badge className="bg-primary text-foreground font-black px-4 py-2 text-sm shadow-[0_10px_20px_-5px_rgba(243,197,0,0.4)] rounded-2xl ring-2 ring-white/20">
                {item.points} {t.item.points}
              </Badge>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                 {(t.categories as any)[item.category] || item.category}
               </span>
               <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground opacity-60">
                  <Eye className="h-2.5 w-2.5" />
                  <span>{item.views || 0}</span>
               </div>
            </div>
            <h3 className="line-clamp-1 text-base font-bold text-foreground">
              {item.title}
            </h3>
            <div className="mt-4 flex items-center justify-between border-t border-black/[0.03] pt-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{item.location.city || 'Oslo'}</span>
                </div>
                {distance !== null && (
                  <span className="ml-4.5 text-[9px] font-black text-primary uppercase tracking-wider">
                    {distance < 1 ? '<1 km' : `${distance.toFixed(1)} km`} {t.item.distance}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-foreground bg-primary/10 px-2 py-1 rounded-lg">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>{isOfficial ? "5.0" : item.sellerRating.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
