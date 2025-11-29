'use client';

import Link from 'next/link';
import { Home, Map, PlusCircle, LayoutGrid, User } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '../ui/button';
import { PostNeedsSheet } from './PostNeedsSheet';
import { useState } from 'react';

export function FooterNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(currentLang);
  const [isSheetOpen, setSheetOpen] = useState(false);

  const getPathWithLang = (path: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('lang', currentLang);
    return `${path}?${params.toString()}`;
  };

  const navItems = [
    { href: '/', label: t.footerNav.home, icon: Home },
    { href: '/map', label: t.footerNav.map, icon: Map },
    { href: '#post', label: t.footerNav.post, icon: PlusCircle, isAction: true },
    { href: '/activity', label: t.footerNav.activity, icon: LayoutGrid },
    { href: '/profile', label: t.footerNav.me, icon: User },
  ];

  return (
    <>
      <PostNeedsSheet open={isSheetOpen} onOpenChange={setSheetOpen} />
      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-card">
        <div className="grid h-16 grid-cols-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href.split('?')[0];
            if (item.isAction) {
              return (
                <div key={item.href} className="flex flex-col items-center justify-center">
                    <Button 
                        variant="ghost" 
                        className="flex h-14 w-14 -translate-y-4 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                        onClick={() => setSheetOpen(true)}
                    >
                        <item.icon className="h-8 w-8" />
                    </Button>
                </div>
              );
            }
            return (
              <Link href={getPathWithLang(item.href)} key={item.href} className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50">
                <item.icon
                  className={cn('mb-1 h-6 w-6 text-muted-foreground', {
                    'text-primary': isActive,
                  })}
                />
                <span
                  className={cn('text-xs text-muted-foreground', {
                    'text-primary font-semibold': isActive,
                  })}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
