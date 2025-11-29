'use client';

import * as React from 'react';
import { Header } from '@/components/neighbor-buy/Header';
import { FeatureShowcase } from '@/components/neighbor-buy/FeatureShowcase';
import { FilterBar } from '@/components/neighbor-buy/FilterBar';
import { OfferCard } from '@/components/neighbor-buy/OfferCard';
import { allSellers } from '@/lib/data';
import type { Product, Seller } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { CheckSquare } from 'lucide-react';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { getDistanceFromLatLonInKm } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function getProductsWithSellers(products: Product[], sellers: Seller[]) {
  const sellersMap = new Map(sellers.map((seller) => [seller.id, seller]));
  return products.map((product) => ({
    product,
    seller: sellersMap.get(product.sellerId)!,
  }));
}

export default function Home() {
  const [category, setCategory] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('proximity');
  const [userLocation, setUserLocation] = React.useState<GeolocationCoordinates | null>(null);
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);
  const { toast } = useToast();


  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const publicProductsRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'products'), where('isPublic', '==', true)) : null),
    [firestore]
  );
  const { data: publicProducts, isLoading: isLoadingProducts } = useCollection<Product>(publicProductsRef);

  React.useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);
  
  React.useEffect(() => {
    if (sortBy === 'proximity' && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position.coords);
        },
        (error) => {
          console.warn(`ERROR(${error.code}): ${error.message}`);
          if (error.code === error.PERMISSION_DENIED) {
             toast({
                variant: 'destructive',
                title: 'Location Access Denied',
                description: 'Proximity sorting is disabled. Please enable location services in your browser settings.',
             });
          }
        }
      );
    }
  }, [sortBy, userLocation, toast]);


  const productsWithSellers = React.useMemo(() => {
    if (!publicProducts) return [];
    return getProductsWithSellers(publicProducts, allSellers);
  }, [publicProducts]);
  
  const coreValues = [t.home.coreValue1, t.home.coreValue2];

  const filteredAndSortedProducts = React.useMemo(() => {
    if (!productsWithSellers) return [];
    
    let sorted = [...productsWithSellers]
      .filter(({ product }) => category === 'all' || product.category === category);

    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.product.postedDate).getTime() - new Date(a.product.postedDate).getTime());
        break;
      case 'price_asc':
        sorted.sort((a, b) => a.product.price - b.product.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.product.price - a.product.price);
        break;
      case 'trust':
        sorted.sort((a, b) => b.seller.trustScore - a.seller.trustScore);
        break;
      case 'proximity':
        if (userLocation) {
            sorted.sort((a, b) => {
                const distA = a.product.location ? getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, a.product.location.latitude, a.product.location.longitude) : Infinity;
                const distB = b.product.location ? getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, b.product.location.latitude, b.product.location.longitude) : Infinity;
                return distA - distB;
            });
        }
        break;
      default:
        // Default sort or maintain current order
        break;
    }
    return sorted;
  }, [productsWithSellers, category, sortBy, userLocation]);


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="mb-8 text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tight md:text-5xl">
              {t.home.headline}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t.home.subheadline}
            </p>
          </div>

          <FeatureShowcase language={lang} />

          <div className="my-12 flex justify-center">
            <div className="space-y-4">
              {coreValues.map((value) => (
                <div key={value} className="flex items-center gap-3">
                  <CheckSquare className="h-6 w-6 text-green-600" />
                  <span className="text-lg font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-12" />

          <div className="space-y-8">
            <div>
              <h2 className="font-headline mb-4 text-2xl font-bold md:text-3xl">
                {t.home.sectionTitle}
              </h2>
              <FilterBar
                category={category}
                onCategoryChange={setCategory}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                language={lang}
              />
            </div>

            {isLoadingProducts ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="h-full overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative h-48 w-full animate-pulse bg-muted" />
                      <div className="p-4">
                         <div className="h-5 w-3/4 animate-pulse rounded bg-muted"/>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between p-4 pt-0">
                       <div className="h-8 w-24 animate-pulse rounded bg-muted"/>
                       <div className="h-4 w-16 animate-pulse rounded bg-muted"/>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAndSortedProducts.map(({ product, seller }) => (
                  <OfferCard key={product.id} product={product} seller={seller} />
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                <p className="text-muted-foreground">{t.home.noItems}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
