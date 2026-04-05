
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
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Camera, ChevronLeft, ImagePlus } from 'lucide-react';
import type { SwapItem, ItemCategory } from '@/lib/types';
import Link from 'next/link';
import { motion } from 'framer-motion';

const formSchema = z.object({
  title: z.string().min(2, 'Tittel må være minst 2 tegn.'),
  description: z.string().min(10, 'Beskrivelse må være minst 10 tegn.'),
  points: z.coerce.number().min(0, 'Poeng kan ikke være negativt.'),
  category: z.string(),
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
      points: 10,
      category: 'Annet',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Feil',
        description: 'Du må være logget inn for å publisere.',
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
        description: `"${values.title}" er nå synlig for alle!`,
      });
      
      router.push(`/?lang=${lang}`);
      
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Feil',
        description: 'Kunne ikke publisere gjenstanden.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background/80 px-4 py-6 backdrop-blur-xl">
        <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm" asChild>
          <Link href={`/?lang=${lang}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="text-xl font-black italic tracking-tighter text-foreground">
          {t.post.title}
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="container mx-auto max-w-2xl flex-1 px-6 pb-32">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Image Upload Area */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative flex aspect-video w-full flex-col items-center justify-center rounded-[2.5rem] bg-white shadow-sm ring-1 ring-black/[0.03] transition-all hover:ring-primary/50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <ImagePlus className="h-8 w-8" />
              </div>
              <p className="mt-4 text-sm font-black uppercase tracking-widest text-muted-foreground">
                Legg til bilder
              </p>
              <Button type="button" variant="link" className="mt-1 font-bold text-primary">
                Last opp fra enhet
              </Button>
            </motion.div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                      {t.post.itemTitle}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Hva vil du bytte bort?" 
                        className="h-14 rounded-2xl border-none bg-white px-6 shadow-sm ring-1 ring-black/[0.03] focus-visible:ring-2 focus-visible:ring-primary" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                        {t.post.category}
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
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                        {t.post.points}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            className="h-14 rounded-2xl border-none bg-white px-6 shadow-sm ring-1 ring-black/[0.03] focus-visible:ring-2 focus-visible:ring-primary" 
                            {...field} 
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">PTS</span>
                        </div>
                      </FormControl>
                      <FormMessage className="ml-2" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">
                      {t.post.description}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Fortell litt om gjenstanden, tilstand og hvorfor du bytter den bort..." 
                        className="min-h-[160px] rounded-[2rem] border-none bg-white p-6 shadow-sm ring-1 ring-black/[0.03] focus-visible:ring-2 focus-visible:ring-primary" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="ml-2" />
                  </FormItem>
                )}
              />
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-8 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 gap-3 px-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="h-16 flex-1 rounded-[1.5rem] bg-white text-foreground font-black shadow-sm"
                onClick={() => router.back()}
              >
                {t.post.cancel}
              </Button>
              <Button 
                type="submit" 
                className="h-16 flex-[2] rounded-[1.5rem] bg-primary text-foreground font-black text-base shadow-[0_10px_30px_-5px_rgba(243,197,0,0.5)] transition-transform active:scale-95"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Publiserer...' : t.post.publish}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
