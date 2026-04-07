'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { SwapItem, GeoLocation } from '@/lib/types';
import { getTranslations, type Language } from '@/lib/translations';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, X, MapPin, ArrowUpDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getDistanceFromLatLonInKm } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();

  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [activeFilter, setActiveFilter] = React.useState<string>('Alle');
  const [sortBy, setSortBy] = React.useState<string>('closest');
  const [userLocation, setUserLocation] = React.useState<GeoLocation | null>(null);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            city: 'Din posisjon'
          });
        },
        () => console.log('Search location access denied')
      );
    }
  }, []);

  const itemsRef = useMemoFirebase(
    () => (firestore ? query(
      collection(firestore, 'items'), 
      where('isPublic', '==', true),
      where('status', '==', 'available'),
      limit(50)
    ) : null),
    [firestore]
  );
  const { data: allItems, isLoading } = useCollection<SwapItem>(itemsRef);

  const filteredItems = React.useMemo(() => {
    if (!allItems) return [];
    
    let processed = allItems.filter(item => {
      const matchesQuery = !searchQuery || 
                           item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeFilter === 'Alle' || item.category === activeFilter;
      return matchesQuery && matchesCategory;
    });

    if (sortBy === 'closest' && userLocation) {
      processed.sort((a, b) => {
        const distA = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, a.location.latitude, a.location.longitude);
        const distB = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, b.location.latitude, b.location.longitude);
        return distA - distB;
      });
    } else if (sortBy === 'newest') {
      processed.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    } else if (sortBy === 'points_asc') {
      processed.sort((a, b) => a.points - b.points);
    } else if (sortBy === 'points_desc') {
      processed.sort((a, b) => b.points - a.points);
    }

    return processed;
  }, [allItems, searchQuery, activeFilter, userLocation, sortBy]);

  const categories = ['Alle', 'Klær', 'Elektronikk', 'Hjem', 'Bøker', 'Sport', 'Annet'];
  const popularKeywords = ['Sykkel', 'Kjole', 'Sofa', 'Nintendo', 'Harry Potter', 'Planter'];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleQuickSearch = (word: string) => {
    setSearchQuery(word);
    const params = new URLSearchParams(searchParams);
    params.set('q', word);
    params.set('lang', lang);
    router.replace(`/search?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background pb-44">
      <main className="container mx-auto max-w-2xl px-4 pt-6">
        {/* Category Quick Filters - 优化的滑动体验 */}
        <div className="-mx-4 mb-10 overflow-hidden">
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 py-2 touch-pan-x flex-nowrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={cn(
                  "whitespace-nowrap px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ring-1 active-scale",
                  activeFilter === cat 
                  ? "bg-primary text-foreground ring-primary shadow-lg shadow-primary/20" 
                  : "bg-white text-muted-foreground ring-black/[0.05] hover:ring-black/10 shadow-sm"
                )}
              >
                {cat === 'Alle' ? (lang === 'no' ? 'Alle' : 'All') : (t.categories as any)[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Discovery Helper when empty - 优化的滑动体验 */}
        {!searchQuery && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h3 className="mb-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 px-1">
              {t.search.popularCategories}
            </h3>
            <div className="-mx-4 overflow-hidden">
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 py-2 touch-pan-x flex-nowrap">
                {popularKeywords.map((word) => (
                  <Button 
                    key={word} 
                    variant="outline" 
                    onClick={() => handleQuickSearch(word)}
                    className="h-12 rounded-2xl border-none bg-white px-6 text-xs font-bold shadow-sm ring-1 ring-black/[0.03] transition-all hover:bg-primary/10 hover:text-primary active-scale shrink-0"
                  >
                    <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                    {word}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black italic tracking-tighter">
              {t.search.results} <span className="text-primary ml-1">({filteredItems.length})</span>
            </h2>
            <div className="mt-1 flex items-center gap-1.5">
               <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" />
                {sortBy === 'closest' ? t.search.closest : sortBy === 'newest' ? t.search.newest : sortBy === 'points_asc' ? t.search.pointsLow : t.search.pointsHigh}
              </span>
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors">
                    {t.search.sortBy}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-none p-2 shadow-2xl bg-white">
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                    <DropdownMenuRadioItem value="closest" className="rounded-xl font-bold py-3 text-xs">{t.search.closest}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="newest" className="rounded-xl font-bold py-3 text-xs">{t.search.newest}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="points_asc" className="rounded-xl font-bold py-3 text-xs">{t.search.pointsLow}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="points_desc" className="rounded-xl font-bold py-3 text-xs">{t.search.pointsHigh}</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="h-1.5 w-12 bg-primary rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <div key="loading" className="grid grid-cols-2 gap-5">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[1/1.2] w-full rounded-[2.5rem]" />
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-5"
            >
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} userLocation={userLocation} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-80 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-muted bg-white/30 px-8 text-center"
            >
              <div className="mb-4 text-5xl">🔭</div>
              <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                {t.search.noResults}
              </p>
              <Button 
                variant="ghost" 
                onClick={() => { setSearchQuery(''); setActiveFilter('Alle'); }}
                className="mt-6 text-primary font-black text-xs uppercase tracking-widest active-scale"
              >
                Reset filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
