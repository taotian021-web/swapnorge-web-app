'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Hand, HardHat, ShoppingBasket } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getTranslations, type Language } from '@/lib/translations';

type PostNeedsSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PostNeedsSheet({ open, onOpenChange }: PostNeedsSheetProps) {
  const searchParams = useSearchParams();
  const currentLang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(currentLang);

  const getPathWithLang = (path: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('lang', currentLang);
    return `${path}?${params.toString()}`;
  };

  const templates = [
    {
      href: getPathWithLang('/post/share-deal'),
      icon: Hand,
      title: t.header.borrowSomething,
      description: '例如：借一个梯子，用一小时',
    },
    {
      href: getPathWithLang('/post/group-buy'),
      icon: HardHat,
      title: t.header.askForHelp,
      description: '例如：谁能帮我临时看一下宠物',
    },
    {
      href: getPathWithLang('/post/recommend-service'),
      icon: ShoppingBasket,
      title: t.header.startGroupBuy,
      description: '例如：一起团购新鲜的草莓',
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-lg">
        <SheetHeader>
          <SheetTitle>{t.header.postOptions}</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {templates.map((template) => (
            <Link
              key={template.href}
              href={template.href}
              className="block rounded-lg border bg-card p-4 transition-all hover:bg-muted/50"
              onClick={() => onOpenChange(false)}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <template.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{template.title}</p>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
