
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
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
  const linkedReceiverName = searchParams.get('receiverName') || 'Selger';

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [isScanned, setIsScanned] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const userRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profile } = useDoc<UserProfile>(userRef);

  React.useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleSimulateScan = () => {
    setIsScanned(true);
  };

  const handleConfirmTransfer = async () => {
    if (!user || !firestore || !profile) return;
    
    setIsProcessing(true);
    const amount = linkedAmount;

    if (profile.stats.points < amount) {
      toast({
        variant: 'destructive',
        title: lang === 'no' ? 'Ikke nok poeng' : 'Insufficient points',
        description: lang === 'no' ? 'Du trenger flere poeng for å fullføre dette byttet.' : 'You need more points to complete this swap.',
      });
      setIsProcessing(false);
      setIsScanned(false);
      return;
    }

    try {
      const batch = writeBatch(firestore);

      // 1. Update buyer (Deduct points, increment swaps, slightly boost reputation)
      const buyerRef = doc(firestore, 'users', user.uid);
      batch.update(buyerRef, { 
        'stats.points': increment(-amount),
        'stats.completedSwaps': increment(1),
        'stats.reputation': increment(0.01) // Small positive feedback for every completion
      });

      // 2. Update seller (Add points, increment swaps, boost reputation)
      if (linkedReceiverId) {
        const sellerRef = doc(firestore, 'users', linkedReceiverId);
        batch.update(sellerRef, { 
          'stats.points': increment(amount),
          'stats.completedSwaps': increment(1),
          'stats.reputation': increment(0.02) // Sellers get slightly more reputation for successful fulfillment
        });
      }

      // 3. Update Request status to completed
      if (linkedRequestId) {
        const requestRef = doc(firestore, 'swapRequests', linkedRequestId);
        batch.update(requestRef, { status: 'completed' });
      }

      // 4. Update Item status to swapped
      if (linkedItemId) {
        const itemRef = doc(firestore, 'items', linkedItemId);
        batch.update(itemRef, { status: 'swapped' });
      }

      await batch.commit();

      toast({
        title: t.scan.success,
        description: lang === 'no' ? `${amount} poeng er nå overført. Ryktet ditt har økt!` : `${amount} points transferred. Your reputation has increased!`,
      });
      
      router.push(`/profile?lang=${lang}`);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Transaksjonen feilet. Vennligst prøv igjen.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-black">
      <header className="absolute top-0 z-50 flex w-full items-center justify-between p-6">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white" asChild>
          <Link href={linkedRequestId ? `/activity?lang=${lang}` : `/profile?lang=${lang}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="text-sm font-black uppercase tracking-widest text-white">{t.scan.title}</h1>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white">
          <Zap className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          className="h-full w-full object-cover" 
          autoPlay 
          muted 
          playsInline
        />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative h-64 w-64">
            <div className="absolute -top-1 -left-1 h-8 w-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 h-8 w-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
            <motion.div 
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 h-1 w-full bg-primary/50 shadow-[0_0_15px_rgba(243,197,0,0.8)]"
            />
          </div>
        </div>

        <div className="absolute bottom-12 flex w-full justify-center gap-8 px-8">
          <Button variant="ghost" className="flex-col gap-2 text-white opacity-60 hover:opacity-100" onClick={handleSimulateScan}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Simulate</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-2 text-white opacity-60 hover:opacity-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
              <ImageIcon className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Gallery</span>
          </Button>
        </div>
      </div>

      {hasCameraPermission === false && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 p-8">
          <Alert variant="destructive" className="rounded-3xl border-none bg-white p-6">
            <AlertTitle className="text-lg font-black">{t.scan.cameraError}</AlertTitle>
            <AlertDescription className="mt-2 text-xs font-bold text-muted-foreground opacity-70">
              Please enable camera permissions in your browser settings to use this feature.
            </AlertDescription>
            <Button asChild className="mt-6 w-full rounded-2xl bg-primary text-foreground font-black">
               <Link href={`/profile?lang=${lang}`}>Go Back</Link>
            </Button>
          </Alert>
        </div>
      )}

      <AnimatePresence>
        {isScanned && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 z-[100] h-[55vh] w-full rounded-t-[3.5rem] bg-white p-8 shadow-2xl"
          >
            <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-muted" />
            <h2 className="text-center text-2xl font-black italic tracking-tighter">{t.scan.confirmTransfer}</h2>
            
            <div className="mt-10 flex flex-col items-center gap-8">
              <div className="flex items-center gap-4 rounded-[2rem] bg-background p-4 pr-8 ring-1 ring-black/[0.05]">
                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center font-black">
                  {linkedReceiverName.charAt(0)}
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t.scan.transferTo}</p>
                   <p className="text-lg font-black">{linkedReceiverName}</p>
                </div>
              </div>

              <div className="text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t.scan.amount}</p>
                 <p className="text-5xl font-black italic tracking-tighter text-primary">{linkedAmount} <span className="text-xl">pts</span></p>
                 <p className="mt-2 text-[10px] font-bold text-muted-foreground">Din saldo: {profile?.stats?.points ?? 0} pts</p>
              </div>

              <Button 
                onClick={handleConfirmTransfer}
                disabled={isProcessing}
                className="h-16 w-full rounded-2xl bg-foreground text-primary font-black text-base shadow-2xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? t.scan.processing : t.scan.sendButton}
              </Button>
              
              <Button variant="ghost" onClick={() => setIsScanned(false)} className="text-xs font-bold text-muted-foreground">
                Avbryt
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
