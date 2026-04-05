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
    if (isFavorited) await deleteDoc(ref);
    else await setDoc(ref, { itemId: item.id, savedAt: new Date().toISOString() });
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link href={`/items/${item.id}?lang=${lang}`} className="block h-full">
        <Card className="group h-full overflow-hidden border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem]">
          <div className="relative aspect-[1/1.1] w-full overflow-hidden">
            <Image
              src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/700`}
              alt={item.title}
              fill
              priority
              sizes="(max-width: 768px) 50vw, 33vw"
              className={cn(
                "object-cover transition-transform duration-700 ease-out group-hover:scale-110",
                (isReserved || isSwapped) && "grayscale-[0.5] opacity-80"
              )}
            />
            
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
               {isHot && !isReserved && !isSwapped && (
                 <Badge className="bg-red-500 text-white font-black px-3 py-1 text-[9px] uppercase tracking-wider rounded-lg shadow-lg border-none">
                    <Flame className="mr-1 h-3 w-3 fill-white" />
                    {lang === 'no' ? 'Populær' : 'Hot'}
                 </Badge>
               )}
            </div>

            <div className="absolute top-4 right-4 z-10">
              <Button 
                size="icon" 
                variant="secondary" 
                className={cn(
                  "h-10 w-10 rounded-full bg-white/80 backdrop-blur-md transition-all shadow-md active:scale-90",
                  isFavorited ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                )}
                onClick={toggleFavorite}
              >
                <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
              </Button>
            </div>
            
            <div className="absolute bottom-4 left-4 z-10">
              <div className="rounded-2xl bg-primary px-4 py-2 text-sm font-black text-foreground shadow-xl ring-1 ring-black/5">
                {item.points} pts
              </div>
            </div>

            {(isReserved || isSwapped) && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                 <Badge className={cn("px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl", isReserved ? "bg-orange-500 text-white" : "bg-white text-foreground")}>
                   {isReserved ? t.item.reserved : t.item.swapped}
                 </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                 {(t.categories as any)[item.category] || item.category}
               </span>
               <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground opacity-40">
                  <Eye className="h-3 w-3" />
                  <span>{item.views || 0}</span>
               </div>
            </div>
            <h3 className="line-clamp-1 text-base font-bold text-foreground group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <div className="mt-4 flex items-center justify-between border-t border-black/[0.03] pt-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70">
                  <MapPin className="h-3 w-3" />
                  <span>{item.location.city || 'Oslo'}</span>
                </div>
                {distance !== null && (
                  <span className="text-[9px] font-black text-primary/70 uppercase tracking-wider">
                    {distance < 1 ? '<1 km' : `${distance.toFixed(1)} km`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-black bg-primary/10 text-primary-foreground px-2 py-1 rounded-lg">
                <Star className="h-3 w-3 fill-current" />
                <span>{isOfficial ? "5.0" : item.sellerRating.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}