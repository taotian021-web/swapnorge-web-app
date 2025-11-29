'use client';

import Link from 'next/link';
import {
  MapPin,
  Bell,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '../ui/button';

export function Header() {
  const searchParams = useSearchParams();
  const currentLang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(currentLang);

  const getPathWithLang = (path: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('lang', currentLang);
    return `${path}?${params.toString()}`;
  }
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">
            {t.header.neighborhoodName}
          </span>
        </div>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">{t.header.notifications}</span>
           </Button>
        </div>
      </div>
    </header>
  );
}
