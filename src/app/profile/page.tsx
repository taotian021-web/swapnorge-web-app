'use client';

import * as React from 'react';
import { Header } from '@/components/neighbor-buy/Header';
import { useFirestore, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { collection, doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Share2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function UserListings() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProductsRef = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'products') : null),
    [user, firestore]
  );
  const { data: products, isLoading } = useCollection<Product>(userProductsRef);

  const handleToggleShare = (product: Product & { id: string }) => {
    if (!user || !firestore) return;
    
    const isNowPublic = !product.isPublic;
    
    // Update the document in the user's private collection
    const userDocRef = doc(firestore, 'users', user.uid, 'products', product.id);
    updateDocumentNonBlocking(userDocRef, { isPublic: isNowPublic });

    if (isNowPublic) {
      // If sharing, copy to the public collection
      const publicDocRef = doc(firestore, 'products', product.id);
      const publicProductData = { ...product, isPublic: true, sellerId: user.uid };
      delete (publicProductData as any).id;
      setDocumentNonBlocking(publicDocRef, publicProductData, {});
       toast({
        title: 'Product Shared!',
        description: `"${product.name}" is now visible to the community.`,
      });
    } else {
      // If un-sharing, delete from the public collection
      const publicDocRef = doc(firestore, 'products', product.id);
      deleteDocumentNonBlocking(publicDocRef);
       toast({
        title: 'Product Unshared',
        description: `"${product.name}" is no longer visible to the community.`,
      });
    }
  };

  if (isLoading) {
    return (
       <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}><div className="h-64 w-full bg-muted animate-pulse"/></Card>
        ))}
       </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="mt-6 flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
        <p className="text-center text-muted-foreground">You have no listings yet. <br/> Create one by clicking the "Post" button!</p>
      </div>
    );
  }
  
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id}>
          <CardContent className="p-0">
            <div className="relative h-40 w-full">
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                fill
                className="object-cover rounded-t-lg"
              />
              <Badge variant={product.isPublic ? 'default' : 'secondary'} className="absolute right-2 top-2">
                {product.isPublic ? 'Public' : 'Draft'}
              </Badge>
            </div>
          </CardContent>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <CardDescription>${product.price.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardFooter className="p-4 flex gap-2">
             <Button
              size="sm"
              variant={product.isPublic ? 'outline' : 'default'}
              onClick={() => handleToggleShare(product)}
              className="flex-1"
            >
              <Share2 className="mr-2 h-4 w-4" />
              {product.isPublic ? 'Unshare' : 'Share'}
            </Button>
            <Button size="sm" variant="destructive" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto max-w-4xl px-4 py-8 md:px-8">
            <p>Loading user profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto max-w-4xl px-4 py-8 md:px-8">
            <p>Please sign in to view your profile.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-8 md:px-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="User" />
                <AvatarFallback>{user.isAnonymous ? 'A' : (user.displayName || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {user.isAnonymous ? 'Anonymous User' : user.displayName || 'My Profile'}
                </CardTitle>
                <p className="text-muted-foreground">{user.email || `User ID: ${user.uid}`}</p>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="my-6" />
              <div>
                <h3 className="text-xl font-semibold">My Listings</h3>
                <p className="mt-2 text-muted-foreground">
                  These are items you've created. You can choose to share them with the community.
                </p>
                <UserListings />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
