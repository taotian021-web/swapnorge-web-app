
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

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const { toast } = useToast();

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [isScanned, setIsScanned] = React.useState(false);

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

  const handleConfirmTransfer = () => {
    toast({
      title: t.scan.success,
      description: lang === 'no' ? '250 poeng er nå overført til Erik.' : '250 points transferred to Erik.',
    });
    router.push(`/profile?lang=${lang}`);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-black">
      {/* Overlay Header */}
      <header className="absolute top-0 z-50 flex w-full items-center justify-between p-6">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white" asChild>
          <Link href={`/profile?lang=${lang}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="text-sm font-black uppercase tracking-widest text-white">{t.scan.title}</h1>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white">
          <Zap className="h-5 w-5" />
        </Button>
      </header>

      {/* Camera Viewfinder */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          className="h-full w-full object-cover" 
          autoPlay 
          muted 
          playsInline
        />
        
        {/* Scanner Frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative h-64 w-64">
            <div className="absolute -top-1 -left-1 h-8 w-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 h-8 w-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
            
            {/* Animated Scan Line */}
            <motion.div 
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 h-1 w-full bg-primary/50 shadow-[0_0_15px_rgba(243,197,0,0.8)]"
            />
          </div>
        </div>

        {/* Bottom Controls */}
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

      {/* Simulation Modal */}
      <AnimatePresence>
        {isScanned && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 z-[100] h-[50vh] w-full rounded-t-[3rem] bg-white p-8 shadow-2xl"
          >
            <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-muted" />
            <h2 className="text-center text-2xl font-black italic tracking-tighter">{t.scan.confirmTransfer}</h2>
            
            <div className="mt-10 flex flex-col items-center gap-6">
              <div className="flex items-center gap-4 rounded-[2rem] bg-background p-4 pr-8 ring-1 ring-black/[0.05]">
                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center font-black">E</div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t.scan.transferTo}</p>
                   <p className="text-lg font-black">Erik Nordmann</p>
                </div>
              </div>

              <div className="text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t.scan.amount}</p>
                 <p className="text-5xl font-black italic tracking-tighter text-primary">250 <span className="text-xl">pts</span></p>
              </div>

              <Button 
                onClick={handleConfirmTransfer}
                className="mt-4 h-16 w-full rounded-2xl bg-foreground text-primary font-black text-base shadow-2xl transition-transform active:scale-95"
              >
                {t.scan.sendButton}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
