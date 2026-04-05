
'use client';

import Link from 'next/link';
import { Home, Search, PlusCircle, Repeat, User } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getTranslations, type Language } from '@/lib/translations';

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
    <div className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background pb-safe">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href.split('?')[0];
          
          if (item.isMain) {
            return (
              <Link
                key={item.href}
                href={getPathWithLang(item.href)}
                className="relative -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg ring-4 ring-background transition-transform active:scale-90"
              >
                <item.icon className="h-8 w-8 text-foreground" />
              </Link>
            );
          }

          return (
            <Link
              href={getPathWithLang(item.href)}
              key={item.href}
              className="flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <item.icon
                className={cn('h-5 w-5', {
                  'text-primary': isActive,
                  'text-muted-foreground': !isActive,
                })}
              />
              <span
                className={cn('text-[10px]', {
                  'text-primary font-bold': isActive,
                  'text-muted-foreground': !isActive,
                })}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
