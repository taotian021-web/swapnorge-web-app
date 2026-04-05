'use client';

import * as React from 'react';
import { Languages, ChevronLeft, MapPin, Zap } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from '@/lib/types';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const currentLang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(currentLang);

  const isHome = pathname === '/';

  const getPageTitle = () => {
    if (pathname === '/profile') return t.footer.profile;
    if (pathname === '/activity') return t.footer.activity;
    if (pathname === '/post') return t.post.title;
    if (pathname === '/search') return t.footer.search;
    if (pathname === '/scan') return t.scan.title;
    if (pathname.startsWith('/users/')) return t.profile.neighborShop;
    if (pathname.startsWith('/items/')) return 'Detaljer';
    return '';
  };

  const pageTitle = getPageTitle();

  const userRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile } = useDoc<UserProfile>(userRef);

  const toggleLanguage = () => {
    const nextLang = currentLang === 'no' ? 'en' : 'no';
    const params = new URLSearchParams(searchParams);
    params.set('lang', nextLang);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-[60] w-full glass">
      <div className="container mx-auto max-w-2xl px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isHome ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="h-11 w-11 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03] active-scale"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            ) : null}
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                <MapPin className="h-3 w-3 text-primary" />
                <span>Oslo, Norge</span>
              </div>
              <div className="flex items-center gap-2.5 mt-1">
                {isHome ? (
                  <h1 className="text-2xl font-black italic tracking-tighter text-foreground leading-none">
                    Swap<span className="text-primary">Norge</span>
                  </h1>
                ) : (
                  <span className="text-lg font-black tracking-tight text-foreground">{pageTitle}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleLanguage}
              className="h-11 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03] px-4 font-black text-[10px] uppercase tracking-[0.1em] active-scale border-none"
            >
              <Languages className="mr-2 h-3.5 w-3.5 text-primary" />
              {currentLang.toUpperCase()}
            </Button>

            {user && profile && (
              <Badge 
                onClick={() => router.push(`/profile?lang=${currentLang}`)}
                className="h-11 cursor-pointer rounded-2xl bg-foreground border-none px-4 font-black text-primary shadow-xl ring-1 ring-white/10 active-scale"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5 fill-current" />
                {profile.stats?.points || 0}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
