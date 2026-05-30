'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSupabase } from '@/supabase';
import { useSupabaseUser, useSupabaseProfile } from '@/supabase/hooks';
import type { UserProfile } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const { toast } = useToast();
  const supabase = useSupabase();
  const { user } = useSupabaseUser();
  const { profile } = useSupabaseProfile(user?.id ?? null);

  const linkedRequestId = searchParams.get('requestId');
  const linkedItemId = searchParams.get('itemId');
  const linkedAmount = parseInt(searchParams.get('amount') || '250');
  const linkedReceiverId = searchParams.get('receiverId');
  const linkedReceiverName =
    searchParams.get('receiverName') || (lang === 'no' ? 'Selger' : 'Seller');

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isScanned, setIsScanned] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [reviewText, setReviewText] = React.useState('');
  const [sellerProfile, setSellerProfile] = React.useState<UserProfile | null>(null);

  const currentPoints = profile?.stats?.points || 0;
  const hasEnoughPoints = currentPoints >= linkedAmount;

  React.useEffect(() => {
    const current = videoRef.current;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (current) current.srcObject = stream;
      } catch {
      }
    };

    getCameraPermission();

    return () => {
      if (current?.srcObject) {
        (current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  React.useEffect(() => {
    if (!supabase || !linkedReceiverId) {
      setSellerProfile(null);
      return;
    }

    const loadSellerProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', linkedReceiverId)
        .single();

      if (!error) {
        setSellerProfile(data ?? null);
      }
    };

    loadSellerProfile();
  }, [supabase, linkedReceiverId]);

  const handleSimulateScan = () => {
    setIsScanned(true);
    toast({ title: t.scan.qrDetected });
  };

  const handleConfirmTransfer = async () => {
    if (!user || !supabase || !profile || !hasEnoughPoints) return;
    setIsProcessing(true);

    try {
      const buyerStats = profile.stats || { points: 100, reputation: 5.0, completedSwaps: 0, memberSince: '' };
      const updatedBuyerStats = {
        ...buyerStats,
        points: (buyerStats.points || 0) - linkedAmount,
        completedSwaps: (buyerStats.completedSwaps || 0) + 1,
        reputation: Number(((buyerStats.reputation || 0) + 0.01).toFixed(2)),
      };

      const requests: Array<unknown> = [
        supabase.from('profiles').update({ stats: updatedBuyerStats }).eq('id', user.id),
      ];

      if (linkedReceiverId && sellerProfile) {
        const sellerStats =
          sellerProfile.stats || { points: 0, reputation: 5.0, completedSwaps: 0, memberSince: '' };
        const updatedSellerStats = {
          ...sellerStats,
          points: (sellerStats.points || 0) + linkedAmount,
          completedSwaps: (sellerStats.completedSwaps || 0) + 1,
          reputation: Number(((sellerStats.reputation || 0) + 0.02).toFixed(2)),
        };
        requests.push(
          supabase
            .from('profiles')
            .update({ stats: updatedSellerStats })
            .eq('id', linkedReceiverId)
        );
      }

      const transactionRows: Array<Record<string, unknown>> = [
        {
          userId: user.id,
          type: 'payment',
          amount: -linkedAmount,
          targetId: linkedReceiverId || undefined,
          targetName: linkedReceiverName,
          itemId: linkedItemId || undefined,
          itemTitle: searchParams.get('itemTitle') || 'Item',
          createdAt: new Date().toISOString(),
        },
      ];

      if (linkedReceiverId) {
        transactionRows.push({
          userId: linkedReceiverId,
          type: 'received',
          amount: linkedAmount,
          targetId: user.id,
          targetName: user.user_metadata?.full_name || user.email || 'Neighbor',
          itemId: linkedItemId || undefined,
          itemTitle: searchParams.get('itemTitle') || 'Item',
          createdAt: new Date().toISOString(),
        });
      }

      requests.push(
        supabase.from('transactions').insert(transactionRows)
      );

      if (linkedRequestId) {
        requests.push(
          supabase
            .from('swapRequests')
            .update({ status: 'completed' })
            .eq('id', linkedRequestId)
        );
      }

      if (linkedItemId) {
        requests.push(
          supabase
            .from('items')
            .update({ status: 'swapped' })
            .eq('id', linkedItemId)
        );
      }

      for (const request of requests) {
        const res = (await request) as { error?: unknown };
        if (res.error) {
          throw res.error;
        }
      }

      setIsCompleted(true);
    } catch (error) {
      console.error('Supabase transfer error:', error);
      setIsProcessing(false);
      toast({ title: t.scan.transferFailed, variant: 'destructive' });
    }
  };

  const handleSubmitReview = async () => {
    if (!supabase || !user || !linkedReceiverId || !linkedRequestId) return;

    try {
      await supabase.from('reviews').insert([
        {
          fromId: user.id,
          fromName: user.user_metadata?.full_name || user.email || 'Anonym',
          toId: linkedReceiverId,
          requestId: linkedRequestId,
          content: reviewText || 'Kjempefint bytte!',
          rating: 5,
          createdAt: new Date().toISOString(),
        },
      ]);
      toast({ title: t.scan.success });
      router.push(`/profile?lang=${lang}`);
    } catch (error) {
      console.error('Supabase review error:', error);
      router.push(`/profile?lang=${lang}`);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-black">
      <header className="absolute top-0 z-50 flex w-full items-center justify-between p-6 mix-blend-difference">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white active-scale"
          asChild
        >
          <Link href={linkedRequestId ? `/activity?lang=${lang}` : `/profile?lang=${lang}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{t.scan.title}</h1>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white">
          <Zap className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover grayscale-[0.2] contrast-125" autoPlay muted playsInline />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative h-72 w-72">
            <div className="absolute -top-1 -left-1 h-12 w-12 border-t-4 border-l-4 border-primary rounded-tl-[2rem]" />
            <div className="absolute -top-1 -right-1 h-12 w-12 border-t-4 border-r-4 border-primary rounded-tr-[2rem]" />
            <div className="absolute -bottom-1 -left-1 h-12 w-12 border-b-4 border-l-4 border-primary rounded-bl-[2rem]" />
            <div className="absolute -bottom-1 -right-1 h-12 w-12 border-b-4 border-r-4 border-primary rounded-br-[2rem]" />
            <motion.div
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 h-0.5 w-full bg-primary/40 shadow-[0_0_20px_rgba(243,197,0,0.8)]"
            />
          </div>
        </div>

        <div className="absolute bottom-16 flex w-full justify-center gap-10 px-8">
          <Button
            variant="ghost"
            className="flex-col gap-2 text-white/40 hover:text-white transition-all active-scale"
            onClick={handleSimulateScan}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl ring-1 ring-white/10">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{t.scan.testScan}</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-2 text-white/40 hover:text-white transition-all active-scale">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl ring-1 ring-white/10">
              <ImageIcon className="h-7 w-7" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{t.scan.gallery}</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isScanned && !isCompleted && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 z-[100] w-full rounded-t-[3.5rem] bg-white p-10 shadow-[0_-20px_50px_rgba(0,0,0,0.2)]"
          >
            <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-muted/40" />
            <h2 className="text-center text-3xl font-black italic tracking-tighter mb-10">{t.scan.confirmTransfer}</h2>

            <div className="space-y-8">
              <div className="flex items-center gap-5 rounded-[2.5rem] bg-muted/30 p-5 ring-1 ring-black/[0.03]">
                <div className="h-16 w-16 rounded-[1.2rem] bg-primary flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
                  {linkedReceiverName.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">
                    {t.scan.transferTo}
                  </p>
                  <p className="text-xl font-black">{linkedReceiverName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between px-4">
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground opacity-40">
                  {t.scan.amount}
                </p>
                <div className="flex flex-col items-end">
                  <div className="flex items-baseline gap-1">
                    <p className="text-5xl font-black italic tracking-tighter text-primary">{linkedAmount}</p>
                    <span className="text-xs font-black text-foreground/30 uppercase">pts</span>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1">
                    {t.scan.balanceAfter}{' '}
                    <span className="text-foreground">{currentPoints - linkedAmount} pts</span>
                  </p>
                </div>
              </div>

              {!hasEnoughPoints && (
                <div className="rounded-2xl bg-destructive/5 p-4 flex gap-3 items-center ring-1 ring-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  <p className="text-xs font-black uppercase tracking-widest text-destructive">
                    {t.scan.insufficientFunds}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-primary/5 p-4 flex gap-3 items-center ring-1 ring-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <p className="text-[10px] font-bold leading-relaxed text-foreground/60">
                  {t.scan.safetyWarning}
                </p>
              </div>

              <Button
                onClick={handleConfirmTransfer}
                disabled={isProcessing || !hasEnoughPoints}
                className="h-16 w-full rounded-[1.5rem] bg-foreground text-primary font-black text-base shadow-2xl active-scale disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : t.scan.sendButton}
              </Button>
            </div>
          </motion.div>
        )}

        {isCompleted && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 z-[110] flex items-center justify-center bg-background p-8"
          >
            <div className="w-full max-w-sm text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-green-500 text-white shadow-2xl shadow-green-500/20"
              >
                <CheckCircle2 className="h-12 w-12" />
              </motion.div>
              <h2 className="text-3xl font-black italic tracking-tighter mb-4">{t.scan.leaveReviewTitle}</h2>
              <p className="mb-8 text-sm font-medium text-muted-foreground leading-relaxed px-4">
                {t.scan.leaveReviewDesc}
              </p>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={t.scan.reviewPlaceholder}
                className="min-h-[140px] rounded-[2rem] border-none bg-muted px-4 py-4 text-sm font-medium text-foreground"
              />
              <Button
                onClick={handleSubmitReview}
                className="mt-6 h-16 w-full rounded-[1.5rem] bg-primary text-foreground font-black text-base shadow-2xl active-scale"
              >
                {t.scan.submitReview}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
