
'use client';

import * as React from 'react';
import { Header } from '@/components/neighbor-buy/Header';
import { useFirestore, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { collection, doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Share2, Trash2, Award, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';

function UserListings() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);

  const userProductsRef = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'products') : null),
    [user, firestore]
  );
  const { data: products, isLoading } = useCollection<Product>(userProductsRef);

  const handleToggleShare = (product: Product & { id: string }) => {
    if (!user || !firestore) return;
    
    const isNowPublic = !product.isPublic;
    
    const userDocRef = doc(firestore, 'users', user.uid, 'products', product.id);

    if (isNowPublic) {
      const publicDocRef = doc(firestore, 'products', product.id);
      const publicProductData = { ...product, isPublic: true, sellerId: user.uid };
      delete (publicProductData as any).id;
      
      setDocumentNonBlocking(publicDocRef, publicProductData, {});
      updateDocumentNonBlocking(userDocRef, { isPublic: true });

       toast({
        title: t.profile.itemSharedTitle,
        description: t.profile.itemSharedDesc(product.name),
      });
    } else {
      const publicDocRef = doc(firestore, 'products', product.id);
      deleteDocumentNonBlocking(publicDocRef);
      updateDocumentNonBlocking(userDocRef, { isPublic: false });

       toast({
        title: t.profile.itemPrivateTitle,
        description: t.profile.itemPrivateDesc(product.name),
      });
    }
  };
  
  const handleDelete = (product: Product & { id: string }) => {
     if (!user || !firestore) return;
     
     const userDocRef = doc(firestore, 'users', user.uid, 'products', product.id);
     deleteDocumentNonBlocking(userDocRef);

     if (product.isPublic) {
        const publicDocRef = doc(firestore, 'products', product.id);
        deleteDocumentNonBlocking(publicDocRef);
     }

     toast({
        title: t.profile.itemDeletedTitle,
        description: t.profile.itemDeletedDesc(product.name),
        variant: 'destructive'
      });
  }

  if (isLoading) {
    return (
       <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}><div className="h-64 w-full animate-pulse bg-muted"/></Card>
        ))}
       </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="mt-6 flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
        <p className="text-center text-muted-foreground">{t.profile.noListings}</p>
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
                className="rounded-t-lg object-cover"
              />
              <Badge variant={product.isPublic ? 'default' : 'secondary'} className="absolute right-2 top-2">
                {product.isPublic ? t.profile.shared : t.profile.draft}
              </Badge>
            </div>
          </CardContent>
          <CardHeader className="p-4">
            <CardTitle className="truncate text-lg">{product.name}</CardTitle>
            <CardDescription>¥{product.price.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-2 p-4">
             <Button
              size="sm"
              variant={product.isPublic ? 'outline' : 'default'}
              onClick={() => handleToggleShare(product)}
              className="flex-1"
            >
              <Share2 className="mr-2 h-4 w-4" />
              {product.isPublic ? t.profile.unshare : t.profile.share}
            </Button>
            <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(product)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t.profile.delete}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const [clientSideUser, setClientSideUser] = React.useState<typeof user | null>(null);
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);

  React.useEffect(() => {
    // This effect runs only on the client, after hydration
    if (user) {
      setClientSideUser(user);
    }
  }, [user]);
  
  // Mock data for user level and join date
  const membershipLevel = t.profile.level;
  const joinDate = clientSideUser?.metadata.creationTime ? new Date(clientSideUser.metadata.creationTime) : null;

  if (isUserLoading || !clientSideUser) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-8 md:px-8">
            <p>{t.profile.loading}</p>
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
          <div className="container mx-auto max-w-6xl px-4 py-8 md:px-8">
            <p>{t.profile.loginPrompt}</p>
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
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="items-center text-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={clientSideUser.photoURL || `https://i.pravatar.cc/150?u=${clientSideUser.uid}`} alt="User" />
                    <AvatarFallback>{clientSideUser.isAnonymous ? t.profile.anonymousFallback : (clientSideUser.displayName || t.profile.userFallback).charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-2xl">
                    {clientSideUser.isAnonymous ? t.profile.anonymousUser : clientSideUser.displayName || t.profile.myProfile}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{clientSideUser.email || `${t.profile.userIdPrefix}: ${clientSideUser.uid.substring(0, 8)}...`}</p>
                </CardHeader>
                <CardContent>
                  <Separator />
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center">
                      <Award className="mr-3 h-5 w-5 text-primary" />
                      <span>{t.profile.communityLevel}:</span>
                      <Badge variant="secondary" className="ml-auto">{membershipLevel}</Badge>
                    </div>
                    {joinDate && (
                       <div className="flex items-center">
                         <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                         <span>{t.profile.joinDate}:</span>
                         <span className="ml-auto text-muted-foreground">{format(joinDate, 'yyyy-MM-dd')}</span>
                       </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <div >
                <h3 className="text-2xl font-bold">{t.profile.myListings}</h3>
                <p className="mt-2 text-muted-foreground">
                  {t.profile.myListingsDescription}
                </p>
                <UserListings />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
