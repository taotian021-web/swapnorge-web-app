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
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';

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


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      images: undefined,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t.post.loginPrompt,
      });
      return;
    }
    
    // For now, we'll use a placeholder for image URL
    const imageUrl = 'https://picsum.photos/seed/new-item/600/400';

    const newProduct = {
      name: values.name,
      description: values.description,
      price: values.price,
      category: values.category,
      imageUrl: imageUrl, // Placeholder
      imageHint: values.category.toLowerCase(), // Simple hint from category
      images: [{ id: '1', url: imageUrl, hint: values.category.toLowerCase() }], // Placeholder
      sellerId: user.uid, // Use current user's ID
      postedDate: new Date().toISOString(),
      isPublic: false, // Initially created as a private draft
      reviews: [],
      priceComparisons: [],
    };

    try {
      const userProductsRef = collection(firestore, 'users', user.uid, 'products');
      await addDocumentNonBlocking(userProductsRef, newProduct);

      toast({
        title: t.post.draftSavedTitle,
        description: t.post.groupBuyDraftSavedDesc,
      });
      
      router.push(`/profile?lang=${lang}`);
      
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: t.post.errorTitle,
        description: t.post.errorDesc,
      });
    }
  };
  
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


                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? t.post.submitting : t.post.saveDraft}
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
