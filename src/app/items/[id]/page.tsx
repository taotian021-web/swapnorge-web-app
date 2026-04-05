
'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, updateDoc, increment } from 'firebase/firestore';
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
  ShieldCheck, 
  MessageCircle, 
  ArrowRightLeft,
  Star,
  Clock,
  Ticket,
  AlertCircle,
  Gem,
  Eye,
  ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);

  const [requestMessage, setRequestMessage] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const viewProcessed = React.useRef(false);

  const itemRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'items', id as string) : null),
    [firestore, id]
  );
  const { data: item, isLoading } = useDoc<SwapItem>(itemRef);

  // Increment view count on mount
  React.useEffect(() => {
    if (firestore && id && !viewProcessed.current) {
      viewProcessed.current = true;
      const ref = doc(firestore, 'items', id as string);
      updateDoc(ref, { views: increment(1) }).catch(e => console.log("View count error", e));
    }
  }, [firestore, id]);

  const isCoupon = item?.category === 'Kupong';
  const isOfficial = item?.sellerName === 'SwapNorge Official' || item?.category === 'Gave';
  const isOwnItem = user?.uid === item?.sellerId;
  const isReserved = item?.status === 'reserved';
  const isSwapped = item?.status === 'swapped';

  const handleSendRequest = async () => {
    if (!user) {
      toast({
        title: lang === 'no' ? 'Logg inn' : 'Please Log In',
        description: lang === 'no' ? 'Du må være logget inn for å bytte.' : 'You must be logged in to swap.',
      });
      return;
    }

    if (isOwnItem) {
      toast({
        variant: 'destructive',
        title: lang === 'no' ? 'Oops!' : 'Wait!',
        description: lang === 'no' ? 'Du kan ikke bytte med deg selv.' : 'You cannot swap with yourself.',
      });
      return;
    }

    if (!item || !firestore) return;

    try {
      const requestData = {
        itemId: item.id,
        itemTitle: item.title,
        itemImageUrl: item.imageUrl || `https://picsum.photos/seed/${item.id}/400/400`,
        message: requestMessage,
        points: item.points,
        senderId: user.uid,
        senderName: user.displayName || 'Anonym',
        receiverId: item.sellerId,
        receiverName: item.sellerName, // Persisted for scan clarity
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(firestore, 'swapRequests'), requestData);

      toast({
        title: isCoupon ? (lang === 'no' ? 'Kupong hentet!' : 'Coupon claimed!') : (lang === 'no' ? 'Forespørsel sendt!' : 'Request Sent!'),
        description: lang === 'no' ? 'Gå til din aktivitet for å se detaljer.' : 'Go to your activity to see details.',
      });
      
      setIsDialogOpen(false);
      router.push(`/activity?lang=${lang}`);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: 'Noe gikk galt. Prøv igjen senere.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background p-4">
        <Skeleton className="aspect-square w-full rounded-[3rem]" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-black">{lang === 'no' ? 'Fant ikke gjenstanden' : 'Item not found'}</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href={`/?lang=${lang}`}>{lang === 'no' ? 'Gå tilbake' : 'Go back'}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background pb-32">
      <header className="fixed top-0 z-50 flex w-full items-center justify-between p-4 mix-blend-difference">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white" asChild>
          <Link href={`/?lang=${lang}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white">
          <Share2 className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={item.imageUrl || `https://picsum.photos/seed/${item.id}/1200/1200`}
          alt={item.title}
          fill
          className={cn("object-cover", (isReserved || isSwapped) && "grayscale-[0.4]")}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
        
        {isReserved && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
             <Badge className="bg-orange-500 text-white font-black px-6 py-3 text-sm uppercase tracking-widest rounded-2xl shadow-2xl">
               {t.item.reserved}
             </Badge>
          </div>
        )}
        {isSwapped && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
             <Badge className="bg-muted text-foreground font-black px-6 py-3 text-sm uppercase tracking-widest rounded-2xl shadow-2xl">
               {t.item.swapped}
             </Badge>
          </div>
        )}

        <div className="absolute bottom-8 left-8 flex flex-col gap-2">
          {isOfficial && (
            <Badge className="w-fit bg-foreground text-primary font-black px-4 py-1 uppercase tracking-widest text-[10px]">
              {t.item.official}
            </Badge>
          )}
          <Badge className="bg-primary px-6 py-2 text-lg font-black text-foreground shadow-2xl">
            {item.points} {t.item.points}
          </Badge>
        </div>
      </div>

      <main className="container mx-auto max-w-2xl px-6 pt-10">
        {isOwnItem && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-primary/10 p-4 text-primary-foreground/80 ring-1 ring-primary/20">
            <AlertCircle className="h-5 w-5 text-primary" />
            <p className="text-xs font-bold">{lang === 'no' ? 'Dette er din egen gjenstand' : 'This is your own item'}</p>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-lg border-primary/30 text-primary font-bold">
                {(t.categories as any)[item.category] || item.category}
              </Badge>
              {item.condition && (
                  <Badge variant="secondary" className="rounded-lg bg-muted font-bold text-muted-foreground">
                    {(t.conditions as any)[item.condition]}
                  </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              <span>{item.views || 0} {lang === 'no' ? 'visninger' : 'views'}</span>
            </div>
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tighter text-foreground">
            {item.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{item.location.city || 'Oslo'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span>{new Date(item.postedDate).toLocaleDateString(lang === 'no' ? 'no-NO' : 'en-US')}</span>
            </div>
          </div>
        </div>

        <Link href={`/users/${item.sellerId}?lang=${lang}`}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            viewport={{ once: true }}
            className={cn(
              "mb-10 rounded-[2.5rem] p-6 shadow-sm ring-1 ring-black/[0.03] border-l-8 cursor-pointer transition-all hover:bg-black/[0.01]",
              isOfficial ? "bg-primary/5 border-primary" : "bg-white border-foreground/5"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-primary ring-offset-2">
                  <AvatarImage src={isOfficial ? "/favicon.ico" : `https://i.pravatar.cc/150?u=${item.sellerId}`} />
                  <AvatarFallback>{item.sellerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                     <h3 className="text-base font-bold">{item.sellerName}</h3>
                     {isOfficial && <Gem className="h-3.5 w-3.5 text-primary fill-primary" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-sm font-black">{isOfficial ? "5.0" : item.sellerRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {isOfficial ? (lang === 'no' ? 'Verifisert partner' : 'Verified Partner') : (lang === 'no' ? 'Se nabolagsbutikk' : 'View Shop')}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground opacity-50" />
            </div>
          </motion.div>
        </Link>

        <div className="mb-12">
          <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-muted-foreground">
            {t.post.description}
          </h4>
          <p className="text-lg leading-relaxed text-foreground/80">
            {item.description}
          </p>
        </div>
      </main>

      <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
        <div className="flex h-20 items-center gap-3 rounded-[2.5rem] bg-foreground/95 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          <Button 
            variant="ghost" 
            className="h-14 w-14 rounded-[1.5rem] bg-white/10 text-white hover:bg-white/20"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={isOwnItem || isReserved || isSwapped}
                className={cn(
                  "h-14 flex-1 rounded-[1.5rem] font-black text-base transition-transform active:scale-95",
                  (isOwnItem || isReserved || isSwapped) ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-foreground shadow-[0_0_30px_-5px_rgba(243,197,0,0.5)]"
                )}
              >
                {isSwapped ? (
                   t.item.swapped
                ) : isReserved ? (
                   t.item.reserved
                ) : isCoupon ? (
                  <>
                    <Ticket className="mr-2 h-5 w-5 stroke-[3]" />
                    {t.item.getCoupon}
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="mr-2 h-5 w-5 stroke-[3]" />
                    {t.item.swapButton}
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-none bg-white p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tighter">{t.activity.requestConfirmTitle}</DialogTitle>
                <DialogDescription className="font-medium text-muted-foreground">
                  {t.activity.requestConfirmDesc}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea 
                  placeholder={t.activity.messagePlaceholder}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="min-h-[120px] rounded-2xl border-none bg-background p-4 shadow-inner ring-1 ring-black/[0.05] focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSendRequest}
                  className="h-14 w-full rounded-2xl bg-primary text-foreground font-black shadow-xl"
                >
                  {isCoupon ? t.item.getCoupon : t.item.swapButton}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
