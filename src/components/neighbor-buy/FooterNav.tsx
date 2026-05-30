'use client';

import Link from 'next/link';
import { Home, PlusCircle, User } from 'lucide-react';
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
  const t = getTranslations(currentLang) as unknown as { footerNav?: { home: string; post: string; me: string } };
  const [isSheetOpen, setSheetOpen] = useState(false);

  const getPathWithLang = (path: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('lang', currentLang);
    return `${path}?${params.toString()}`;
  };

  const navItems = [
    { href: '/', label: t.footerNav?.home ?? 'Home', icon: Home },
    { href: '#post', label: t.footerNav?.post ?? 'Post', icon: PlusCircle, isAction: true },
    { href: '/profile', label: t.footerNav?.me ?? 'Me', icon: User },
  ];

  return (
    <>
      <PostNeedsSheet open={isSheetOpen} onOpenChange={setSheetOpen} />
      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-card">
        <div className="mx-auto grid h-16 max-w-lg grid-cols-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href.split('?')[0];
            if (item.isAction) {
              return (
                <div key={item.href} className="flex items-center justify-center">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-16 w-16"
                        onClick={() => setSheetOpen(true)}
                    >
                        <item.icon className="h-8 w-8 text-primary" />
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
