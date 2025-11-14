
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
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  storeName: z.string().min(2, 'Store name must be at least 2 characters.'),
  media: z.string().refine((data) => data.startsWith('data:'), {
    message: 'A photo or video is required.',
  }),
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

  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      storeName: '',
      media: '',
    },
  });

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
        title: '相机访问被拒绝',
        description: '请在浏览器设置中启用相机权限，才能使用此功能。',
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
        title: '无法访问相机',
        description: '无法获取相机权限，请检查设备和浏览器设置。',
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

  const onSubmit = async (values: FormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to post a deal.',
      });
      return;
    }

    const newDeal = {
      name: values.title,
      description: values.description,
      price: 0, // Deals don't have a price in this form, default to 0
      category: 'Other', // Default category
      imageUrl: 'https://picsum.photos/seed/deal/600/400', 
      imageHint: 'local deal',
      images: [{ id: '1', url: 'https://picsum.photos/seed/deal/600/400', hint: 'local deal' }],
      sellerId: user.uid,
      postedDate: new Date().toISOString(),
      isPublic: false,
      storeName: values.storeName,
      reviews: [],
      priceComparisons: [],
    };

    try {
      const userProductsRef = collection(firestore, 'users', user.uid, 'products');
      await addDocumentNonBlocking(userProductsRef, newDeal);

      toast({
        title: '优惠已保存!',
        description: '您分享的优惠已作为草稿保存到您的个人主页。',
      });
      
      router.push('/profile');

    } catch (error) {
       console.error('Error adding document: ', error);
       toast({
        variant: 'destructive',
        title: '出错了! 出了点问题。',
        description: '保存您的优惠时遇到问题。',
      });
    }
  };

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
                拍照
              </Button>
              <Button type="button" variant="outline" onClick={exitCamera}>
                退出拍照
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
                重新选择
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
                    <AlertTitle>需要相机权限</AlertTitle>
                    <AlertDescription>
                    请允许使用相机来启用此功能。
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-dashed border-input bg-background p-8">
                <p className="text-center text-muted-foreground">分享您发现的优惠！</p>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <Button type="button" onClick={requestCamera}>
                        <Camera className="mr-2 h-4 w-4" />
                        使用相机拍摄
                    </Button>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                       <Upload className="mr-2 h-4 w-4" />
                        上传照片/视频
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
              <CardTitle>分享本地优惠</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>优惠标题</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：所有水果八折" {...field} />
                        </FormControl>
                        <FormDescription>为优惠写一个简短、吸引人的标题。</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>店铺名称</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：邻里水果摊" {...field} />
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
                        <FormLabel>描述</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="描述优惠详情、任何条件以及在哪里可以找到它。"
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
                        <FormLabel>优惠照片/视频</FormLabel>
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
                    <Link href="/" className="w-full sm:w-auto">
                        <Button type="button" variant="outline" className="w-full">
                            取消
                        </Button>
                    </Link>
                    <Button type="submit" className="w-full flex-1" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? '正在分享...' : '分享优惠'}
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

    