
'use client';

import * as React from 'react';
import { Search, Bell, MapPin, ChevronDown } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export function Header() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const currentLang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(currentLang);
  const [searchValue, setSearchValue] = React.useState('');

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
            <Button 
              variant="secondary" 
              size="icon" 
              className="relative rounded-2xl bg-white shadow-sm hover:bg-primary"
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
