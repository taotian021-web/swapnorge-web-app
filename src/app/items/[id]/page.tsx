'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/supabase';
import { useSupabaseUser } from '@/supabase/hooks';
import type { SwapItem } from '@/lib/types';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  Share2,
  MapPin,
  MessageCircle,
  Star,
  Eye,
  ChevronRight,
  Edit3,
  ShieldAlert,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ItemDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useSupabaseUser();
  const supabase = useSupabase();
  const searchParams = useSearchParams();
  const lang = ((searchParams?.get('lang')) || 'no') as Language;
  const t = getTranslations(lang);
  const translatedCategories = t.categories as Record<string, string> | undefined;

  const [item, setItem] = React.useState<SwapItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [requestMessage, setRequestMessage] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isRequesting, setIsRequesting] = React.useState(false);
  const viewProcessed = React.useRef(false);

  React.useEffect(() => {
    let mounted = true;

    const loadItem = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id as string)
        .single();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error('Error loading item:', error);
        setItem(null);
      } else {
        setItem(data as SwapItem | null);
      }

      setIsLoading(false);
    };

    loadItem();

    return () => {
      mounted = false;
    };
  }, [supabase, id]);

  React.useEffect(() => {
    if (!item || !id || viewProcessed.current) {
      return;
    }

    viewProcessed.current = true;

    const incrementViews = async () => {
      await supabase.from('items').update({ views: (item.views || 0) + 1 }).eq('id', id as string);
    };

    incrementViews().catch(() => {});
  }, [supabase, id, item]);

  const isCoupon = item?.category === 'Kupong';
  const isOfficial = item?.sellerName === 'SwapNorge Official' || item?.category === 'Gave';
  const isOwnItem = user?.id === item?.sellerId;
  const isReserved = item?.status === 'reserved';
  const isSwapped = item?.status === 'swapped';

  const handleShare = async () => {
    const shareData = {
      title: item?.title || 'SwapNorge',
      text: item?.description || 'Se hva jeg fant i nabolaget!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: t.item.shareSuccess });
      }
    } catch (err) {
      console.log('Share failed', err);
    }
  };

  const handleSendRequest = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: lang === 'no' ? 'Logg inn' : 'Please Log In',
        description: lang === 'no' ? 'Du må være logget inn.' : 'You must be logged in.',
      });
      return;
    }

    if (isOwnItem || !item) {
      return;
    }

    setIsRequesting(true);

    try {
      const senderName = user.user_metadata?.full_name || user.email || 'Anonym';
      const requestData = {
        itemId: item.id,
        itemTitle: item.title,
        itemImageUrl: item.imageUrl || `https://picsum.photos/seed/${item.id}/400/400`,
        message: requestMessage,
        points: item.points,
        senderId: user.id,
        senderName,
        receiverId: item.sellerId,
        receiverName: item.sellerName,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('swapRequests').insert(requestData);
      if (error) {
        throw error;
      }

      toast({ title: isCoupon ? (lang === 'no' ? 'Kupong hentet!' : 'Claimed!') : (lang === 'no' ? 'Forespørsel sendt!' : 'Sent!') });
      setIsDialogOpen(false);
      router.push(`/activity?lang=${lang}`);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t.post.errorTitle,
        description: t.post.errorDesc,
      });
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background p-4">
        <Skeleton className="aspect-square w-full rounded-[3rem]" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-black">{t.item.notFound}</h2>
        <Button asChild variant="link"><Link href={`/?lang=${lang}`}>{t.item.back}</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background pb-24">
      <header className="fixed top-0 z-50 flex w-full items-center justify-between p-4 mix-blend-difference">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white" asChild>
          <Link href={`/?lang=${lang}`}><ChevronLeft className="h-6 w-6" /></Link>
        </Button>
        <div className="flex gap-2">
          {isOwnItem && (
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white" asChild>
              <Link href={`/post?lang=${lang}&edit=${item.id}`}><Edit3 className="h-5 w-5" /></Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={item.imageUrl || `https://picsum.photos/seed/${item.id}/1200/1200`}
          alt={item.title}
          fill
          priority
          sizes="100vw"
          className={cn('object-cover', (isReserved || isSwapped) && 'grayscale-[0.4]')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
        {isReserved && <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]"><Badge className="bg-orange-500 text-white px-6 py-3 rounded-2xl">{t.item.reserved}</Badge></div>}
        {isSwapped && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"><Badge className="bg-muted text-foreground px-6 py-3 rounded-2xl">{t.item.swapped}</Badge></div>}
        <div className="absolute bottom-8 left-8 flex flex-col gap-2">
          {isOfficial && <Badge className="bg-foreground text-primary font-black px-4 py-1 text-[10px]">{t.item.official}</Badge>}
          <Badge className="bg-primary px-6 py-2 text-lg font-black text-foreground shadow-2xl">{item.points} pts</Badge>
        </div>
      </div>

      <main className="container mx-auto max-w-2xl px-6 pt-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="rounded-lg border-primary/30 text-primary font-bold">{translatedCategories?.[item.category] || item.category}</Badge>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Eye className="h-3.5 w-3.5" /><span>{item.views || 0}</span></div>
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tighter text-foreground">{item.title}</h1>
          <div className="mt-4 flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /><span>{item.location?.city || 'Oslo'}</span></div>
          </div>
        </div>

        <Link href={`/users/${item.sellerId}?lang=${lang}`}>
          <motion.div whileTap={{ scale: 0.98 }} className={cn('mb-8 rounded-[2.5rem] p-6 shadow-sm ring-1 ring-black/[0.03] border-l-8 cursor-pointer transition-all hover:bg-black/[0.01]', isOfficial ? 'bg-primary/5 border-primary' : 'bg-white border-foreground/5')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-primary ring-offset-2">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${item.sellerId}`} />
                  <AvatarFallback>{item.sellerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-base font-bold">{item.sellerName}</h3>
                  <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /><span className="text-sm font-black">{isOfficial ? '5.0' : item.sellerRating.toFixed(1)}</span></div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground opacity-50" />
            </div>
          </motion.div>
        </Link>

        <div className="mb-10 rounded-[2rem] bg-foreground/5 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-primary" />
            </div>
            <p className="text-[10px] font-bold leading-relaxed text-foreground/60 max-w-[180px]">{t.item.safetyTip}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03] active-scale" onClick={handleShare}>
            <Send className="h-5 w-5 text-primary" />
          </Button>
        </div>

        <div className="mb-12">
          <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-muted-foreground">{t.post.description}</h4>
          <p className="text-lg leading-relaxed text-foreground/80">{item.description}</p>
        </div>

        <div className="mt-12 flex h-20 items-center gap-3 rounded-[2.5rem] bg-foreground/95 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          <Button variant="ghost" className="h-14 w-14 rounded-[1.5rem] bg-white/10 text-white hover:bg-white/20" onClick={() => setIsDialogOpen(true)}>
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isOwnItem || isReserved || isSwapped} className={cn('h-14 flex-1 rounded-[1.5rem] font-black text-base transition-transform active:scale-95', (isOwnItem || isReserved || isSwapped) ? 'bg-muted text-muted-foreground' : 'bg-primary text-foreground shadow-lg')}>
                {isSwapped ? t.item.swapped : isReserved ? t.item.reserved : isCoupon ? t.item.getCoupon : t.item.swapButton}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-none bg-white p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tighter">{t.activity.requestConfirmTitle}</DialogTitle>
                <DialogDescription className="font-medium text-muted-foreground">{t.activity.requestConfirmDesc}</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="rounded-2xl bg-primary/10 p-4 flex gap-3 items-center">
                  <ShieldAlert className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">{t.item.safetyTip}</p>
                </div>
                <Textarea placeholder={t.activity.messagePlaceholder} value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} className="min-h-[100px] rounded-2xl border-none bg-background p-4 shadow-inner ring-1 ring-black/[0.05]" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t.activity.cancel}</Button>
                <Button onClick={handleSendRequest} disabled={isRequesting}>{t.activity.sendRequestButton}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
