
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { SwapItem } from '@/lib/types';
import { Star, MapPin, Heart } from 'lucide-react';
import { getTranslations, Language } from '@/lib/translations';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

type ItemCardProps = {
  item: SwapItem;
};

export function ItemCard({ item }: ItemCardProps) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);

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
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              data-ai-hint="product photo"
            />
            <div className="absolute top-4 right-4">
              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-md hover:bg-white">
                <Heart className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-primary text-foreground font-black px-4 py-1.5 text-sm shadow-xl rounded-full">
                {item.points} {t.item.points}
              </Badge>
            </div>
          </div>
          <CardContent className="p-5">
            <h3 className="line-clamp-1 text-base font-bold text-foreground">
              {item.title}
            </h3>
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>{item.location.city || 'Oslo'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded-lg">
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

import { Button } from '@/components/ui/button';
