
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
import { useSupabase } from '@/supabase';
import { useSupabaseUser, useSupabaseProfile } from '@/supabase/hooks';
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
  const supabase = useSupabase();
  const { user } = useSupabaseUser();
  const { profile } = useSupabaseProfile(user?.id ?? null);
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
      if (editId && supabase) {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', editId)
          .single();

        if (!error && data) {
          if (user && data.sellerId !== user.id) {
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
  }, [editId, supabase, user, form, router, lang]);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn('Location access denied')
      );
    }
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (!user || !supabase || !profile) return;
    setIsSubmitting(true);
    
    try {
      if (editId) {
        await supabase
          .from('items')
          .update({
            title: values.title,
            description: values.description,
            points: values.points,
            category: values.category,
            condition: values.condition as ItemCondition,
          })
          .eq('id', editId);
        toast({ title: t.post.updateSuccess });
      } else {
        const categoryKeywords: Record<string, string> = {
          'Klær': 'vintage', 'Elektronikk': 'tech', 'Hjem': 'furniture', 'Bøker': 'book', 'Sport': 'bicycle'
        };
        
        const matchedImage = PlaceHolderImages.find(img => 
          img.imageHint.toLowerCase().includes(categoryKeywords[values.category] || 'product')
        )?.imageUrl || `https://picsum.photos/seed/${Date.now()}/800/800`;

        const newItem: Omit<SwapItem, 'id'> = {
          title: values.title,
          description: values.description,
          points: values.points,
          category: values.category,
          condition: values.condition as ItemCondition,
          imageUrl: matchedImage,
          sellerId: user.id,
          sellerName: profile.displayName || user.user_metadata?.full_name || 'Anonym',
          sellerRating: profile.stats?.reputation || 5.0,
          postedDate: new Date().toISOString(),
          isPublic: true,
          location: { latitude: coords?.lat || 59.91, longitude: coords?.lng || 10.75, city: 'Oslo' },
          status: 'available',
          views: 0,
          likes: 0,
        };
        
        const { error } = await supabase.from('items').insert(newItem).select().single();
        if (error) throw error;

        // Update user points
        const updatedStats = {
          ...(profile?.stats || { points: 100, reputation: 5.0, completedSwaps: 0, memberSince: '' }),
          points: (profile?.stats?.points || 100) + 20,
        };
        await supabase.from('profiles').update({ stats: updatedStats }).eq('id', user.id);

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
    <div className="flex min-h-screen w-full flex-col bg-background pb-40">
      <main className="container mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8 rounded-[3rem] bg-white shadow-xl ring-1 ring-black/[0.04] p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-muted-foreground mb-3">
            {editId ? t.post.update : t.post.publish}
          </p>
          <h1 className="text-3xl font-black tracking-tight leading-tight">
            {editId ? t.post.update : t.post.title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t.post.rewardTip}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 pb-8">
            
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

            <section className="grid gap-6 sm:grid-cols-2">
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

            <section className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-black/[0.03]">
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

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end mb-20">
              <Button type="button" variant="secondary" className="w-full rounded-2xl px-6 py-4 font-black sm:w-auto" onClick={() => router.push(`/?lang=${lang}`)}>
                {t.post.cancel}
              </Button>
              <Button 
                type="submit" 
                className="w-full rounded-2xl bg-primary px-6 py-4 text-base font-black text-foreground shadow-xl active-scale sm:w-auto"
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
