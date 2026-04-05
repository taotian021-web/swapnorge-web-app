
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { SwapItem } from '@/lib/types';
import { getTranslations, type Language } from '@/lib/translations';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();

  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [activeFilter, setActiveFilter] = React.useState<string>('Alle');

  // Real-time collection from Firestore
  const itemsRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'items'), where('isPublic', '==', true), limit(30)) : null),
    [firestore]
  );
  const { data: allItems, isLoading } = useCollection<SwapItem>(itemsRef);

  // Filter items based on search query and category
  const filteredItems = React.useMemo(() => {
    if (!allItems) return [];
    return allItems.filter(item => {
      const matchesQuery = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeFilter === 'Alle' || item.category === activeFilter;
      return matchesQuery && matchesCategory;
    });
  }, [allItems, searchQuery, activeFilter]);

  const categories = ['Alle', 'Klær', 'Elektronikk', 'Hjem', 'Bøker', 'Sport', 'Annet'];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background pb-44">
      {/* Search Header */}
      <header className="sticky top-0 z-50 bg-background/80 px-4 py-4 backdrop-blur-xl border-b border-black/[0.03]">
        <div className="container mx-auto flex max-w-2xl items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
            <input 
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border-none bg-white pl-11 pr-10 text-sm shadow-sm ring-1 ring-black/[0.05] focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder={t.search.placeholder}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button variant="secondary" size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm">
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 pt-6">
        {/* Category Quick Filters - Optimized for sliding */}
        <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-2 touch-pan-x">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={cn(
                "whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ring-1",
                activeFilter === cat 
                ? "bg-primary text-foreground ring-primary shadow-lg shadow-primary/20" 
                : "bg-white text-muted-foreground ring-black/[0.05] hover:ring-black/10 shadow-sm"
              )}
            >
              {cat === 'Alle' ? (lang === 'no' ? 'Alle' : 'All') : (t.categories as any)[cat] || cat}
            </button>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black italic tracking-tighter">
            {t.search.results} <span className="text-primary ml-1">({filteredItems.length})</span>
          </h2>
          <div className="h-1 w-12 bg-primary rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <div key="loading" className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[1/1.1] w-full rounded-[2.5rem]" />
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-4"
            >
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-80 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-muted bg-white/50 px-8 text-center"
            >
              <div className="mb-4 text-5xl">🔭</div>
              <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                {t.search.noResults}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
