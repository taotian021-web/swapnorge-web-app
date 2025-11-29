import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Product, Seller } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Hand, ShoppingBasket, HardHat, Info, DollarSign } from 'lucide-react';
import { allSellers } from '@/lib/data';
import { WithId } from '@/firebase';
import { Button } from '../ui/button';
import { getTranslations, Language } from '@/lib/translations';
import { useSearchParams } from 'next/navigation';


type OfferCardProps = {
  product: WithId<Product>;
  seller?: Seller;
};

const categoryMap: { [key in Product['category']]: { icon: React.ElementType, label: keyof (ReturnType<typeof getTranslations>['categories']) } } = {
  Borrow: { icon: Hand, label: 'Borrow' },
  Help: { icon: HardHat, label: 'Help' },
  'Group Buy': { icon: ShoppingBasket, label: 'GroupBuy' },
  Food: { icon: ShoppingBasket, label: 'Food' },
  Household: { icon: ShoppingBasket, label: 'Household' },
  Electronics: { icon: ShoppingBasket, label: 'Electronics' },
  Garden: { icon: ShoppingBasket, label: 'Garden' },
  Other: { icon: Info, label: 'Other' },
};


export function OfferCard({ product }: OfferCardProps) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);

  // Find the seller from the static data, or use a placeholder
  const seller = allSellers.find(s => s.id === product.sellerId) || {
      id: 'seller-placeholder',
      name: 'Community Member',
      avatarUrl: `https://i.pravatar.cc/150?u=${product.sellerId}`,
      location: 'Neighborhood',
      trustScore: 80,
      positiveFeedbackRate: 90,
      responseRate: 95,
      timeBankHours: 0,
      isAddressVerified: false,
      isSkillVerified: false,
      ratings: 0,
  };
  
  const categoryInfo = categoryMap[product.category] || categoryMap['Other'];
  const Icon = categoryInfo.icon;
  const categoryLabel = t.categories[categoryInfo.label] || product.category;

  const getStatusBadgeVariant = (status: Product['status']) => {
    switch (status) {
      case 'resolved':
        return 'outline';
      case 'inprogress':
        return 'secondary';
      default:
        return 'default';
    }
  }


  return (
    <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg">
      <CardHeader className="flex-row items-start justify-between gap-4 p-4">
        <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <p className="font-semibold">{categoryLabel}</p>
        </div>
        <Badge variant={getStatusBadgeVariant(product.status)}>
            {product.status === 'resolved' ? t.offerCard.resolved : t.offerCard.open}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Link href={`/product/${product.id}`} className="group block">
            <h3 className="font-headline text-lg font-bold leading-tight tracking-tight_ truncate group-hover:text-primary">
              {product.name}
            </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        
        <div className="mt-3 flex items-center justify-between text-sm">
            {product.responses > 0 && product.status === 'inprogress' && (
                <div className="text-primary font-semibold">
                    ⏳ {t.offerCard.responses(product.responses)}
                </div>
            )}
            {product.price > 0 && (
                <div className="flex items-center gap-1 font-semibold text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span>{t.offerCard.reward} ¥{product.price.toFixed(2)}</span>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={seller.avatarUrl} alt={seller.name} />
            <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{seller.name}</span>
        </div>
        <Button size="sm" disabled={product.status === 'resolved'}>
            {t.offerCard.canHelp}
        </Button>
      </CardFooter>
    </Card>
  );
}
