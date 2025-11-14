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
    
    // This is a private draft, so we only update it in the user's subcollection
    const userDocRef = doc(firestore, 'users', user.uid, 'products', product.id);

    if (isNowPublic) {
      // If sharing, copy to the public collection and update the private one
      const publicDocRef = doc(firestore, 'products', product.id);
      const publicProductData = { ...product, isPublic: true, sellerId: user.uid };
      delete (publicProductData as any).id; // remove id from data
      
      setDocumentNonBlocking(publicDocRef, publicProductData, {});
      updateDocumentNonBlocking(userDocRef, { isPublic: true });

       toast({
        title: '商品已分享!',
        description: `"${product.name}" 现在对所有邻居可见啦。`,
      });
    } else {
      // If un-sharing, delete from the public collection and update the private one
      const publicDocRef = doc(firestore, 'products', product.id);
      deleteDocumentNonBlocking(publicDocRef);
      updateDocumentNonBlocking(userDocRef, { isPublic: false });

       toast({
        title: '商品已设为私密',
        description: `"${product.name}" 已从社区动态中撤下。`,
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
        title: '商品已删除',
        description: `"${product.name}" 已被成功删除。`,
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
        <p className="text-center text-muted-foreground">这里空空如也... <br/> 点击“发布”按钮，创建你的第一个邻里分享吧！</p>
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
                {product.isPublic ? '已分享' : '草稿'}
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
              {product.isPublic ? '取消分享' : '分享'}
            </Button>
            <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(product)}>
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  
  // Mock data for user level and join date
  const membershipLevel = "活跃邻居";
  const joinDate = user?.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date();

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-8 md:px-8">
            <p>正在加载用户信息...</p>
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
            <p>请先登录以查看您的个人主页。</p>
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
                    <AvatarImage src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="User" />
                    <AvatarFallback>{user.isAnonymous ? '匿' : (user.displayName || '用').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-2xl">
                    {user.isAnonymous ? '匿名用户' : user.displayName || '我的主页'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{user.email || `用户ID: ${user.uid.substring(0, 8)}...`}</p>
                </CardHeader>
                <CardContent>
                  <Separator />
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center">
                      <Award className="mr-3 h-5 w-5 text-primary" />
                      <span>社区等级:</span>
                      <Badge variant="secondary" className="ml-auto">{membershipLevel}</Badge>
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                      <span>加入日期:</span>
                      <span className="ml-auto text-muted-foreground">{format(joinDate, 'yyyy-MM-dd')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <div >
                <h3 className="text-2xl font-bold">我的发布</h3>
                <p className="mt-2 text-muted-foreground">
                  在这里管理你创建的草稿。点击“分享”即可让它出现在社区动态中。
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
