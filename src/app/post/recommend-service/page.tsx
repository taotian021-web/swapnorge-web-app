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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import Link from 'next/link';

const formSchema = z.object({
  serviceType: z.enum(['Group Buy', 'Food', 'Household', 'Electronics', 'Garden', 'Other']),
  providerName: z.string().min(2, 'Provider name must be at least 2 characters.'),
  contact: z.string().optional(),
  recommendation: z.string().min(10, 'Recommendation must be at least 10 characters.'),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  price: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function RecommendServicePage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);
  const [isSubmitting, setIsSubmitting] = React.useState(false);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      providerName: '',
      recommendation: '',
      contact: '',
      serviceType: 'Group Buy',
      price: 0,
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
        const newDocRef = doc(userProductsRef);

        const newProduct: Omit<Product, 'id'> = {
          name: values.providerName,
          description: values.recommendation,
          price: values.price || 0,
          category: 'Group Buy',
          imageUrl: 'https://picsum.photos/seed/groupbuy/600/400',
          imageHint: 'group buy',
          images: [{ id: '1', url: 'https://picsum.photos/seed/groupbuy/600/400', hint: 'group buy' }],
          sellerId: user.uid,
          postedDate: new Date().toISOString(),
          isPublic: isPublic,
          storeName: values.contact,
          location: values.location,
          reviews: [],
          priceComparisons: [],
          status: 'open',
          responses: 0,
        };

        setDocumentNonBlocking(newDocRef, newProduct, { merge: true });

        if (isPublic) {
            const publicDocRef = doc(firestore, 'products', newDocRef.id);
            setDocumentNonBlocking(publicDocRef, newProduct, { merge: true });
            toast({
                title: t.post.serviceRecommendedTitle,
                description: t.post.serviceRecommendedDesc,
            });
        } else {
            toast({
                title: t.post.draftSavedTitle,
                description: "Group buy draft saved.",
            });
        }
      
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

  const handleFormSubmit = (isPublic: boolean) => {
    return form.handleSubmit((values) => onSubmit(values, isPublic));
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
          <Card>
            <CardHeader>
              <CardTitle>{t.post.recommendServiceTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((values) => onSubmit(values, true))} className="space-y-8">
                   <FormField
                    control={form.control}
                    name="providerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.post.providerNameLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.post.providerNamePlaceholder} {...field} />
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
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.post.serviceTypeLabel}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t.post.serviceTypePlaceholder} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Group Buy">{t.categories.GroupBuy}</SelectItem>
                              <SelectItem value="Food">{t.categories.Food}</SelectItem>
                              <SelectItem value="Household">{t.categories.Household}</SelectItem>
                              <SelectItem value="Other">{t.services.Other}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                 

                   <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.post.contactLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.post.contactPlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recommendation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.post.recommendationLabel}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t.post.recommendationPlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                        {isSubmitting ? t.post.submitting : t.post.shareRecommendation}
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
