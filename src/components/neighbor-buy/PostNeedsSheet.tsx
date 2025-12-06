'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Megaphone, MessageSquareQuestion, ShoppingBag } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
      icon: Megaphone,
      title: t.header.shareNews,
      description: t.header.shareNewsDesc,
    },
    {
      href: getPathWithLang('/post/group-buy'),
      icon: MessageSquareQuestion,
      title: t.header.askForHelp,
      description: t.header.askForHelpDesc,
    },
    {
      href: getPathWithLang('/post/recommend-service'),
      icon: ShoppingBag,
      title: t.header.postForSale,
      description: t.header.postForSaleDesc,
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
