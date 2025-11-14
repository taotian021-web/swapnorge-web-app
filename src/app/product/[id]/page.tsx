
'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { allProducts, allSellers } from '@/lib/data';
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

function getProductData(id: string): { product: Product; seller: Seller } | null {
  const product = allProducts.find((p) => p.id === id);
  if (!product) {
    return null;
  }
  const seller = allSellers.find((s) => s.id === product.sellerId);
  if (!seller) {
    return null;
  }
  return { product, seller };
}

export default function ProductPage({ params }: { params: { id: string } }) {
  // Data is fetched synchronously since this is a client component and data is local.
  const data = getProductData(params.id);

  if (!data) {
    // This will be handled on the client side. We can show a loading or not found state.
    // To avoid hydration issues, we should return a consistent structure.
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

  const { product, seller } = data;

  if (!product || !seller) {
    notFound();
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
                <Button size="lg" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Contact Seller
                </Button>
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
                  <CardTitle>Community Reviews ({product.reviews.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {product.reviews.length > 0 ? (
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
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Price Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  {product.priceComparisons.length > 0 ? (
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
