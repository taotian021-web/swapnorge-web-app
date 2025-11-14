
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
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  location: z.string().min(3, 'Location must be at least 3 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function OrganizeActivityPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log(values);
    toast({
      title: t.post.activityPublishedTitle,
      description: t.post.activityPublishedDesc,
    });
    form.reset();
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
          <Card>
            <CardHeader>
              <CardTitle>{t.post.organizeActivityTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.post.activityTitleLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.post.activityTitlePlaceholder} {...field} />
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
                        <FormLabel>{t.post.activityDetailsLabel}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t.post.activityDetailsPlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.post.locationLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.post.locationPlaceholder} {...field} />
                        </FormControl>
                        <FormDescription>{t.post.locationDescription}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? t.post.submitting : t.post.publishActivity}
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
