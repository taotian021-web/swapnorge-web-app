
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
import { Camera, X, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';


const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  storeName: z.string().min(2, 'Store name must be at least 2 characters.'),
  image: z.string().refine((data) => data.startsWith('data:image/'), {
    message: 'A photo is required.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShareDealPage() {
  const { toast } = useToast();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      storeName: '',
      image: '',
    },
  });
  
  React.useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description:
            'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, []);
  
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
            setCapturedImage(dataUrl);
            form.setValue('image', dataUrl);
            form.trigger('image'); // Manually trigger validation
        }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    form.setValue('image', '');
  };


  const onSubmit = async (values: FormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to post a deal.',
      });
      return;
    }

    // In a real app, you'd upload the image dataUrl to a storage service
    // and get a URL. For this demo, we'll use a placeholder but could 
    // potentially store the data URI in Firestore if small enough (not recommended).
    const newDeal = {
      name: values.title,
      description: values.description,
      price: 0, // Deals don't have a price in this form, default to 0
      category: 'Other', // Default category
      // Using a placeholder URL for consistency, but `values.image` has the dataURI
      imageUrl: 'https://picsum.photos/seed/deal/600/400', 
      imageHint: 'local deal',
      images: [{ id: '1', url: 'https://picsum.photos/seed/deal/600/400', hint: 'local deal' }],
      sellerId: user.uid,
      postedDate: new Date().toISOString(),
      isPublic: false, // Initially created as a private draft
      storeName: values.storeName,
      reviews: [],
      priceComparisons: [],
    };

    try {
      const userProductsRef = collection(firestore, 'users', user.uid, 'products');
      await addDocumentNonBlocking(userProductsRef, newDeal);

      toast({
        title: 'Deal Saved!',
        description: 'Your new deal has been saved as a draft to your profile.',
      });
      
      router.push('/profile');

    } catch (error) {
       console.error('Error adding document: ', error);
       toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem saving your deal.',
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Share a Local Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 20% off all fruits" {...field} />
                        </FormControl>
                        <FormDescription>A short, catchy title for the deal.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Neighborhood Fruit Stand" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the deal, any conditions, and where to find it."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="image"
                    render={() => (
                       <FormItem>
                        <FormLabel>Deal Photo</FormLabel>
                        <FormControl>
                            <div className="w-full space-y-4 rounded-md border border-input bg-background p-4">
                                {hasCameraPermission === false && (
                                    <Alert variant="destructive">
                                        <X className="h-4 w-4" />
                                        <AlertTitle>Camera Access Required</AlertTitle>
                                        <AlertDescription>
                                        Please allow camera access to use this feature.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                                    {capturedImage ? (
                                        <Image src={capturedImage} alt="Captured deal" fill className="object-contain" />
                                    ) : (
                                        <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                                    )}
                                </div>
                                <div className="flex justify-center gap-4">
                                    {capturedImage ? (
                                        <Button type="button" variant="outline" onClick={handleRetake}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Retake
                                        </Button>
                                    ) : (
                                        <Button type="button" onClick={handleCapture} disabled={hasCameraPermission !== true}>
                                            <Camera className="mr-2 h-4 w-4" />
                                            Take Picture
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </FormControl>
                         <FormMessage />
                       </FormItem>
                    )}
                  />
                  <canvas ref={canvasRef} className="hidden" />


                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Sharing...' : 'Share Deal'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
