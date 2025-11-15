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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/neighbor-buy/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useUser, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import Link from 'next/link';
import type { Product, GeoLocation } from '@/lib/types';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  category: z.enum(['Food', 'Household', 'Electronics', 'Garden', 'Other']),
  images: z
    .custom<FileList>()
    .refine((files) => files.length > 0, 'At least one image is required.')
    .refine(
      (files) => Array.from(files).every((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function GroupBuyPage() {
  const { toast } = useToast();
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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
      price: 0,
      images: undefined,
    },
  });

  React.useEffect(() => {
    // Try to get user's location when component mounts
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('location', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn(`Could not get user location: ${error.message}`);
        // Optionally notify user that location couldn't be automatically fetched
      }
    );
  }, [form]);

  const onSubmit = async (values: FormValues, isPublic: boolean) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t.post.loginPrompt,
      });
      return;
    }

    if (isPublic && !values.location) {
        toast({
            variant: 'destructive',
            title: 'Location Missing',
            description: 'A location is required to share an item publicly. Please enable location services.',
        });
        return;
    }

    setIsSubmitting(true);
    
    // For now, we'll use a placeholder for image URL
    const imageUrl = 'https://picsum.photos/seed/new-item/600/400';
    
    try {
        const userProductsRef = collection(firestore, 'users', user.uid, 'products');
        const newDocRef = doc(userProductsRef); // Create a new document reference with a unique ID

        const newProduct: Omit<Product, 'id'> = {
          name: values.name,
          description: values.description,
          price: values.price,
          category: values.category,
          imageUrl: imageUrl, // Placeholder
          imageHint: values.category.toLowerCase(), // Simple hint from category
          images: [{ id: '1', url: imageUrl, hint: values.category.toLowerCase() }], // Placeholder
          sellerId: user.uid, // Use current user's ID
          postedDate: new Date().toISOString(),
          isPublic: isPublic,
          location: values.location,
          reviews: [],
          priceComparisons: [],
        };

        // Save to user's private collection
        await setDocumentNonBlocking(newDocRef, newProduct, { merge: true });

        if (isPublic) {
            // Also save to public collection
            const publicDocRef = doc(firestore, 'products', newDocRef.id);
            await setDocumentNonBlocking(publicDocRef, newProduct, { merge: true });
            toast({
                title: t.profile.itemSharedTitle,
                description: t.profile.itemSharedDesc(values.name),
            });
        } else {
            toast({
                title: t.post.draftSavedTitle,
                description: t.post.groupBuyDraftSavedDesc,
            });
        }
      
      router.push(`/profile?lang=${lang}`);
      
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

  const handleFormSubmit = (isPublic: boolean) => {
    return form.handleSubmit((values) => onSubmit(values, isPublic));
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews = Array.from(files).map((file) => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
      form.setValue('images', files);
    }
  };
  
  const removeImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
    
    const currentFiles = form.getValues('images');
    if (currentFiles) {
        const newFiles = new DataTransfer();
        Array.from(currentFiles)
          .filter((_, i) => i !== index)
          .forEach(file => newFiles.items.add(file));
        
        form.setValue('images', newFiles.files);

        if (fileInputRef.current) {
            fileInputRef.current.files = newFiles.files;
        }
    }
  };


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
          <Card>
            <CardHeader>
              <CardTitle>{t.post.groupBuyTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
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

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.post.priceLabel}</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="2.50" {...field} />
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
                          <FormLabel>{t.post.categoryLabel}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t.post.categoryPlaceholder} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Food">{t.categories.Food}</SelectItem>
                              <SelectItem value="Household">{t.categories.Household}</SelectItem>
                              <SelectItem value="Electronics">{t.categories.Electronics}</SelectItem>
                              <SelectItem value="Garden">{t.categories.Garden}</SelectItem>
                              <SelectItem value="Other">{t.categories.Other}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.post.imagesLabel}</FormLabel>
                        <FormControl>
                          <div className="flex w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-input bg-background p-6 hover:bg-accent/50">
                            <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center gap-2 text-muted-foreground">
                              <Upload className="h-8 w-8" />
                              <span>{t.post.uploadLabel}</span>
                            </label>
                            <Input
                              id="file-upload"
                              ref={fileInputRef}
                              type="file"
                              className="sr-only"
                              multiple
                              onChange={handleImageChange}
                              accept={ACCEPTED_IMAGE_TYPES.join(',')}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {t.post.imagesDescription}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {imagePreviews.map((src, index) => (
                        <div key={index} className="relative aspect-square">
                           <Image
                            src={src}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="rounded-md object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-1 top-1 h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-4 sm:flex-row">
                      <Link href={`/?lang=${lang}`} className="w-full sm:w-auto">
                         <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                           {t.post.cancel}
                         </Button>
                      </Link>
                      <Button type="button" onClick={handleFormSubmit(false)} variant="secondary" className="w-full flex-1" disabled={isSubmitting}>
                        {isSubmitting ? t.post.submitting : t.post.saveDraft}
                      </Button>
                      <Button type="button" onClick={handleFormSubmit(true)} className="w-full flex-1" disabled={isSubmitting}>
                        {isSubmitting ? t.post.submitting : t.header.startGroupBuy}
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
