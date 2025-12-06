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
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, type Language } from '@/lib/translations';
import type { Product } from '@/lib/types';
import { Upload } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  storeName: z.string().min(2, 'Location is required.'),
  validUntil: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function ShareDealPage() {
  const { toast } = useToast();
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
      validUntil: '',
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
  
  const onSubmit = async (values: FormValues) => {
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
      
      const newDeal: Omit<Product, 'id'> = {
        name: values.title,
        description: values.description || '',
        price: 0,
        category: 'Group Buy', // Corresponds to "Fresh News"
        sellerId: user.uid,
        postedDate: new Date().toISOString(),
        isPublic: true,
        storeName: values.storeName,
        validUntil: values.validUntil,
        location: values.location,
        status: 'open',
        responses: 0,
        likes: 0,
        views: 0,
      };
      
      const publicDocRef = doc(firestore, 'products', newDocRef.id);
      // Set in both user's private collection (as a record) and public collection
      setDocumentNonBlocking(doc(userProductsRef, newDocRef.id), newDeal, { merge: true });
      setDocumentNonBlocking(publicDocRef, newDeal, { merge: true });

      toast({
        title: t.post.shareDealButton,
        description: `"${values.title}" 已发布！`,
      });
      
      router.push(`/?lang=${lang}`);

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
  
  return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
            <Card>
              <CardHeader>
                <CardTitle>{t.post.shareDealTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                      name="validUntil"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>{t.post.validUntilLabel}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.post.validUntilPlaceholder} {...field} />
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

                    <FormItem>
                      <FormLabel>{t.post.mediaLabel}</FormLabel>
                        <div className="flex items-center justify-center gap-4 rounded-md border border-dashed border-input bg-background p-8">
                            <Button type="button" variant="outline">
                              <Upload className="mr-2 h-4 w-4" />
                                {t.post.mediaLabel}
                            </Button>
                        </div>
                    </FormItem>
                    
                    <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
                        <Link href={`/?lang=${lang}`} className="w-full sm:w-auto">
                           <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                             {t.post.cancel}
                           </Button>
                        </Link>
                        <Button type="submit" className="w-full flex-1 sm:w-auto" disabled={isSubmitting}>
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
