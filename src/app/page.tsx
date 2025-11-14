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


function getProductsWithSellers(products: Product[], sellers: Seller[]) {
  const sellersMap = new Map(sellers.map((seller) => [seller.id, seller]));
  return products.map((product) => ({
    product,
    seller: sellersMap.get(product.sellerId)!,
  }));
}

type Language = 'cn' | 'en' | 'no';

const translations = {
  cn: {
    headline: '您的轻量社区团购',
    subheadline: '邻里互助，发现身边的好物与服务',
    coreValue1: '用户免费发布和参团',
    coreValue2: '建立社区信任基础',
    sectionTitle: '邻里新鲜事',
    noItems: '该分类下暂无商品',
  },
  en: {
    headline: 'Your Lightweight Community Group Buying',
    subheadline: 'Neighborly help, discover good things and services around you',
    coreValue1: 'Users can post and join groups for free',
    coreValue2: 'Build a foundation of community trust',
    sectionTitle: "What's new in your neighborhood?",
    noItems: 'No items found in this category.',
  },
  no: {
    headline: 'Ditt Lette Fellesskapskjøp',
    subheadline: 'Nabolagshjelp, oppdag gode ting og tjenester rundt deg',
    coreValue1: 'Brukere kan legge ut og bli med i grupper gratis',
    coreValue2: 'Bygg et fundament av fellestillit',
    sectionTitle: 'Hva er nytt i nabolaget ditt?',
    noItems: 'Ingen varer funnet i denne kategorien.',
  },
};


export default function Home() {
  const [category, setCategory] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('proximity');
  const [language, setLanguage] = React.useState<Language>('cn');
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


  const productsWithSellers = React.useMemo(() => {
    if (!publicProducts) return [];
    return getProductsWithSellers(publicProducts, allSellers);
  }, [publicProducts]);
  
  const t = translations[language];

  const coreValues = [t.coreValue1, t.coreValue2];

  const filteredAndSortedProducts = React.useMemo(() => {
    if (!productsWithSellers) return [];
    return productsWithSellers
      .filter(({ product }) => category === 'all' || product.category === category)
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            // Assuming Product has a postedDate that can be converted to a date
            return new Date(b.product.postedDate).getTime() - new Date(a.product.postedDate).getTime();
          case 'price_asc':
            return a.product.price - b.product.price;
          case 'price_desc':
            return b.product.price - a.product.price;
          case 'proximity':
          default:
            const sellerA = allSellers.find(s => s.id === a.product.sellerId);
            const sellerB = allSellers.find(s => s.id === b.product.sellerId);
            return (sellerA?.locationRank || 99) - (sellerB?.locationRank || 99);
        }
      });
  }, [productsWithSellers, category, sortBy]);


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header onLanguageChange={setLanguage} />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="mb-8 text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tight md:text-5xl">
              {t.headline}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t.subheadline}
            </p>
          </div>

          <FeatureShowcase language={language} />

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
                {t.sectionTitle}
              </h2>
              <FilterBar
                category={category}
                onCategoryChange={setCategory}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                language={language}
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
                <p className="text-muted-foreground">{t.noItems}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
