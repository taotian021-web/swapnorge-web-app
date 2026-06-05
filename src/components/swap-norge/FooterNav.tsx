'use client';

import Link from 'next/link';
import { Home, Search, PlusCircle, Repeat, User } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getTranslations, type Language } from '@/lib/translations';
import { motion } from 'framer-motion';

export function FooterNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(currentLang);

  const getPathWithLang = (path: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('lang', currentLang);
    return `${path}?${params.toString()}`;
  };

  const navItems = [
    { href: '/', label: t.footer.home, icon: Home },
    { href: '/search', label: t.footer.search, icon: Search },
    { href: '/post', label: t.footer.post, icon: PlusCircle, isMain: true },
    { href: '/activity', label: t.footer.activity, icon: Repeat },
    { href: '/profile', label: t.footer.profile, icon: User },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 z-[100] w-full max-w-md -translate-x-1/2 px-4 pointer-events-none">
      <div className="rounded-[2.5rem] overflow-hidden">
        <nav className="flex h-20 items-center justify-around bg-foreground/95 px-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href.split('?')[0];
          
          if (item.isMain) {
            return (
              <motion.div key={item.href} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="flex items-center justify-center overflow-hidden">
                <Link
                  href={getPathWithLang(item.href)}
                  className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-primary shadow-md transition-transform"
                >
                  <item.icon className="h-8 w-8 text-foreground stroke-[2.5]" />
                </Link>
              </motion.div>
            );
          }

          return (
            <Link
              href={getPathWithLang(item.href)}
              key={item.href}
              className="group flex flex-col items-center justify-center gap-1.5 transition-all"
            >
              <item.icon
                className={cn('h-6 w-6 transition-all duration-300', {
                  'text-primary scale-110': isActive,
                  'text-muted-foreground/60 group-hover:text-white': !isActive,
                })}
              />
              <span
                className={cn('text-[9px] font-black uppercase tracking-tighter transition-all', {
                  'text-primary': isActive,
                  'text-muted-foreground/40 group-hover:text-white/60': !isActive,
                })}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="nav-dot"
                  className="h-1 w-1 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>
      </div>
    </div>
  );
}
