import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Product } from '@/lib/types';
import { MessageSquare, ThumbsUp, Info, Hand, HardHat, ShoppingBasket, Eye } from 'lucide-react';
import { allSellers } from '@/lib/data';
import { WithId } from '@/firebase';
import { Button } from '../ui/button';
import { getTranslations, Language } from '@/lib/translations';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNowStrict } from 'date-fns';
import { zhCN } from 'date-fns/locale';

type OfferCardProps = {
  product: WithId<Product>;
};

const categoryMap: { [key: string]: { label: string, prefix: string } } = {
  Help: { label: 'Help', prefix: '【求助】' },
  Borrow: { label: 'Borrow', prefix: '【求助】' },
  'Group Buy': { label: 'GroupBuy', prefix: '【新鲜事】' },
  Activity: { label: 'Activity', prefix: '【活动】'},
  ForSale: { label: 'ForSale', prefix: '【闲置】'},
  Food: { label: 'Food', prefix: '【新鲜事】' },
  Household: { label: 'Household', prefix: '【闲置】' },
  Electronics: { label: 'Electronics', prefix: '【闲置】' },
  Garden: { label: 'Garden', prefix: '【闲置】' },
  Other: { label: 'Other', prefix: '【新鲜事】' },
};


export function OfferCard({ product }: OfferCardProps) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);

  const seller = allSellers.find(s => s.id === product.sellerId);
  
  const categoryInfo = categoryMap[product.category] || categoryMap['Other'];
  const fullTitle = `${categoryInfo.prefix} ${product.name}`;

  const postedAt = formatDistanceToNowStrict(new Date(product.postedDate), { addSuffix: true, locale: lang === 'no' ? undefined : undefined });

  return (
    <Card className="overflow-hidden shadow-sm transition-all duration-300 ease-in-out hover:shadow-md">
      <CardContent className="p-4">
        <h3 className="font-headline text-lg font-bold leading-tight tracking-tight_">
          {fullTitle}
        </h3>
        
        <p className="mt-2 text-sm text-muted-foreground">
          {product.description}
        </p>

        {product.price > 0 && categoryInfo.label === 'ForSale' && (
           <p className="mt-2 font-semibold text-primary">¥{product.price.toFixed(2)}</p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>📍 {product.storeName || '幸福里小区'}</span>
            <span>{postedAt}</span>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" className="gap-1 px-2 text-muted-foreground">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">{product.likes || 0}</span>
           </Button>
           {(product.category === 'Help' || product.category === 'Borrow' || product.category === 'ForSale' || product.category === 'Activity') && (
              <Button variant="ghost" size="sm" className="gap-1 px-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">{product.responses || 0}</span>
              </Button>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
               <Eye className="h-4 w-4" />
               <span className="text-xs">{product.views || 0}</span>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}
