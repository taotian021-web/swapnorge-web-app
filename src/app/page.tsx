'use client';

import * as React from 'react';
import { Header } from '@/components/neighbor-buy/Header';
import { FilterBar } from '@/components/neighbor-buy/FilterBar';
import { OfferCard } from '@/components/neighbor-buy/OfferCard';
import type { Product, Seller } from '@/lib/types';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { collection, query, where } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { getDistanceFromLatLonInKm } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PostNeedsSheet } from '@/components/neighbor-buy/PostNeedsSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { allSellers } from '@/lib/data';

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
  const [isSheetOpen, setSheetOpen] = React.useState(false);


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
        sorted.sort((a, b) => (b.seller?.trustScore || 0) - (a.seller?.trustScore || 0));
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
    <>
      <PostNeedsSheet open={isSheetOpen} onOpenChange={setSheetOpen} />
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto max-w-7xl px-4 py-6 md:px-8">
            {/* Core Action Area */}
            <div className="mb-6 rounded-lg bg-card p-6 text-center shadow-sm">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {t.home.actionTitle}
              </h1>
              <p className="mt-2 text-muted-foreground">{t.home.actionSubtitle}</p>
              <Button size="lg" className="mt-4 h-12 px-8 text-lg" onClick={() => setSheetOpen(true)}>
                <Plus className="mr-2 h-6 w-6" />
                {t.header.post}
              </Button>
            </div>

            {/* Dynamic Information Feed */}
            <div className="space-y-6">
              <div>
                <h2 className="font-headline mb-4 text-xl font-bold md:text-2xl">
                  {t.home.feedTitle}
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-3 rounded-lg border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-5 w-3/4" />
                      <div className="flex items-center justify-between">
                         <Skeleton className="h-8 w-24" />
                         <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}
