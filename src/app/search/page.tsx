'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X, MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getDistanceFromLatLonInKm } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabase } from '@/supabase';
import type { SwapItem, GeoLocation } from '@/lib/types';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const supabase = useSupabase();

  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [activeFilter, setActiveFilter] = React.useState<string>('Alle');
  const [sortBy, setSortBy] = React.useState<string>('closest');
  const [userLocation, setUserLocation] = React.useState<GeoLocation | null>(null);
  const [items, setItems] = React.useState<SwapItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            city: lang === 'no' ? 'Din posisjon' : 'Your position',
          });
        },
        () => console.log('Search location access denied')
      );
    }
  }, [lang]);

  React.useEffect(() => {
    let mounted = true;

    async function loadItems() {
      if (!supabase) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'available')
        .limit(50);

      if (!mounted) return;
      if (error) {
        console.error('Supabase fetch items error:', error.message);
        setItems([]);
      } else {
        setItems(data ?? []);
      }
      setIsLoading(false);
    }

    loadItems();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const filteredItems = React.useMemo(() => {
    let processed = items;

    if (activeFilter !== 'Alle') {
      processed = processed.filter((item) => item.category === activeFilter);
    }

    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      processed = processed.filter((item) =>
        item.title.toLowerCase().includes(queryLower) ||
        item.description.toLowerCase().includes(queryLower)
      );
    }

    if (sortBy === 'closest' && userLocation) {
      processed = [...processed].sort((a, b) => {
        const distA = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, a.location.latitude, a.location.longitude);
        const distB = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, b.location.latitude, b.location.longitude);
        return distA - distB;
      });
    } else if (sortBy === 'newest') {
      processed = [...processed].sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    } else if (sortBy === 'points_asc') {
      processed = [...processed].sort((a, b) => a.points - b.points);
    } else if (sortBy === 'points_desc') {
      processed = [...processed].sort((a, b) => b.points - a.points);
    }

    return processed;
  }, [items, searchQuery, activeFilter, userLocation, sortBy]);

  const categories = ['Alle', 'Klær', 'Elektronikk', 'Hjem', 'Bøker', 'Sport', 'Annet'];
  const popularKeywords = lang === 'no'
    ? ['Sykkel', 'Kjole', 'Sofa', 'Nintendo', 'Harry Potter', 'Planter']
    : ['Bike', 'Dress', 'Sofa', 'Nintendo', 'Harry Potter', 'Plants'];

  const handleQuickSearch = (word: string) => {
    setSearchQuery(word);
    const params = new URLSearchParams(searchParams);
    params.set('q', word);
    params.set('lang', lang);
    router.replace(`/search?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background pb-28">
      <main className="container mx-auto max-w-2xl px-6 pt-6">
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.header.searchPlaceholder}
            className="h-16 w-full rounded-[1.5rem] border-none bg-white pl-14 pr-6 text-base font-bold shadow-sm ring-1 ring-black/[0.03] transition-all focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="-mx-6 mb-10 overflow-hidden">
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-6 py-2 touch-pan-x flex-nowrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={cn(
                  'whitespace-nowrap px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ring-1 active-scale',
                  activeFilter === cat
                    ? 'bg-primary text-foreground ring-primary shadow-lg shadow-primary/20 scale-105'
                    : 'bg-white text-muted-foreground ring-black/[0.03] shadow-sm'
                )}
              >
                {cat === 'Alle' ? (lang === 'no' ? 'Alle' : 'All') : (t.categories as Record<string, string>)[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {!searchQuery && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h3 className="mb-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 px-1">
              {t.search.popularCategories}
            </h3>
            <div className="-mx-6 overflow-hidden">
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-6 py-2 touch-pan-x flex-nowrap">
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
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary/80">
                <MapPin className="h-2.5 w-2.5" />
                <span>{sortBy === 'closest' ? t.search.closest : sortBy === 'newest' ? t.search.newest : sortBy === 'points_asc' ? t.search.pointsLow : t.search.pointsHigh}</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors">
                    {t.search.sortBy}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-none p-2 shadow-2xl bg-white ring-1 ring-black/5">
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
              className="flex h-80 flex-col items-center justify-center rounded-[3.5rem] border-2 border-dashed border-muted bg-white/30 px-8 text-center"
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
                {lang === 'no' ? 'Nullstill filtre' : 'Reset filters'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
