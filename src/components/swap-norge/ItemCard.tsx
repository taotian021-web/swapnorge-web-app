
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { SwapItem } from '@/lib/types';
import { Star, MapPin, Heart, Clock } from 'lucide-react';
import { getTranslations, Language } from '@/lib/translations';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

type ItemCardProps = {
  item: SwapItem;
};

export function ItemCard({ item }: ItemCardProps) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const { user } = useUser();
  const firestore = useFirestore();

  const isReserved = item.status === 'reserved';
  const isSwapped = item.status === 'swapped';

  // Check if item is favorited
  const favRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid, 'favorites', item.id) : null),
    [user, firestore, item.id]
  );
  const { data: favorite } = useDoc(favRef);
  const isFavorited = !!favorite;

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
            
            <div className="absolute top-4 right-4 z-10">
              <Button 
                size="icon" 
                variant="secondary" 
                className={cn(
                  "h-10 w-10 rounded-full backdrop-blur-md transition-all",
                  isFavorited ? "bg-red-500 text-white" : "bg-white/80 text-muted-foreground hover:bg-white hover:text-red-500"
                )}
                onClick={toggleFavorite}
              >
                <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
              </Button>
            </div>
            <div className="absolute bottom-4 left-4 z-10">
              <Badge className="bg-primary text-foreground font-black px-4 py-2 text-sm shadow-[0_10px_20px_-5px_rgba(243,197,0,0.4)] rounded-2xl ring-2 ring-white/20">
                {item.points} {t.item.points}
              </Badge>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="mb-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-primary">{(t.categories as any)[item.category] || item.category}</span>
            </div>
            <h3 className="line-clamp-1 text-base font-bold text-foreground">
              {item.title}
            </h3>
            <div className="mt-4 flex items-center justify-between border-t border-black/[0.03] pt-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{item.location.city || 'Oslo'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-foreground bg-primary/10 px-2 py-1 rounded-lg">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>{item.sellerRating.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
