
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { SwapItem } from '@/lib/types';
import { Star, MapPin } from 'lucide-react';
import { getTranslations, Language } from '@/lib/translations';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

type ItemCardProps = {
  item: SwapItem;
};

export function ItemCard({ item }: ItemCardProps) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/items/${item.id}?lang=${lang}`}>
        <Card className="overflow-hidden border-none shadow-sm">
          <div className="relative aspect-square w-full">
            <Image
              src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/400`}
              alt={item.title}
              fill
              className="object-cover"
              data-ai-hint="product photo"
            />
            <div className="absolute bottom-2 left-2 rounded-full bg-primary px-3 py-1 text-xs font-bold shadow-md">
              {item.points} {t.item.points}
            </div>
          </div>
          <CardContent className="p-3">
            <h3 className="line-clamp-1 text-sm font-semibold leading-tight">
              {item.title}
            </h3>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{item.location.city || 'Oslo'}</span>
              </div>
              <div className="flex items-center gap-0.5 text-[10px] font-medium">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span>{item.sellerRating.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
