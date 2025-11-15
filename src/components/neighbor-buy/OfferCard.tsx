import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Product, Seller } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Home, MapPin } from 'lucide-react';
import { allSellers } from '@/lib/data';


type OfferCardProps = {
  product: Product & { id: string };
  seller?: Seller;
};

export function OfferCard({ product }: OfferCardProps) {
  // Find the seller from the static data, or use a placeholder
  const seller = allSellers.find(s => s.id === product.sellerId) || {
      id: 'seller-placeholder',
      name: 'Community Member',
      avatarUrl: `https://i.pravatar.cc/150?u=${product.sellerId}`,
      location: 'Neighborhood',
  };

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint={product.imageHint}
            />
            <Badge
              variant="secondary"
              className="absolute right-2 top-2 bg-card/80 backdrop-blur-sm"
            >
              ${product.price.toFixed(2)}
            </Badge>
          </div>
          <div className="p-4">
            <h3 className="font-headline font-bold_ text-lg leading-tight tracking-tight_ truncate">
              {product.name}
            </h3>
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
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{seller.location}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
