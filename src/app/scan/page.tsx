
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, Image as ImageIcon, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, increment, writeBatch, collection, addDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile } from '@/lib/types';

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const linkedRequestId = searchParams.get('requestId');
  const linkedItemId = searchParams.get('itemId');
  const linkedAmount = parseInt(searchParams.get('amount') || '250');
  const linkedReceiverId = searchParams.get('receiverId');
  const linkedReceiverName = searchParams.get('receiverName') || (lang === 'no' ? 'Selger' : 'Seller');

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [isScanned, setIsScanned] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [reviewText, setReviewText] = React.useState('');
  
  const [qrGrid, setQrGrid] = React.useState<boolean[]>([]);

  const userRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile } = useDoc<UserProfile>(userRef);

  React.useEffect(() => {
    setQrGrid(Array.from({ length: 25 }, () => Math.random() > 0.4));

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSimulateScan = () => {
    setIsScanned(true);
    toast({ title: lang === 'no' ? 'QR-kode funnet!' : 'QR code detected!' });
  };

  const handleConfirmTransfer = async () => {
    if (!user || !firestore || !profile) return;
    setIsProcessing(true);

    if (profile.stats.points < linkedAmount) {
      toast({ variant: 'destructive', title: t.scan.cameraError, description: lang === 'no' ? 'Ikke nok poeng.' : 'Insufficient points.' });
      setIsProcessing(false);
      setIsScanned(false);
      return;
    }

    try {
      const batch = writeBatch(firestore);
      const buyerRef = doc(firestore, 'users', user.uid);
      batch.update(buyerRef, { 
        'stats.points': increment(-linkedAmount),
        'stats.completedSwaps': increment(1),
        'stats.reputation': increment(0.01)
      });

      if (linkedReceiverId) {
        const sellerRef = doc(firestore, 'users', linkedReceiverId);
        batch.update(sellerRef, { 
          'stats.points': increment(linkedAmount),
          'stats.completedSwaps': increment(1),
          'stats.reputation': increment(0.02)
        });
      }

      if (linkedRequestId) batch.update(doc(firestore, 'swapRequests', linkedRequestId), { status: 'completed' });
      if (linkedItemId) batch.update(doc(firestore, 'items', linkedItemId), { status: 'swapped' });

      await batch.commit();
      setIsCompleted(true);
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'write', path: 'transactions' }));
      setIsProcessing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!firestore || !user || !linkedReceiverId || !linkedRequestId) return;
    try {
      await addDoc(collection(firestore, 'reviews'), {
        fromId: user.uid, fromName: user.displayName || 'Anonym', toId: linkedReceiverId,
        requestId: linkedRequestId, content: reviewText || 'Kjempefint bytte!', rating: 5, createdAt: new Date().toISOString()
      });
      toast({ title: t.scan.success });
      router.push(`/profile?lang=${lang}`);
    } catch (e) {
      router.push(`/profile?lang=${lang}`);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-black">
      <header className="absolute top-0 z-50 flex w-full items-center justify-between p-6 mix-blend-difference">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white active-scale" asChild>
          <Link href={linkedRequestId ? `/activity?lang=${lang}` : `/profile?lang=${lang}`}><ChevronLeft className="h-6 w-6" /></Link>
        </Button>
        <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{t.scan.title}</h1>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white"><Zap className="h-5 w-5" /></Button>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover grayscale-[0.2] contrast-125" autoPlay muted playsInline />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative h-72 w-72">
            <div className="absolute -top-1 -left-1 h-12 w-12 border-t-4 border-l-4 border-primary rounded-tl-[2rem]" />
            <div className="absolute -top-1 -right-1 h-12 w-12 border-t-4 border-r-4 border-primary rounded-tr-[2rem]" />
            <div className="absolute -bottom-1 -left-1 h-12 w-12 border-b-4 border-l-4 border-primary rounded-bl-[2rem]" />
            <div className="absolute -bottom-1 -right-1 h-12 w-12 border-b-4 border-r-4 border-primary rounded-br-[2rem]" />
            <motion.div animate={{ top: ['0%', '100%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="absolute left-0 h-0.5 w-full bg-primary/40 shadow-[0_0_20px_rgba(243,197,0,0.8)]" />
          </div>
        </div>

        <div className="absolute bottom-16 flex w-full justify-center gap-10 px-8">
          <Button variant="ghost" className="flex-col gap-2 text-white/40 hover:text-white transition-all active-scale" onClick={handleSimulateScan}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl ring-1 ring-white/10"><CheckCircle2 className="h-7 w-7" /></div>
            <span className="text-[9px] font-black uppercase tracking-widest">Test Scan</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-2 text-white/40 hover:text-white transition-all active-scale">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl ring-1 ring-white/10"><ImageIcon className="h-7 w-7" /></div>
            <span className="text-[9px] font-black uppercase tracking-widest">Galleri</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isScanned && !isCompleted && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="absolute bottom-0 z-[100] w-full rounded-t-[3.5rem] bg-white p-10 shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
            <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-muted/40" />
            <h2 className="text-center text-3xl font-black italic tracking-tighter mb-10">{t.scan.confirmTransfer}</h2>
            
            <div className="space-y-8">
              <div className="flex items-center gap-5 rounded-[2.5rem] bg-muted/30 p-5 ring-1 ring-black/[0.03]">
                <div className="h-16 w-16 rounded-[1.2rem] bg-primary flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">{linkedReceiverName.charAt(0)}</div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">{t.scan.transferTo}</p>
                   <p className="text-xl font-black">{linkedReceiverName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between px-4">
                 <p className="text-sm font-black uppercase tracking-widest text-muted-foreground opacity-40">{t.scan.amount}</p>
                 <div className="flex items-baseline gap-1">
                   <p className="text-5xl font-black italic tracking-tighter text-primary">{linkedAmount}</p>
                   <span className="text-xs font-black text-foreground/30 uppercase">pts</span>
                 </div>
              </div>

              <div className="rounded-2xl bg-primary/5 p-4 flex gap-3 items-center ring-1 ring-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <p className="text-[10px] font-bold leading-relaxed text-foreground/60">Poengene overføres sikkert til naboen din. Handelen er endelig.</p>
              </div>

              <Button onClick={handleConfirmTransfer} disabled={isProcessing} className="h-16 w-full rounded-[1.5rem] bg-foreground text-primary font-black text-base shadow-2xl active-scale disabled:opacity-50">
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : t.scan.sendButton}
              </Button>
            </div>
          </motion.div>
        )}

        {isCompleted && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 z-[110] flex items-center justify-center bg-background p-8">
            <div className="w-full max-w-sm text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-green-500 text-white shadow-2xl shadow-green-500/20">
                <CheckCircle2 className="h-12 w-12" />
              </motion.div>
              <h2 className="text-3xl font-black italic tracking-tighter mb-4">{t.scan.leaveReviewTitle}</h2>
              <p className="mb-10 text-sm font-medium text-muted-foreground leading-relaxed px-4">{t.scan.leaveReviewDesc}</p>
              
              <Textarea placeholder={t.scan.reviewPlaceholder} value={reviewText} onChange={(e) => setReviewText(e.target.value)} className="min-h-[140px] rounded-[2rem] border-none bg-white p-6 shadow-sm ring-1 ring-black/[0.03] focus:ring-2 focus:ring-primary" />

              <div className="mt-10 flex gap-4">
                <Button variant="ghost" onClick={() => router.push(`/profile?lang=${lang}`)} className="flex-1 rounded-2xl font-black text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100">{t.scan.skipReview}</Button>
                <Button onClick={handleSubmitReview} className="flex-[2] h-16 rounded-2xl bg-primary text-foreground font-black shadow-xl active-scale">{t.scan.submitReview}</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
