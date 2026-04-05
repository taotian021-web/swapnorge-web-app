
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
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, increment, updateDoc, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { ChevronLeft, ImagePlus, Upload as UploadIcon, CheckCircle2, MapPin } from 'lucide-react';
import type { SwapItem, ItemCondition } from '@/lib/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const formSchema = z.object({
  title: z.string().min(2, 'Tittel må være minst 2 tegn.').max(60),
  description: z.string().min(10, 'Beskrivelse må være minst 10 tegn.').max(500),
  points: z.number().min(0).max(1000),
  category: z.string(),
  customCategory: z.string().max(20).optional(),
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
  const editId = searchParams.get('edit');
  const t = getTranslations(lang);
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [coords, setCoords] = React.useState<{lat: number, lng: number} | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      points: 50,
      category: 'Klær',
      customCategory: '',
      condition: 'new',
    },
  });

  // Load item for editing
  React.useEffect(() => {
    async function loadItem() {
      if (editId && firestore) {
        const docRef = doc(firestore, 'items', editId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as SwapItem;
          // Check ownership
          if (user && data.sellerId !== user.uid) {
             router.push(`/?lang=${lang}`);
             return;
          }
          form.reset({
            title: data.title,
            description: data.description,
            points: data.points,
            category: data.category,
            condition: data.condition || 'good',
          });
        }
      }
    }
    loadItem();
  }, [editId, firestore, user, form, router, lang]);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn('Location access denied, defaulting to Oslo')
      );
    }
  }, []);

  const selectedCategory = form.watch('category');

  const onSubmit = async (values: FormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: lang === 'no' ? 'Feil' : 'Error',
        description: lang === 'no' ? 'Du må være logget inn.' : 'You must be logged in.',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const finalCategory = values.category === 'Annet' && values.customCategory 
        ? values.customCategory 
        : values.category;

      if (editId) {
        // UPDATE MODE
        const itemRef = doc(firestore, 'items', editId);
        await updateDoc(itemRef, {
          title: values.title,
          description: values.description,
          points: values.points,
          category: finalCategory,
          condition: values.condition as ItemCondition,
        });
        toast({ title: t.post.updateSuccess });
      } else {
        // CREATE MODE
        const batch = writeBatch(firestore);
        const itemsRef = collection(firestore, 'items');
        const newDocRef = doc(itemsRef);
        const userRef = doc(firestore, 'users', user.uid);

        const categoryKeywords: Record<string, string> = {
          'Klær': 'vintage',
          'Elektronikk': 'tech',
          'Hjem': 'furniture',
          'Bøker': 'book',
          'Sport': 'bicycle'
        };
        
        const matchedImage = PlaceHolderImages.find(img => 
          img.imageHint.toLowerCase().includes(categoryKeywords[values.category] || 'product')
        )?.imageUrl || `https://picsum.photos/seed/${newDocRef.id}/800/800`;

        const newItem: Omit<SwapItem, 'id'> = {
          title: values.title,
          description: values.description,
          points: values.points,
          category: finalCategory,
          condition: values.condition as ItemCondition,
          imageUrl: matchedImage,
          sellerId: user.uid,
          sellerName: user.displayName || 'Anonym Bruker',
          sellerRating: 5.0,
          postedDate: new Date().toISOString(),
          isPublic: true,
          location: { 
            latitude: coords?.lat || 59.91, 
            longitude: coords?.lng || 10.75, 
            city: 'Oslo' 
          },
          status: 'available',
          views: 0,
          likes: 0,
        };
        
        batch.set(newDocRef, newItem);
        batch.update(userRef, { 'stats.points': increment(20) });
        await batch.commit();
        toast({ title: t.post.success });
      }
      
      router.push(editId ? `/items/${editId}?lang=${lang}` : `/?lang=${lang}`);
      
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Feil',
        description: 'Noe gikk galt.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background px-4 py-4 border-b">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href={editId ? `/items/${editId}?lang=${lang}` : `/?lang=${lang}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold">
          {editId ? t.post.editTitle : t.post.title}
        </h1>
        <div className="w-10" />
      </header>

      <main className="container mx-auto max-w-2xl flex-1 px-4 py-6 pb-40">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {!editId && (
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
                  <p className="mt-3 text-xs font-bold text-foreground">{t.post.uploadHint}</p>
                </motion.div>
              </div>
            )}

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-sm font-bold ml-1">{t.post.itemTitle} *</FormLabel>
                      <span className="text-[10px] text-muted-foreground mr-1">{field.value.length}/60</span>
                    </div>
                    <FormControl>
                      <Input placeholder={t.post.itemTitlePlaceholder} className="h-14 rounded-2xl border-none bg-white px-6 shadow-sm ring-1 ring-black/[0.03]" {...field} />
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
                    <FormLabel className="text-sm font-bold ml-1">{t.post.description} *</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t.post.descriptionPlaceholder} className="min-h-[160px] rounded-[1.5rem] border-none bg-white p-6 shadow-sm ring-1 ring-black/[0.03]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold ml-1 mb-2 block">{t.post.category} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-none bg-white px-6 shadow-sm ring-1 ring-black/[0.03]">
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
                      <FormLabel className="text-sm font-bold ml-1 mb-2 block">{t.post.status} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-none bg-white px-6 shadow-sm ring-1 ring-black/[0.03]">
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

              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem className="pt-4">
                    <div className="flex items-center justify-between mb-6">
                      <FormLabel className="text-sm font-bold ml-1">{t.post.pointsLabel} *</FormLabel>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-primary">{field.value}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">pts</span>
                      </div>
                    </div>
                    <FormControl>
                      <Slider min={0} max={1000} step={10} value={[field.value]} onValueChange={(vals) => field.onChange(vals[0])} className="py-4" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
              <Button 
                type="submit" 
                className="h-16 w-full rounded-2xl bg-primary text-foreground font-black text-base shadow-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? '...' : (editId ? t.post.update : t.post.publish)}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
