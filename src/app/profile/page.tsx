
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, doc } from 'firebase/firestore';
import type { SwapItem, UserProfile } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Settings, Package, History, Star, QrCode, ScanLine, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';
import { initiateAnonymousSignIn } from '@/firebase';
import { useAuth } from '@/firebase';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();

  // Real-time user profile data
  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: profileData } = useDoc<UserProfile>(userProfileRef);

  const userItemsRef = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'items'), where('sellerId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: items } = useCollection<SwapItem>(userItemsRef);

  const handleSignIn = () => {
    if (auth) initiateAnonymousSignIn(auth);
  };

  if (isUserLoading) return <div className="flex h-screen items-center justify-center bg-background font-black italic">Laster SwapNorge...</div>;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <div className="mb-8 h-24 w-24 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
          <User className="h-12 w-12 text-foreground" />
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter mb-4">{t.profile.loginPrompt}</h2>
        <p className="mb-10 text-sm font-medium text-muted-foreground max-w-xs">
          Bli med i nabolagets største byttefellesskap og start din reise med 100 poeng i velkomstgave!
        </p>
        <Button onClick={handleSignIn} className="h-16 w-full max-w-sm rounded-2xl bg-foreground text-primary font-black text-lg shadow-2xl transition-transform active:scale-95">
          <LogIn className="mr-2 h-6 w-6" />
          Kom i gang nå
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background p-4 pb-32">
      <div className="container mx-auto max-w-2xl">
        
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black italic tracking-tighter">Swap<span className="text-primary">Norge</span></h1>
          <Button variant="ghost" size="icon" className="rounded-2xl bg-white shadow-sm">
            <Settings className="h-6 w-6" />
          </Button>
        </header>

        <div className="mb-10 flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-28 w-28 ring-4 ring-primary ring-offset-4 shadow-2xl">
              <AvatarImage src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} />
              <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white ring-4 ring-background">
              <Star className="h-4 w-4 fill-current" />
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight">{user?.displayName || (user.isAnonymous ? 'Nabolagsvenn' : 'Bruker')}</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Medlem siden 2024</p>
        </div>

        {/* Action Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-24 flex-col gap-2 rounded-3xl bg-white text-foreground shadow-sm ring-1 ring-black/[0.03] hover:bg-primary transition-all active:scale-95">
                <QrCode className="h-7 w-7" />
                <span className="text-xs font-black uppercase tracking-tighter">{t.profile.receivePoints}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-none p-8">
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-black">{t.profile.myQrTitle}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-6 py-6">
                <div className="relative h-64 w-64 rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-black/[0.05]">
                  <div className="grid h-full w-full grid-cols-4 grid-rows-4 gap-2 opacity-80">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-foreground' : 'bg-primary'}`} />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-xl bg-white p-1 shadow-lg">
                      <div className="h-full w-full rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-[10px] font-black">SN</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                    {t.profile.qrHint}
                  </p>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">ID: {user.uid.slice(0, 8)}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button asChild className="h-24 flex-col gap-2 rounded-3xl bg-foreground text-primary shadow-2xl transition-all active:scale-95">
            <Link href={`/scan?lang=${lang}`}>
              <ScanLine className="h-7 w-7" />
              <span className="text-xs font-black uppercase tracking-tighter text-white">{t.profile.scanToPay}</span>
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-10 grid grid-cols-2 gap-4">
          <Card className="border-none bg-primary text-foreground shadow-lg shadow-primary/20 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <span className="text-4xl font-black italic tracking-tighter">{profileData?.stats?.points ?? 0}</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">{t.profile.balance}</span>
            </CardContent>
          </Card>
          <Card className="border-none bg-white shadow-sm rounded-3xl ring-1 ring-black/[0.03]">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex items-center gap-1">
                <span className="text-4xl font-black italic tracking-tighter">{profileData?.stats?.reputation ?? 5.0}</span>
                <Star className="h-6 w-6 fill-primary text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">{t.profile.reputation}</span>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/[0.03]">
            <TabsTrigger value="items" className="rounded-xl font-bold py-2.5">{t.profile.myItems}</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-bold py-2.5">{t.profile.history}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items">
            {items && items.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {items.map(item => (
                  <Card key={item.id} className="overflow-hidden border-none bg-white shadow-sm rounded-3xl ring-1 ring-black/[0.03]">
                    <div className="aspect-square bg-muted relative">
                      <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/400`} alt={item.title} className="h-full w-full object-cover" />
                      <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-foreground font-black text-[10px] rounded-lg">
                        {item.points} pts
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h4 className="line-clamp-1 text-sm font-bold">{item.title}</h4>
                      <div className="mt-2 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.category}</span>
                         <div className={`h-2 w-2 rounded-full ${item.status === 'available' ? 'bg-green-500' : 'bg-orange-500'}`} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center rounded-[2.5rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03]">
                <Package className="mb-2 h-8 w-8 opacity-10" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">{t.profile.noPosts}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
             <div className="flex h-40 flex-col items-center justify-center rounded-[2.5rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03]">
                <History className="mb-2 h-8 w-8 opacity-10" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">Ingen byttehistorikk</p>
              </div>
          </TabsContent>
        </Tabs>

        <Button onClick={() => auth?.signOut()} variant="ghost" className="mt-12 w-full rounded-2xl h-14 font-black text-destructive hover:bg-destructive/10">
          <LogOut className="mr-2 h-5 w-5" />
          Logg ut
        </Button>
      </div>
    </div>
  );
}
import { User } from 'lucide-react';
