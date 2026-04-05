
'use client';

import * as React from 'react';
import { Header } from '@/components/swap-norge/Header';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where } from 'firebase/firestore';
import type { SwapItem } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Settings, Package, History, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();

  const userItemsRef = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'items'), where('sellerId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: items } = useCollection<SwapItem>(userItemsRef);

  if (isUserLoading) return <div className="flex h-screen items-center justify-center">Laster profil...</div>;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 pb-24 p-4">
        <div className="container mx-auto max-w-2xl">
          
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold">SwapNorge Profil</h1>
            <Button variant="ghost" size="icon">
              <Settings className="h-6 w-6" />
            </Button>
          </header>

          <div className="mb-8 flex flex-col items-center">
            <Avatar className="h-24 w-24 ring-4 ring-primary ring-offset-4">
              <AvatarImage src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} />
              <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-2xl font-bold">{user?.displayName || 'Anonym Bruker'}</h2>
            <p className="text-sm text-muted-foreground">Medlem siden {new Date().getFullYear()}</p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <Card className="border-none bg-primary text-foreground">
              <CardContent className="flex flex-col items-center justify-center p-4">
                <span className="text-3xl font-black">750</span>
                <span className="text-xs font-medium uppercase tracking-tighter">{t.profile.balance}</span>
              </CardContent>
            </Card>
            <Card className="border-none bg-white">
              <CardContent className="flex flex-col items-center justify-center p-4">
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-black">4.9</span>
                  <Star className="h-5 w-5 fill-primary text-primary" />
                </div>
                <span className="text-xs font-medium uppercase tracking-tighter">{t.profile.reputation}</span>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-white p-1">
              <TabsTrigger value="items" className="rounded-lg">{t.profile.myItems}</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg">{t.profile.history}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="mt-6">
              {items && items.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {items.map(item => (
                    <Card key={item.id} className="overflow-hidden border-none shadow-sm">
                      <div className="aspect-square bg-muted">
                        {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />}
                      </div>
                      <CardHeader className="p-3">
                        <CardTitle className="line-clamp-1 text-sm">{item.title}</CardTitle>
                        <Badge variant="secondary" className="w-fit text-[10px]">
                          {item.status === 'available' ? 'Tilgjengelig' : 'Byttet'}
                        </Badge>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center rounded-2xl bg-white text-muted-foreground">
                  <Package className="mb-2 h-8 w-8 opacity-20" />
                  <p>{t.profile.noPosts}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
               <div className="flex h-32 flex-col items-center justify-center rounded-2xl bg-white text-muted-foreground">
                  <History className="mb-2 h-8 w-8 opacity-20" />
                  <p>Ingen byttehistorikk ennå.</p>
                </div>
            </TabsContent>
          </Tabs>

          <Button variant="ghost" className="mt-12 w-full text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2 h-4 w-4" />
            Logg ut
          </Button>
        </div>
      </main>
    </div>
  );
}
