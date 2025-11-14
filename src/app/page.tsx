'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { allProducts, allSellers } from '@/lib/data';
import type { Product, Seller } from '@/lib/types';
import { Header } from '@/components/neighbor-buy/Header';
import { FilterBar } from '@/components/neighbor-buy/FilterBar';
import { OfferCard } from '@/components/neighbor-buy/OfferCard';

type SortOption = 'proximity' | 'price_asc' | 'price_desc' | 'newest';

const sellersMap = new Map<string, Seller>(allSellers.map((seller) => [seller.id, seller]));

export default function Home() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(allProducts);
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('proximity');

  React.useEffect(() => {
    let products = [...allProducts];

    // Filter by category
    if (category !== 'all') {
      products = products.filter((p) => p.category === category);
    }

    // Sort products
    products.sort((a, b) => {
      const sellerA = sellersMap.get(a.sellerId);
      const sellerB = sellersMap.get(b.sellerId);

      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'newest':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        case 'proximity':
        default:
          return (sellerA?.locationRank ?? 99) - (sellerB?.locationRank ?? 99);
      }
    });

    setFilteredProducts(products);
  }, [category, sortBy]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 space-y-2">
            <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
              What's new in your neighborhood?
            </h1>
            <p className="text-muted-foreground">
              Discover deals, products, and group buys from your neighbors.
            </p>
          </div>

          <FilterBar
            category={category}
            onCategoryChange={setCategory}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const seller = sellersMap.get(product.sellerId);
              if (!seller) return null;
              return <OfferCard key={product.id} product={product} seller={seller} />;
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
