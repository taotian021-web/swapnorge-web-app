'use client';

import * as React from 'react';
import { Header } from '@/components/neighbor-buy/Header';
import { FeatureShowcase } from '@/components/neighbor-buy/FeatureShowcase';
import { FilterBar } from '@/components/neighbor-buy/FilterBar';
import { OfferCard } from '@/components/neighbor-buy/OfferCard';
import { allProducts, allSellers } from '@/lib/data';
import type { Product, Seller } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { CheckSquare } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

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
    sectionTitle: "What's new in your neighborhood?",
    noItems: 'No items found in this category.',
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

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);


  const productsWithSellers = React.useMemo(() => getProductsWithSellers(allProducts, allSellers), []);
  
  const t = translations[language];

  const coreValues = [t.coreValue1, t.coreValue2];

  const filteredAndSortedProducts = React.useMemo(() => {
    return productsWithSellers
      .filter(({ product }) => category === 'all' || product.category === category)
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.product.postedDate).getTime() - new Date(a.product.postedDate).getTime();
          case 'price_asc':
            return a.product.price - b.product.price;
          case 'price_desc':
            return b.product.price - a.product.price;
          case 'proximity':
          default:
            return a.seller.locationRank - b.seller.locationRank;
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
              />
            </div>

            {filteredAndSortedProducts.length > 0 ? (
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
