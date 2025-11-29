'use client';

import Link from 'next/link';
import {
  ShoppingBag,
  User,
  Plus,
  Hand,
  ShoppingBasket,
  Lightbulb,
  Globe,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { usePathname, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentLang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(currentLang);

  const handleSignOut = () => {
    if (auth) {
      signOut(auth);
    }
  };
  
  const createPathWithLang = (path: string, lang: Language) => {
    const params = new URLSearchParams(searchParams);
    params.set('lang', lang);
    return `${pathname}?${params.toString()}`;
  }

  const getPathWithLang = (path: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('lang', currentLang);
    return `${path}?${params.toString()}`;
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href={getPathWithLang('/')} className="flex items-center gap-2">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-bold tracking-tight text-foreground">
            NeighborBuy
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-5 w-5" />
                {t.header.post}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>{t.header.postOptions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={getPathWithLang('/post/share-deal')}>
                <DropdownMenuItem>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  <span>{t.header.borrowSomething}</span>
                </DropdownMenuItem>
              </Link>
              <Link href={getPathWithLang('/post/group-buy')}>
                <DropdownMenuItem>
                  <Hand className="mr-2 h-4 w-4" />
                  <span>{t.header.askForHelp}</span>
                </DropdownMenuItem>
              </Link>
               <Link href={getPathWithLang('/post/recommend-service')}>
                <DropdownMenuItem>
                  <ShoppingBasket className="mr-2 h-4 w-4" />
                  <span>{t.header.startGroupBuy}</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Globe className="h-5 w-5" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={createPathWithLang(pathname, 'en')}>
                <DropdownMenuItem>
                  <span>{t.header.english}</span>
                </DropdownMenuItem>
              </Link>
              <Link href={createPathWithLang(pathname, 'no')}>
                <DropdownMenuItem>
                  <span>{t.header.norwegian}</span>
                </DropdownMenuItem>
              </Link>
              <Link href={createPathWithLang(pathname, 'cn')}>
                <DropdownMenuItem>
                  <span>{t.header.chinese}</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  {user && !isUserLoading ? (
                     <AvatarImage src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="User" />
                  ) : (
                    <AvatarImage src="https://i.pravatar.cc/150?u=placeholder" alt="User" />
                  )}
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {isUserLoading ? (
                    <p className="text-sm">{t.header.loading}</p>
                  ) : user ? (
                    <>
                      <p className="text-sm font-medium leading-none">{user.isAnonymous ? t.header.anonymous : user.displayName || t.header.user}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email || `${t.header.userIdPrefix}: ${user.uid.substring(0,8)}...`}</p>
                    </>
                  ) : (
                    <p className="text-sm">{t.header.notLoggedIn}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={getPathWithLang('/profile')}>
                <DropdownMenuItem>{t.header.myListings}</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>{t.header.logOut}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
