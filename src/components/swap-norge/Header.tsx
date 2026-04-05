
'use client';

import * as React from 'react';
import { Search, Bell, MapPin, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function Header() {
  const searchParams = useSearchParams();
  const currentLang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(currentLang);
  
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto max-w-2xl px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              <span>Oslo, Norge</span>
              <ChevronDown className="h-3 w-3" />
            </div>
            <h1 className="text-2xl font-black italic tracking-tighter text-foreground">
              Swap<span className="text-primary">Norge</span>
            </h1>
          </motion.div>
          
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" className="rounded-2xl bg-white shadow-sm hover:bg-primary">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input 
            className="h-12 w-full rounded-2xl border-none bg-white pl-11 pr-4 text-sm shadow-sm ring-1 ring-black/[0.05] transition-all focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder={t.header.searchPlaceholder}
          />
        </motion.div>
      </div>
    </header>
  );
}
