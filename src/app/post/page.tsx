
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Camera, Upload, ChevronLeft } from 'lucide-react';
import type { SwapItem, ItemCategory } from '@/lib/types';
import Link from 'next/link';

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
      <header className="flex items-center p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/?lang=${lang}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="ml-2 text-xl font-bold">{t.post.title}</h1>
      </header>

      <main className="flex-1 p-4 pb-24">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white">
              <Camera className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Legg til bilder</p>
              <Button type="button" variant="link" className="text-primary">
                Last opp
              </Button>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.post.itemTitle}</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Skinnjakke i god stand" className="rounded-xl border-none bg-white py-6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.post.category}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl border-none bg-white py-6">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Klær">{t.categories.Klær}</SelectItem>
                      <SelectItem value="Elektronikk">{t.categories.Elektronikk}</SelectItem>
                      <SelectItem value="Hjem">{t.categories.Hjem}</SelectItem>
                      <SelectItem value="Bøker">{t.categories.Bøker}</SelectItem>
                      <SelectItem value="Sport">{t.categories.Sport}</SelectItem>
                      <SelectItem value="Annet">{t.categories.Annet}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.post.points}</FormLabel>
                  <FormControl>
                    <Input type="number" className="rounded-xl border-none bg-white py-6" {...field} />
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
                  <FormLabel>{t.post.description}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Fortell litt om gjenstanden..." 
                      className="min-h-[120px] rounded-xl border-none bg-white" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="h-12 flex-1 rounded-xl"
                onClick={() => router.back()}
              >
                {t.post.cancel}
              </Button>
              <Button 
                type="submit" 
                className="h-12 flex-1 rounded-xl font-bold"
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
