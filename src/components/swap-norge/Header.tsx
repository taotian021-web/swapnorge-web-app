
'use client';

import * as React from 'react';
import { Search, Bell, MapPin, ChevronDown, Zap, Languages, ChevronLeft } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const currentLang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(currentLang);
  const [searchValue, setSearchValue] = React.useState('');

  const isHome = pathname === '/' || (pathname === '/search' && !searchParams.get('q'));
  const showSearchBar = pathname === '/';

  // 动态获取页面标题
  const getPageTitle = () => {
    if (pathname === '/profile') return t.footer.profile;
    if (pathname === '/activity') return t.footer.activity;
    if (pathname === '/post') return t.post.title;
    if (pathname === '/search') return t.footer.search;
    if (pathname === '/scan') return t.scan.title;
    if (pathname.startsWith('/items/')) return ''; // 详情页保持简洁
    if (pathname.startsWith('/users/')) return t.profile.neighborShop;
    return '';
  };

  const pageTitle = getPageTitle();

  const userRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile } = useDoc<UserProfile>(userRef);

  const notificationCount = 0; // 简化处理

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}&lang=${currentLang}`);
    }
  };

  const toggleLanguage = () => {
    const nextLang = currentLang === 'no' ? 'en' : 'no';
    const params = new URLSearchParams(searchParams);
    params.set('lang', nextLang);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleBack = () => {
    router.back();
  };
  
  return (
    <header className={cn("sticky top-0 z-[60] w-full glass transition-all", !showSearchBar && "pb-2")}>
      <div className="container mx-auto max-w-2xl px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {!isHome && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="h-10 w-10 rounded-2xl bg-primary text-foreground shadow-[0_4px_20px_rgba(243,197,0,0.3)] ring-1 ring-black/[0.03] active-scale"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div 
              className="flex flex-col cursor-pointer active-scale"
              onClick={() => router.push(`/?lang=${currentLang}`)}
            >
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                <MapPin className="h-3 w-3 text-primary" />
                <span>Oslo, Norge</span>
                <ChevronDown className="h-2 w-2" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <h1 className="text-xl font-black italic tracking-tighter text-foreground leading-none">
                  Swap<span className="text-primary">Norge</span>
                </h1>
                {pageTitle && (
                  <>
                    <div className="h-4 w-[1px] bg-black/10 mx-1" />
                    <span className="text-sm font-bold tracking-tight text-muted-foreground">{pageTitle}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleLanguage}
              className="h-10 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03] px-3 font-bold text-[10px] uppercase tracking-widest active-scale border-none"
            >
              <Languages className="mr-1.5 h-3.5 w-3.5 text-primary" />
              {currentLang === 'no' ? 'EN' : 'NO'}
            </Button>

            {user && profile && (
              <Badge 
                onClick={() => router.push(`/profile?lang=${currentLang}`)}
                className="h-10 cursor-pointer rounded-2xl bg-white border-none px-3 font-black text-primary shadow-sm ring-1 ring-black/[0.03] active-scale"
              >
                <Zap className="mr-1 h-3 w-3 fill-current" />
                {profile.stats?.points || 0}
              </Badge>
            )}
          </div>
        </div>
        
        {showSearchBar && (
          <form onSubmit={handleSearch} className="relative group mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-12 w-full rounded-[1.2rem] border-none bg-white/80 pl-11 pr-4 text-sm shadow-sm ring-1 ring-black/[0.05] transition-all focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none"
              placeholder={t.header.searchPlaceholder}
            />
          </form>
        )}
      </div>
    </header>
  );
}
