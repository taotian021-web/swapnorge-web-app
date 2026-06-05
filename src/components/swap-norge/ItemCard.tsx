'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { SwapItem, GeoLocation } from '@/lib/types';
import { Star, MapPin, Heart, Eye } from 'lucide-react';
import { getTranslations, Language } from '@/lib/translations';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, getDistanceFromLatLonInKm } from '@/lib/utils';
import { useSupabase } from '@/supabase';
import { useSupabaseUser } from '@/supabase/hooks';
import React from 'react';

type ItemCardProps = {
  item: SwapItem;
  userLocation?: GeoLocation | null;
};

export function ItemCard({ item, userLocation }: ItemCardProps) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang) as unknown as { categories?: Record<string, string>; item?: { reserved?: string; swapped?: string } };
  const supabase = useSupabase();
  const { user } = useSupabaseUser();

  const [isFavorited, setIsFavorited] = React.useState(false);
  const [favoriteLoading, setFavoriteLoading] = React.useState(false);

  const isReserved = item.status === 'reserved';
  const isSwapped = item.status === 'swapped';

  React.useEffect(() => {
    let mounted = true;
    async function loadFavorite() {
      if (!supabase || !user) {
        setIsFavorited(false);
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('userId', user.id)
        .eq('itemId', item.id)
        .single();

      if (!mounted) return;
      if (error && error.message !== 'No rows found') {
        console.error('Supabase favorite fetch error:', error.message);
        setIsFavorited(false);
      } else {
        setIsFavorited(Boolean(data));
      }
    }

    loadFavorite();
    return () => {
      mounted = false;
    };
  }, [supabase, user, item.id]);

  const distance = React.useMemo(() => {
    if (!userLocation || !item.location.latitude || !item.location.longitude) return null;
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
    if (!supabase || !user || favoriteLoading) return;
    setFavoriteLoading(true);

    if (isFavorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('userId', user.id)
        .eq('itemId', item.id);
      setIsFavorited(false);
    } else {
      await supabase
        .from('favorites')
        .insert({ userId: user.id, itemId: item.id, savedAt: new Date().toISOString() });
      setIsFavorited(true);
    }

    setFavoriteLoading(false);
  };

  return (
    <motion.div whileTap={{ scale: 0.98 }} className="h-full">
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
                'object-cover transition-transform duration-700 ease-out group-hover:scale-110',
                (isReserved || isSwapped) && 'grayscale-[0.5] opacity-80'
              )}
            />

            <div className="absolute top-4 right-4 z-10">
              <Button
                size="icon"
                variant="ghost"
                aria-label={isFavorited ? 'Remove favorite' : 'Add favorite'}
                disabled={favoriteLoading}
                className={cn(
                  'h-10 w-10 rounded-full bg-white/90 backdrop-blur-md transition-all shadow-md active:scale-90',
                  isFavorited ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                )}
                onClick={toggleFavorite}
              >
                <Heart className={cn('h-5 w-5', isFavorited && 'fill-current')} />
              </Button>
            </div>

            <div className="absolute bottom-4 left-4 z-10">
              <div className="rounded-2xl bg-primary px-4 py-2 text-sm font-black text-foreground shadow-xl ring-1 ring-black/5">
                {item.points} pts
              </div>
            </div>

            {(isReserved || isSwapped) && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                <Badge className={cn('px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl', isReserved ? 'bg-orange-500 text-white' : 'bg-white text-foreground')}>
                  {isReserved ? (t.item?.reserved ?? 'Reserved') : (t.item?.swapped ?? 'Swapped')}
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                {t.categories?.[item.category] || item.category}
              </span>
              <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground opacity-30">
                <Eye className="h-3 w-3" />
                <span>{item.views || 0}</span>
              </div>
            </div>
            <h3 className="line-clamp-1 text-base font-bold text-foreground group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            {item.description ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-3 border-t border-black/[0.03] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/90">
                  <MapPin className="h-3 w-3" />
                  <span>{distance !== null ? `${distance.toFixed(1)} km` : item.location.city || 'Nær deg'}</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 text-[10px] font-black bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                <Star className="h-3 w-3 fill-current" />
                <span>{item.sellerRating.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
