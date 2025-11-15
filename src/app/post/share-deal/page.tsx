'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/neighbor-buy/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, X, RefreshCw, Upload, Video } from 'lucide-react';
import Image from 'next/image';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, type Language } from '@/lib/translations';
import type { Product } from '@/lib/types';


const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  storeName: z.string().min(2, 'Store name must be at least 2 characters.'),
  media: z.string().refine((data) => data.startsWith('data:'), {
    message: 'A photo or video is required.',
  }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional()
});

type FormValues = z.infer<typeof formSchema>;
type View = 'idle' | 'camera' | 'preview';

export default function ShareDealPage() {
  const { toast } = useToast();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [view, setView] = React.useState<View>('idle');
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [mediaPreview, setMediaPreview] = React.useState<string | null>(null);
  const [mediaType, setMediaType] = React.useState<'image' | 'video' | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);


  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      storeName: '',
      media: '',
    },
  });

  React.useEffect(() => {
    // Try to get user's location when component mounts
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('location', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn(`Could not get user location: ${error.message}`);
        // Optionally notify user that location couldn't be automatically fetched
      }
    );
  }, [form]);
  
  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  React.useEffect(() => {
    return () => {
        stopCameraStream();
    }
  }, []);

  const requestCamera = async () => {
    if (hasCameraPermission === false) {
      toast({
        variant: 'destructive',
        title: t.post.cameraAccessDeniedTitle,
        description: t.post.cameraAccessDeniedDesc,
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setView('camera');
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: t.post.cameraErrorTitle,
        description: t.post.cameraErrorDesc,
      });
    }
  };
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/png');
            setMediaPreview(dataUrl);
            setMediaType('image');
            form.setValue('media', dataUrl);
            form.trigger('media');
            stopCameraStream();
            setView('preview');
        }
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setMediaPreview(dataUrl);
        setMediaType(file.type.startsWith('video') ? 'video' : 'image');
        form.setValue('media', dataUrl);
        form.trigger('media');
        setView('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setMediaPreview(null);
    setMediaType(null);
    form.setValue('media', '');
    setView('idle');
  };

  const exitCamera = () => {
    stopCameraStream();
    setView('idle');
  }

  const onSubmit = async (values: FormValues, isPublic: boolean) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t.post.loginPrompt,
      });
      return;
    }

    if (isPublic && !values.location) {
      toast({
        variant: 'destructive',
        title: 'Location Missing',
        description: 'A location is required to share an item publicly. Please enable location services.',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const userProductsRef = collection(firestore, 'users', user.uid, 'products');
      const newDocRef = doc(userProductsRef); // Create a new document reference with a unique ID
      
      const newDeal: Omit<Product, 'id'> = {
        name: values.title,
        description: values.description,
        price: 0, // Deals don't have a price in this form, default to 0
        category: 'Other', // Default category for deals
        imageUrl: 'https://picsum.photos/seed/deal/600/400', // Placeholder
        imageHint: 'local deal',
        images: [{ id: '1', url: 'https://picsum.photos/seed/deal/600/400', hint: 'local deal' }], // Placeholder
        sellerId: user.uid,
        postedDate: new Date().toISOString(),
        isPublic: isPublic,
        storeName: values.storeName,
        location: values.location,
        reviews: [],
        priceComparisons: [],
      };
      
      // Save to user's private collection
      await setDocumentNonBlocking(newDocRef, newDeal, { merge: true });

      if (isPublic) {
        // Also save to public collection
        const publicDocRef = doc(firestore, 'products', newDocRef.id);
        await setDocumentNonBlocking(publicDocRef, newDeal, { merge: true });
         toast({
          title: t.profile.itemSharedTitle,
          description: t.profile.itemSharedDesc(values.title),
        });
      } else {
        toast({
          title: t.post.draftSavedTitle,
          description: t.post.dealSavedDesc,
        });
      }
      
      router.push(`/profile?lang=${lang}`);

    } catch (error) {
       console.error('Error adding document: ', error);
       toast({
        variant: 'destructive',
        title: t.post.errorTitle,
        description: t.post.dealErrorDesc,
      });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleFormSubmit = (isPublic: boolean) => {
    return form.handleSubmit((values) => onSubmit(values, isPublic));
  }


  const renderView = () => {
    switch (view) {
      case 'camera':
        return (
          <>
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
            </div>
            <div className="flex justify-center gap-4">
              <Button type="button" onClick={handleCapture} disabled={hasCameraPermission !== true}>
                <Camera className="mr-2 h-4 w-4" />
                {t.post.capture}
              </Button>
              <Button type="button" variant="outline" onClick={exitCamera}>
                {t.post.exitCamera}
              </Button>
            </div>
          </>
        );
      case 'preview':
        return (
          <>
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              {mediaPreview && mediaType === 'image' && (
                <Image src={mediaPreview} alt="Captured deal" fill className="object-contain" />
              )}
              {mediaPreview && mediaType === 'video' && (
                <video src={mediaPreview} className="h-full w-full object-contain" controls />
              )}
            </div>
            <div className="flex justify-center gap-4">
              <Button type="button" variant="outline" onClick={handleRetake}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.post.reselect}
              </Button>
            </div>
          </>
        );
      case 'idle':
      default:
        return (
          <>
            {hasCameraPermission === false && (
                <Alert variant="destructive">
                    <X className="h-4 w-4" />
                    <AlertTitle>{t.post.cameraPermissionRequired}</AlertTitle>
                    <AlertDescription>
                    {t.post.cameraPermissionDesc}
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-dashed border-input bg-background p-8">
                <p className="text-center text-muted-foreground">{t.post.shareDealPrompt}</p>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <Button type="button" onClick={requestCamera}>
                        <Camera className="mr-2 h-4 w-4" />
                        {t.post.useCamera}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                       <Upload className="mr-2 h-4 w-4" />
                        {t.post.uploadMedia}
                    </Button>
                </div>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileUpload}
            />
          </>
        );
    }
  };
  
  return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
            <Card>
              <CardHeader>
                <CardTitle>{t.post.shareDealTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.post.dealTitleLabel}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.post.dealTitlePlaceholder} {...field} />
                          </FormControl>
                          <FormDescription>{t.post.dealTitleDescription}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="storeName"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>{t.post.storeNameLabel}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.post.storeNamePlaceholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.post.descriptionLabel}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t.post.dealDescriptionPlaceholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="media"
                      render={() => (
                         <FormItem>
                          <FormLabel>{t.post.mediaLabel}</FormLabel>
                          <FormControl>
                              <div className="w-full space-y-4">
                                 {renderView()}
                              </div>
                          </FormControl>
                           <FormMessage />
                         </FormItem>
                      )}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="flex flex-col-reverse gap-4 sm:flex-row">
                        <Link href={`/?lang=${lang}`} className="w-full sm:w-auto">
                           <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                             {t.post.cancel}
                           </Button>
                        </Link>
                        <Button type="button" onClick={handleFormSubmit(false)} variant="secondary" className="w-full flex-1" disabled={isSubmitting}>
                          {isSubmitting ? t.post.submitting : t.post.saveDraft}
                        </Button>
                        <Button type="button" onClick={handleFormSubmit(true)} className="w-full flex-1" disabled={isSubmitting}>
                          {isSubmitting ? t.post.submitting : t.post.shareDealButton}
                        </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
  );
}
