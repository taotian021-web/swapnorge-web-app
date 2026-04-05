
'use client';

import { Search, Bell, MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header() {
  const searchParams = useSearchParams();
  const currentLang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(currentLang);
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-primary py-3">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              SwapNorge
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full bg-background/20 hover:bg-background/40">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            className="h-10 w-full rounded-full border-none bg-background pl-10 pr-4 shadow-sm"
            placeholder={t.header.searchPlaceholder}
          />
        </div>
      </div>
    </header>
  );
}
