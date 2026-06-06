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
import { useSupabase } from '@/supabase';
import { useSupabaseUser } from '@/supabase/hooks';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Upload } from 'lucide-react';

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
  const supabase = useSupabase();
  const { user } = useSupabaseUser();
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
      description: '',
      urgency: 'normal',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
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
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t.post.loginPrompt,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const sellerName = user.user_metadata?.full_name || user.email || 'Anonym';
      const newProduct: Omit<Product, 'id'> = {
        name: values.name,
        description: values.description || '',
        price: 0,
        category: 'Help',
        sellerId: user.id,
        sellerName,
        sellerRating: 5.0,
        postedDate: new Date().toISOString(),
        isPublic,
        location: values.location,
        urgency: values.urgency,
        status: 'open',
        responses: 0,
        likes: 0,
        views: 0,
        createdAt: new Date().toISOString(),
        userId: user.id,
      };

      const { error } = await supabase.from('products').insert(newProduct);
      if (error) {
        throw error;
      }

      toast({
        title: isPublic ? t.post.publishHelp : t.post.draftSavedTitle,
        description: isPublic ? `"${values.name}" 已发布！` : t.post.groupBuyDraftSavedDesc,
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
    <div className="flex min-h-screen w-full flex-col bg-background pb-20">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-4 md:px-8">
          <Card className="rounded-[3rem] border-none bg-white shadow-xl ring-1 ring-black/[0.04]">
            <CardHeader>
              <CardTitle>{t.post.groupBuyTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
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
                          <Textarea placeholder={t.post.groupBuyDescriptionPlaceholder} {...field} />
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
                      <Button type="button" variant="outline" className="w-full rounded-2xl" disabled={isSubmitting}>
                        {t.post.cancel}
                      </Button>
                    </Link>
                    <Button type="button" variant="secondary" className="w-full rounded-2xl sm:w-auto" disabled={isSubmitting} onClick={handleSaveDraft}>
                      {t.post.saveDraft}
                    </Button>
                    <Button type="submit" className="w-full flex-1 rounded-2xl bg-primary text-foreground font-black sm:w-auto" disabled={isSubmitting}>
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
