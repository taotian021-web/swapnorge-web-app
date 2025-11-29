'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/neighbor-buy/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Camera, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type View = 'idle' | 'camera' | 'preview';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().optional(),
  category: z.enum(['Food', 'Household', 'Electronics', 'Garden', 'Other', 'Help', 'Borrow']),
  media: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function GroupBuyPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [view, setView] = React.useState<View>('idle');
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [mediaPreview, setMediaPreview] = React.useState<string | null>(null);
  const [mediaType, setMediaType] = React.useState<'image' | 'video' | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      media: '',
      category: 'Help',
    },
  });

  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('location', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn(`Could not get user location: ${error.message}`);
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
    
    const imageUrl = mediaPreview || 'https://picsum.photos/seed/help/600/400';
    
    try {
        const userProductsRef = collection(firestore, 'users', user.uid, 'products');
        const newDocRef = doc(userProductsRef);

        const newProduct: Product = {
          name: values.name,
          description: values.description,
          price: values.price || 0,
          category: values.category,
          imageUrl: imageUrl, 
          imageHint: 'help request',
          images: [{ id: '1', url: imageUrl, hint: 'help request' }],
          sellerId: user.uid,
          postedDate: new Date().toISOString(),
          isPublic: isPublic,
          location: values.location,
          reviews: [],
          priceComparisons: [],
        };

        setDocumentNonBlocking(newDocRef, newProduct, { merge: true });

        if (isPublic) {
            const publicDocRef = doc(firestore, 'products', newDocRef.id);
            setDocumentNonBlocking(publicDocRef, newProduct, { merge: true });
            toast({
                title: t.profile.itemSharedTitle,
                description: t.profile.itemSharedDesc(values.name),
            });
        } else {
            toast({
                title: t.post.draftSavedTitle,
                description: t.post.groupBuyDraftSavedDesc,
            });
        }
      
      router.push(`/profile?lang=${lang}`);
      
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: t.post.errorTitle,
        description: t.post.errorDesc,
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
                <Image src={mediaPreview} alt="Captured preview" fill className="object-contain" />
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
                <p className="text-center text-muted-foreground">{t.post.imagesDescription}</p>
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
              <CardTitle>{t.post.groupBuyTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.post.itemNameLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.post.itemNamePlaceholder} {...field} />
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
                            placeholder={t.post.groupBuyDescriptionPlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.post.priceLabel}</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.post.categoryLabel}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t.post.categoryPlaceholder} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Help">求助</SelectItem>
                              <SelectItem value="Borrow">借用</SelectItem>
                              <SelectItem value="Food">食品</SelectItem>
                              <SelectItem value="Household">家居</SelectItem>
                              <SelectItem value="Other">其他</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="media"
                    render={() => (
                       <FormItem>
                        <FormLabel>{t.post.imagesLabel}</FormLabel>
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
                        {isSubmitting ? t.post.submitting : "发布求助"}
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
