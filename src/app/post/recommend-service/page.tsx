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
import { Header } from '@/components/neighbor-buy/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { Upload } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  price: z.coerce.number().positive('Price must be positive'),
  description: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  category: z.enum(['ForSale', 'Activity']),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForSaleActivityPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      description: '',
      category: 'ForSale',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // Here you would typically handle the file upload process
      console.log('Selected file:', file);
    }
  };

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

  const handleSave = async (values: FormValues, isPublic: boolean) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t.post.loginPrompt,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        const userProductsRef = collection(firestore, 'users', user.uid, 'products');
        const newDocRef = doc(userProductsRef);

        const newProduct: Omit<Product, 'id'> = {
          name: values.name,
          description: values.description || '',
          price: values.price || 0,
          category: values.category,
          sellerId: user.uid,
          postedDate: new Date().toISOString(),
          isPublic: isPublic,
          location: values.location,
          urgency: 'normal',
          status: 'open',
          responses: 0,
          likes: 0,
          views: 0,
          createdAt: new Date().toISOString(),
          userId: user.uid,
        };
        
        setDocumentNonBlocking(doc(userProductsRef, newDocRef.id), newProduct, { merge: true });

        if (isPublic) {
            const publicDocRef = doc(firestore, 'products', newDocRef.id);
            setDocumentNonBlocking(publicDocRef, newProduct, { merge: true });
        }

        toast({
            title: isPublic ? t.post.publishForSale : t.post.draftSavedTitle,
            description: isPublic ? `"${values.name}" 已发布！` : t.post.forSaleDraftSavedDesc,
        });
      
      router.push(`/?lang=${lang}`);
      
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
  
  const onSubmit = (values: FormValues) => handleSave(values, true);
  const handleSaveDraft = () => {
    const values = form.getValues();
    handleSave(values, false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
          <Card>
            <CardHeader>
              <CardTitle>{t.post.forSaleTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                   <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.post.itemNameForSaleLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.post.itemForSalePlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.post.priceLabel}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder={t.post.pricePlaceholder} {...field} />
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
                            placeholder="..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>{t.post.mediaLabel}</FormLabel>
                      <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-dashed border-input bg-background p-8">
                          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                              {t.post.mediaLabel}
                          </Button>
                          <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*,video/*"
                          />
                          {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
                      </div>
                  </FormItem>
                  
                  <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
                      <Link href={`/?lang=${lang}`} className="w-full sm:w-auto">
                         <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                           {t.post.cancel}
                         </Button>
                      </Link>
                      <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isSubmitting} onClick={handleSaveDraft}>
                          {t.post.saveDraft}
                      </Button>
                      <Button type="submit" className="w-full flex-1 sm:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? t.post.submitting : t.post.publishForSale}
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
