
'use client';

import { notFound, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { allSellers } from '@/lib/data';
import { Header } from '@/components/neighbor-buy/Header';
import { TrustScore } from '@/components/neighbor-buy/TrustScore';
import { StarRating } from '@/components/neighbor-buy/StarRating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone } from 'lucide-react';
import * as React from 'react';
import type { Product, Seller } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ProductPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const productRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'products', params.id) : null),
    [firestore, params.id]
  );
  const { data: product, isLoading } = useDoc<Product>(productRef);

  const seller = React.useMemo(() => {
    if (!product) return null;
    return allSellers.find((s) => s.id === product.sellerId) ?? null;
  }, [product]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-8 md:px-8">
            <p>Loading product...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!product || !seller) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-8 md:px-8">
            <p>Product not found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-8 md:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
              <div className="md:col-span-3">
                <Carousel className="w-full">
                  <CarouselContent>
                    {product.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <Card className="overflow-hidden">
                          <CardContent className="relative aspect-[3/2] p-0">
                            <Image
                              src={image.url}
                              alt={`${product.name} - image ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 60vw"
                              className="object-cover"
                              data-ai-hint={image.hint}
                            />
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              </div>

              <div className="space-y-6 md:col-span-2">
                <div className="space-y-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  <h1 className="font-headline text-3xl font-bold md:text-4xl">{product.name}</h1>
                  <p className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</p>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>

                <TrustScore seller={seller} />

                <div className="flex flex-col gap-2 sm:flex-row">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button size="lg" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Contact Seller
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Contact {seller.name}</AlertDialogTitle>
                        <AlertDialogDescription>
                           <div className="flex items-center gap-4 py-4">
                             <Avatar className="h-16 w-16">
                              <AvatarImage src={seller.avatarUrl} alt={seller.name} />
                              <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p>You can start a conversation with {seller.name} about '{product.name}'.</p>
                                <p className="text-xs text-muted-foreground mt-2">Real-time chat functionality is coming soon!</p>
                            </div>
                           </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                        <AlertDialogAction>Send Message</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Button size="lg" variant="outline" className="flex-1">
                    <Phone className="mr-2 h-5 w-5" />
                    Request Call
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Community Reviews ({product.reviews?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {product.reviews && product.reviews.length > 0 ? (
                      product.reviews.map((review, index) => (
                        <React.Fragment key={review.id}>
                          <div className="flex gap-4">
                            <Avatar>
                              <AvatarImage src={review.avatarUrl} alt={review.author} />
                              <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold">{review.author}</p>
                                <StarRating rating={review.rating} />
                              </div>
                              <p className="mt-1 text-muted-foreground">{review.comment}</p>
                            </div>
                          </div>
                          {index < product.reviews.length - 1 && <Separator />}
                        </React.Fragment>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No reviews yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                 {product.storeName && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Location</CardTitle>
                       <p className="text-sm text-muted-foreground">{product.storeName}</p>
                    </CardHeader>
                     <CardContent>
                       <p className="text-sm text-muted-foreground">Location data is available for proximity sorting.</p>
                     </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle>Price Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {product.priceComparisons && product.priceComparisons.length > 0 ? (
                      <ul className="space-y-3">
                        <li className="flex justify-between font-semibold text-primary">
                          <span>This Listing</span>
                          <span>${product.price.toFixed(2)}</span>
                        </li>
                        {product.priceComparisons.map((comp) => (
                          <li key={comp.store} className="flex justify-between text-muted-foreground">
                            <span>{comp.store}</span>
                            <span>${comp.price.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-muted-foreground">No comparisons available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}
