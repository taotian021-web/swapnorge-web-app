'use client';

import * as React from 'react';
import { Header } from '@/components/neighbor-buy/Header';
import { useFirestore, useUser, useCollection, useMemoFirebase, WithId } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


function UserPosts() {
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'cn') as Language;
  const t = getTranslations(lang);

  const userProductsRef = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'users', user.uid, 'products'), orderBy('postedDate', 'desc')) : null),
    [user, firestore]
  );
  const { data: products, isLoading } = useCollection<Product>(userProductsRef);

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
        <p className="text-center text-muted-foreground">{t.profile.noPosts}</p>
      </div>
    );
  }
  
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader className='p-4'>
            <CardTitle className="truncate text-base">{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
             <p className="line-clamp-2">{product.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between p-4 pt-0">
             <Badge variant={product.isPublic ? 'default' : 'secondary'}>
                {product.isPublic ? "已发布" : "草稿"}
              </Badge>
              <span className='text-xs text-muted-foreground'>{new Date(product.postedDate).toLocaleDateString()}</span>
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
    if (user) {
      setClientSideUser(user);
    }
  }, [user]);

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:px-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={clientSideUser?.photoURL || `https://i.pravatar.cc/150?u=${clientSideUser?.uid}`} alt="User" />
              <AvatarFallback>{clientSideUser ? (clientSideUser.isAnonymous ? 'A' : (clientSideUser.displayName || 'U').charAt(0)) : '?'}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{clientSideUser ? (clientSideUser.isAnonymous ? '匿名用户' : clientSideUser.displayName || '邻里用户') : t.profile.loginPrompt}</h1>
              {clientSideUser && <p className="text-sm text-muted-foreground">{`用户ID: ${clientSideUser.uid.substring(0, 8)}...`}</p>}
            </div>
          </div>
            
          {clientSideUser ? (
             <Tabs defaultValue="posts" className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="posts">{t.profile.myPosts}</TabsTrigger>
                  <TabsTrigger value="likes">{t.profile.myLikes}</TabsTrigger>
                </TabsList>
                <TabsContent value="posts">
                  <UserPosts />
                </TabsContent>
                <TabsContent value="likes">
                   <div className="mt-6 flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                      <p className="text-center text-muted-foreground">你还没有赞过任何内容。</p>
                   </div>
                </TabsContent>
              </Tabs>
          ) : (
             <div className="mt-6 flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                <p className="text-center text-muted-foreground">{t.profile.loginPrompt}</p>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}
