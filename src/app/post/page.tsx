
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
import { useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, increment, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Loader2 } from 'lucide-react';
import type { SwapItem, ItemCondition } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
      condition: 'new',
    },
  });

  React.useEffect(() => {
    async function loadItem() {
      if (editId && firestore) {
        const docRef = doc(firestore, 'items', editId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as SwapItem;
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
        () => console.warn('Location access denied')
      );
    }
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (!user || !firestore) return;
    setIsSubmitting(true);
    
    try {
      if (editId) {
        const itemRef = doc(firestore, 'items', editId);
        await updateDocumentNonBlocking(itemRef, {
          title: values.title,
          description: values.description,
          points: values.points,
          category: values.category,
          condition: values.condition as ItemCondition,
        });
        toast({ title: t.post.updateSuccess });
      } else {
        const batch = writeBatch(firestore);
        const itemsRef = collection(firestore, 'items');
        const newDocRef = doc(itemsRef);
        const userRef = doc(firestore, 'users', user.uid);

        const categoryKeywords: Record<string, string> = {
          'Klær': 'vintage', 'Elektronikk': 'tech', 'Hjem': 'furniture', 'Bøker': 'book', 'Sport': 'bicycle'
        };
        
        const matchedImage = PlaceHolderImages.find(img => 
          img.imageHint.toLowerCase().includes(categoryKeywords[values.category] || 'product')
        )?.imageUrl || `https://picsum.photos/seed/${newDocRef.id}/800/800`;

        const newItem: Omit<SwapItem, 'id'> = {
          title: values.title,
          description: values.description,
          points: values.points,
          category: values.category,
          condition: values.condition as ItemCondition,
          imageUrl: matchedImage,
          sellerId: user.uid,
          sellerName: user.displayName || 'Anonym',
          sellerRating: 5.0,
          postedDate: new Date().toISOString(),
          isPublic: true,
          location: { latitude: coords?.lat || 59.91, longitude: coords?.lng || 10.75, city: 'Oslo' },
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background pb-44">
      <main className="container mx-auto max-w-2xl px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            
            <section className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">{t.post.itemTitle}</FormLabel>
                      <span className="text-[10px] font-bold text-muted-foreground/40">{field.value.length}/60</span>
                    </div>
                    <FormControl>
                      <Input placeholder={t.post.itemTitlePlaceholder} className="h-16 rounded-[1.5rem] border-none bg-white px-6 text-base font-bold shadow-sm ring-1 ring-black/[0.03] transition-all focus:ring-2 focus:ring-primary" {...field} />
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
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">{t.post.description}</FormLabel>
                    </div>
                    <FormControl>
                      <Textarea placeholder={t.post.descriptionPlaceholder} className="min-h-[200px] rounded-[2rem] border-none bg-white p-6 text-base font-medium leading-relaxed shadow-sm ring-1 ring-black/[0.03] focus:ring-2 focus:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="grid grid-cols-2 gap-6">
               <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1 mb-2 block">{t.post.category}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-16 rounded-2xl border-none bg-white px-6 font-bold shadow-sm ring-1 ring-black/[0.03]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {Object.entries(t.categories).map(([val, label]) => (
                            <SelectItem key={val} value={val} className="py-3 font-bold">{label}</SelectItem>
                          ))}
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
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1 mb-2 block">{t.post.status}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-16 rounded-2xl border-none bg-white px-6 font-bold shadow-sm ring-1 ring-black/[0.03]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {Object.entries(t.conditions).map(([val, label]) => (
                            <SelectItem key={val} value={val} className="py-3 font-bold">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
            </section>

            <section className="rounded-[2.5rem] bg-foreground/5 p-8">
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-8">
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-foreground/60">{t.post.pointsLabel}</FormLabel>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black italic tracking-tighter text-primary">{field.value}</span>
                        <span className="text-xs font-black text-foreground/40 uppercase">pts</span>
                      </div>
                    </div>
                    <FormControl>
                      <Slider min={0} max={1000} step={10} value={[field.value]} onValueChange={(vals) => field.onChange(vals[0])} className="py-4" />
                    </FormControl>
                    <p className="mt-4 text-[10px] font-bold text-muted-foreground text-center opacity-60">{t.post.rewardTip}</p>
                  </FormItem>
                )}
              />
            </section>

            <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
              <Button 
                type="submit" 
                className="h-16 w-full rounded-2xl bg-primary text-foreground font-black text-base shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editId ? t.post.update : t.post.publish)}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
