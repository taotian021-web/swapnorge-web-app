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
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { ChevronLeft, ImagePlus, Upload as UploadIcon, CheckCircle2 } from 'lucide-react';
import type { SwapItem, ItemCategory } from '@/lib/types';
import Link from 'next/link';
import { motion } from 'framer-motion';

const formSchema = z.object({
  title: z.string().min(2, 'Tittel må være minst 2 tegn.').max(60),
  description: z.string().min(10, 'Beskrivelse må være minst 10 tegn.').max(500),
  points: z.number().min(0).max(1000),
  category: z.string(),
  condition: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PostPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      points: 50,
      category: 'Annet',
      condition: 'new',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: lang === 'no' ? 'Feil' : 'Error',
        description: lang === 'no' ? 'Du må være logget inn for å publisere.' : 'You must be logged in to post.',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const itemsRef = collection(firestore, 'items');
      const newDocRef = doc(itemsRef);

      const newItem: Omit<SwapItem, 'id'> = {
        title: values.title,
        description: values.description,
        points: values.points,
        category: values.category as ItemCategory,
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonym Bruker',
        sellerRating: 5.0,
        postedDate: new Date().toISOString(),
        isPublic: true,
        location: { latitude: 59.91, longitude: 10.75, city: 'Oslo' },
        status: 'available',
      };
      
      setDocumentNonBlocking(doc(itemsRef, newDocRef.id), newItem, { merge: true });

      toast({
        title: t.post.success,
        description: lang === 'no' ? `"${values.title}" er nå synlig for alle!` : `"${values.title}" is now visible to everyone!`,
      });
      
      router.push(`/?lang=${lang}`);
      
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: lang === 'no' ? 'Feil' : 'Error',
        description: lang === 'no' ? 'Kunne ikke publisere gjenstanden.' : 'Could not publish the item.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background px-4 py-4 border-b">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href={`/?lang=${lang}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold">
          {t.post.title}
        </h1>
        <div className="w-10" />
      </header>

      <main className="container mx-auto max-w-2xl flex-1 px-4 py-6 pb-40">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* 1. Upload Section */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/[0.03]">
              <div className="mb-4 flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-foreground" />
                <span className="font-bold">{t.post.uploadTitle}</span>
              </div>
              <p className="mb-6 text-xs text-muted-foreground leading-relaxed">
                {t.post.uploadDesc}
              </p>
              
              <motion.div 
                whileTap={{ scale: 0.98 }}
                className="group relative flex aspect-[21/9] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted bg-background/50 transition-all hover:border-primary/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-muted-foreground transition-transform group-hover:scale-110">
                  <UploadIcon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-xs font-bold text-foreground">
                  {t.post.uploadHint}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {t.post.uploadLimit}
                </p>
              </motion.div>
            </div>

            {/* 2. Main Form Section */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-sm font-bold ml-1">
                        {t.post.itemTitle} *
                      </FormLabel>
                      <span className="text-[10px] text-muted-foreground mr-1">
                        {field.value.length}/60
                      </span>
                    </div>
                    <FormControl>
                      <Input 
                        placeholder={t.post.itemTitlePlaceholder} 
                        className="h-14 rounded-2xl border-none bg-white px-6 shadow-sm ring-1 ring-black/[0.03] focus-visible:ring-2 focus-visible:ring-primary" 
                        {...field} 
                      />
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
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-sm font-bold ml-1">
                        {t.post.description} *
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder={t.post.descriptionPlaceholder} 
                        className="min-h-[160px] rounded-[1.5rem] border-none bg-white p-6 shadow-sm ring-1 ring-black/[0.03] focus-visible:ring-2 focus-visible:ring-primary" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold ml-1 mb-2 block">
                        {t.post.category} *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-none bg-white px-6 shadow-sm ring-1 ring-black/[0.03] focus:ring-2 focus:ring-primary">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          <SelectItem value="Klær">{t.categories.Klær}</SelectItem>
                          <SelectItem value="Elektronikk">{t.categories.Elektronikk}</SelectItem>
                          <SelectItem value="Hjem">{t.categories.Hjem}</SelectItem>
                          <SelectItem value="Bøker">{t.categories.Bøker}</SelectItem>
                          <SelectItem value="Sport">{t.categories.Sport}</SelectItem>
                          <SelectItem value="Annet">{t.categories.Annet}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold ml-1 mb-2 block">
                        {t.post.status} *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-none bg-white px-6 shadow-sm ring-1 ring-black/[0.03] focus:ring-2 focus:ring-primary">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          <SelectItem value="new">{t.conditions.new}</SelectItem>
                          <SelectItem value="likeNew">{t.conditions.likeNew}</SelectItem>
                          <SelectItem value="good">{t.conditions.good}</SelectItem>
                          <SelectItem value="fair">{t.conditions.fair}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* 3. Points Slider */}
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem className="pt-4">
                    <div className="flex items-center justify-between mb-6">
                      <FormLabel className="text-sm font-bold ml-1">
                        {t.post.pointsLabel} *
                      </FormLabel>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-primary">
                          {field.value}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          pts ≈ {field.value} NOK
                        </span>
                      </div>
                    </div>
                    <FormControl>
                      <Slider
                        min={0}
                        max={1000}
                        step={10}
                        defaultValue={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <p className="text-[10px] text-primary font-bold mt-4 ml-1">
                      {t.post.rewardTip}
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* 4. Process Info Box */}
            <div className="rounded-2xl bg-[#E8F1FF] p-6 ring-1 ring-[#D1E3FF] mb-8">
              <h5 className="text-[#0052CC] font-bold text-xs mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> 
                {t.post.process.title}
              </h5>
              <ul className="space-y-2 text-[11px] text-[#2463EB] font-bold">
                <li>{t.post.process.step1}</li>
                <li>{t.post.process.step2}</li>
                <li>{t.post.process.step3}</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
              <Button 
                type="submit" 
                className="h-16 w-full rounded-2xl bg-primary text-foreground font-black text-base shadow-[0_10px_30px_-5px_rgba(243,197,0,0.4)] transition-transform active:scale-95"
                disabled={isSubmitting}
              >
                + {isSubmitting ? (lang === 'no' ? 'Publiserer...' : 'Publishing...') : t.post.publish}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
