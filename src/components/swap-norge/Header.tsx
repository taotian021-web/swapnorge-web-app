
'use client';

import * as React from 'react';
import { Search, Bell, MapPin, ChevronDown, Zap, Languages } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
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
  const [searchValue, setSearchValue] = React.useState('');

  // User Profile for Points
  const userRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile } = useDoc<UserProfile>(userRef);

  // Notifications: Count pending received requests
  const pendingRequestsQuery = useMemoFirebase(
    () => (user && firestore ? query(
      collection(firestore, 'swapRequests'), 
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    ) : null),
    [user, firestore]
  );
  const { data: pendingRequests } = useCollection(pendingRequestsQuery);
  const notificationCount = pendingRequests?.length || 0;

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
  
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto max-w-2xl px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col cursor-pointer"
            onClick={() => router.push(`/?lang=${currentLang}`)}
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleLanguage}
              className="h-10 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.02] px-3 font-bold text-[10px] uppercase tracking-widest"
            >
              <Languages className="mr-1.5 h-3.5 w-3.5 text-primary" />
              {currentLang === 'no' ? 'EN' : 'NO'}
            </Button>

            <AnimatePresence>
              {user && profile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => router.push(`/profile?lang=${currentLang}`)}
                >
                  <Badge variant="outline" className="h-10 cursor-pointer rounded-2xl border-primary/20 bg-white px-3 font-black text-primary shadow-sm ring-1 ring-black/[0.02] hover:bg-primary/5">
                    <Zap className="mr-1.5 h-3.5 w-3.5 fill-current" />
                    {profile.stats?.points || 0}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button 
              variant="secondary" 
              size="icon" 
              className="relative h-10 w-10 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.02] hover:bg-primary"
              onClick={() => router.push(`/activity?lang=${currentLang}`)}
            >
              <Bell className="h-5 w-5" />
              <AnimatePresence>
                {notificationCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white"
                  >
                    {notificationCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
        
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSearch}
          className="relative group"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-12 w-full rounded-2xl border-none bg-white pl-11 pr-4 text-sm shadow-sm ring-1 ring-black/[0.05] transition-all focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder={t.header.searchPlaceholder}
          />
        </motion.form>
      </div>
    </header>
  );
}
