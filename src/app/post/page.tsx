
'use client';

import * as React from 'react';
import Image from 'next/image';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  const { user, isUserLoading } = useSupabaseUser();
  const { profile } = useSupabaseProfile(user?.id ?? null);
  // Dev-only fallback user/profile for local testing when not logged in
  const devUser = React.useMemo(() => ({ id: 'dev-user', email: 'dev@example.com' }), []);
  const devProfile = React.useMemo(() => ({ displayName: 'Dev Tester', stats: { points: 100, reputation: 5.0 } }), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = ((searchParams?.get('lang')) || 'no') as Language;
  const editId = searchParams?.get('edit');
  const t = getTranslations(lang);
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [coords, setCoords] = React.useState<{lat: number, lng: number} | null>(null);
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [videoUrl, setVideoUrl] = React.useState('');
  const [selectedVideo, setSelectedVideo] = React.useState<File | null>(null);
  const [videoPreview, setVideoPreview] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const xhrRef = React.useRef<XMLHttpRequest | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = React.useState(false);
  const [, setAuthCheckComplete] = React.useState(false);

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

  // 🔧 FIX #1: Properly check authentication state after loading completes
  // Previously: Showed login prompt even while loading, causing UX issue
  React.useEffect(() => {
    // Only show login prompt after auth state has finished loading
    // and user is confirmed to NOT be logged in (and not in edit mode)
    if (!isUserLoading && !user && !editId) {
      setShowLoginPrompt(true);
    }
    // Mark auth check as complete once loading finishes
    if (!isUserLoading) {
      setAuthCheckComplete(true);
    }
  }, [user, isUserLoading, editId]);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          // Geolocation permission denied or unavailable; silently ignore.
        }
      );
    }
  }, []);

  React.useEffect(() => {
    if (!selectedImage) {
      setImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedImage);
  }, [selectedImage]);

  React.useEffect(() => {
    if (!selectedVideo) {
      setVideoPreview(null);
      return;
    }

    const url = URL.createObjectURL(selectedVideo);
    setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedVideo]);

  const onSubmit = async (values: FormValues) => {
    // In development allow testing without login by using a dev fallback user/profile
    const effectiveUser = user || (process.env.NODE_ENV === 'development' ? devUser : null);
    const effectiveProfile = profile || (process.env.NODE_ENV === 'development' ? devProfile : null);
    if (!effectiveUser || !supabase || !effectiveProfile) return;
    setIsSubmitting(true);
    
    try {
      const finalDescription = values.description + (videoUrl ? `\n\n${t.post.videoLinkLabel}: ${videoUrl}` : '');
      let uploadedVideoUrl: string | null = null;
      if (selectedVideo) {
        setUploadError(null);
        // perform upload with cancel/retry support
        const upload = (file: File) => {
          return new Promise<string>((resolve, reject) => {
            const fileExt = file.name.split('.').pop();
            const filePath = `videos/${effectiveUser.id}/${Date.now()}.${fileExt}`;
            // Use server-side signed upload endpoint to avoid exposing service keys
            const storageUrl = `/api/upload`;
            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setUploadProgress(pct);
              }
            };
            xhr.onload = () => {
              xhrRef.current = null;
              if (xhr.status >= 200 && xhr.status < 300) {
                setUploadProgress(null);
                const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')}/storage/v1/object/public/videos/${encodeURIComponent(filePath)}`;
                resolve(publicUrl);
              } else {
                setUploadProgress(null);
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            };
            xhr.onerror = () => {
              xhrRef.current = null;
              setUploadProgress(null);
              reject(new Error('Network error during upload'));
            };
            xhr.open('POST', storageUrl);
            xhr.setRequestHeader('x-filename', `${Date.now()}.${fileExt}`);
            xhr.setRequestHeader('x-user-id', effectiveUser.id);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
          });
        };

        try {
          uploadedVideoUrl = await upload(selectedVideo);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Upload failed';
          setUploadError(errorMessage);
          throw err;
        }
      }
      if (editId) {
        const updatePayload: Partial<Omit<SwapItem, 'id'>> = {
          title: values.title,
          description: finalDescription,
          points: values.points,
          category: values.category,
          condition: values.condition as ItemCondition,
        };

        if (imagePreview) {
          updatePayload.imageUrl = imagePreview;
        }
        if (uploadedVideoUrl) {
          // append or set videoUrls field
          // If existing items have videoUrls as JSON array, update accordingly
          // For simplicity, set videoUrls to single-item array here
          // @ts-expect-error SwapItem type doesn't include videoUrls
          updatePayload.videoUrls = [uploadedVideoUrl];
        }

        await supabase
          .from('items')
          .update(updatePayload)
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
          description: finalDescription,
          points: values.points,
          category: values.category,
          condition: values.condition as ItemCondition,
          imageUrl: imagePreview || matchedImage,
          // include uploaded video url if present
          // @ts-expect-error SwapItem type doesn't include videoUrls
          videoUrls: uploadedVideoUrl ? [uploadedVideoUrl] : (videoUrl ? [videoUrl] : []),
          sellerId: effectiveUser.id,
          sellerName: effectiveProfile.displayName || ((effectiveUser as { user_metadata?: { full_name?: string } }).user_metadata?.full_name) || 'Anonym',
          sellerRating: effectiveProfile.stats?.reputation || 5.0,
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
        await supabase.from('profiles').update({ stats: updatedStats }).eq('id', effectiveUser.id);

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
    <>
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="rounded-[2.5rem] border-none bg-white p-8 shadow-2xl ring-1 ring-black/[0.05]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">{lang === 'no' ? 'Logg inn kreves' : 'Login Required'}</DialogTitle>
            <DialogDescription className="text-base text-foreground mt-3">
              {lang === 'no' 
                ? 'Du må logge inn eller registrere deg for å publisere en annonse.' 
                : 'You need to login or register to publish an item.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Button 
              onClick={() => {
                setShowLoginPrompt(false);
                router.push(`/profile?lang=${lang}`);
              }}
              className="h-14 rounded-2xl bg-primary text-foreground font-black active-scale"
            >
              {lang === 'no' ? 'Logg inn / Registrer' : 'Login / Register'}
            </Button>
            <Button 
              variant="ghost"
              onClick={() => router.push(`/?lang=${lang}`)}
              className="h-14 rounded-2xl border border-input font-black"
            >
              {lang === 'no' ? 'Tilbake til hjemmet' : 'Back to Home'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex min-h-screen w-full flex-col bg-background pb-24">
      <main className="container mx-auto max-w-2xl px-4 pt-4 pb-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-4">
            
            <section className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
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

              <section className="rounded-[2.5rem] border border-black/[0.04] bg-white p-5 shadow-sm ring-1 ring-black/[0.03]">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.35em] text-muted-foreground opacity-80 mb-2">
                      {t.post.mediaLabel}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{t.post.mediaHelp}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[2rem] border border-dashed border-black/[0.08] bg-muted/80 p-5 text-center">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" width={224} height={224} className="mx-auto rounded-3xl object-cover" />
                    ) : (
                      <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                          📸
                        </div>
                        <p>{t.post.photoPlaceholder}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex h-16 items-center justify-center rounded-2xl bg-white text-sm font-black uppercase tracking-[0.2em] text-primary shadow-sm ring-1 ring-black/[0.05] cursor-pointer transition hover:bg-primary/5">
                      {t.post.uploadPhoto}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          setSelectedImage(file);
                        }}
                      />
                    </label>
                    <div className="grid gap-2">
                      <Input
                        value={videoUrl}
                        onChange={(event) => setVideoUrl(event.target.value)}
                        placeholder={t.post.videoUrlPlaceholder}
                        className="h-16 rounded-2xl border-none bg-white px-6 text-base font-bold shadow-sm ring-1 ring-black/[0.03]"
                      />
                      <p className="text-xs text-muted-foreground">{t.post.videoHelp}</p>
                      <label className="flex h-12 items-center justify-center rounded-2xl bg-white text-sm font-black uppercase tracking-[0.2em] text-primary shadow-sm ring-1 ring-black/[0.05] cursor-pointer transition hover:bg-primary/5 mt-2">
                        {t.post.uploadVideo}
                        <input
                          type="file"
                          accept="video/*"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            if (file && file.size > 50 * 1024 * 1024) { // 50MB limit
                              toast({ title: 'Video too large. Max 50MB.' });
                              return;
                            }
                            setSelectedVideo(file);
                          }}
                        />
                      </label>
                        
                    </div>
                  </div>
                </div>
                {videoPreview && (
                  <div className="mt-4">
                    <video src={videoPreview} className="max-h-40 w-full rounded-lg object-cover" controls />
                    {uploadProgress !== null && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-muted/40">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1 rounded bg-destructive text-destructive-foreground text-xs font-bold"
                          onClick={() => {
                            if (xhrRef.current) {
                              xhrRef.current.abort();
                              xhrRef.current = null;
                              setUploadProgress(null);
                              setUploadError('Upload cancelled');
                            }
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {uploadError && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="text-sm text-destructive">{uploadError}</div>
                        <button
                          type="button"
                          className="px-3 py-1 rounded bg-primary text-foreground text-xs font-bold"
                          onClick={() => {
                            setUploadError(null);
                            setSelectedVideo(selectedVideo);
                          }}
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
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

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      // create tiny in-memory files for testing
                      const imgBytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));
                      const imgFile = new File([imgBytes], 'dev-test.png', { type: 'image/png' });
                      setSelectedImage(imgFile);
                      const vidBytes = new Uint8Array([0,0,0,0,0,0,0,0]);
                      const vidFile = new File([vidBytes], 'dev-test.mp4', { type: 'video/mp4' });
                      setSelectedVideo(vidFile);
                      // submit with current form values
                      await onSubmit(form.getValues() as FormValues);
                    } catch (err) {
                      console.error('Dev auto-upload failed', err);
                    }
                  }}
                >
                  Dev: 自动上传测试
                </Button>
              </div>
            )}
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
    </>
  );
}
