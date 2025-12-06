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
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import Link from 'next/link';
import type { Product } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().optional(),
  urgency: z.enum(['normal', 'urgent']).default('normal'),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      urgency: 'normal',
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

        const newProduct: Omit<Product, 'id'> = {
          name: values.name,
          description: values.description || '',
          price: 0,
          category: 'Help',
          sellerId: user.uid,
          postedDate: new Date().toISOString(),
          isPublic: true,
          location: values.location,
          urgency: values.urgency,
          status: 'open',
          responses: 0,
          likes: 0,
          views: 0,
        };
        
        const publicDocRef = doc(firestore, 'products', newDocRef.id);
        setDocumentNonBlocking(doc(userProductsRef, newDocRef.id), newProduct, { merge: true });
        setDocumentNonBlocking(publicDocRef, newProduct, { merge: true });

        toast({
            title: t.post.publishHelp,
            description: `"${values.name}" 已发布！`,
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


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
          <Card>
            <CardHeader>
              <CardTitle>{t.post.groupBuyTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                  
                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.post.urgencyLabel}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="normal">{t.post.urgencyNormal}</SelectItem>
                            <SelectItem value="urgent">{t.post.urgencyUrgent}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
                      <Link href={`/?lang=${lang}`} className="w-full sm:w-auto">
                         <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                           {t.post.cancel}
                         </Button>
                      </Link>
                      <Button type="submit" className="w-full flex-1 sm:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? t.post.submitting : t.post.publishHelp}
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
