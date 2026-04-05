
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, initiateAnonymousSignIn, useAuth } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import type { SwapItem, UserProfile, Review } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Star, LogIn, Package, Medal, Edit3, Leaf, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import { updateProfile } from 'firebase/auth';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [newDisplayName, setNewDisplayName] = React.useState('');

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

  const favQuery = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'favorites') : null),
    [user, firestore]
  );
  const { data: favoriteDocs } = useCollection<{itemId: string}>(favQuery);

  const [favoriteItems, setFavoriteItems] = React.useState<SwapItem[]>([]);
  
  React.useEffect(() => {
    async function fetchFavs() {
      if (!favoriteDocs || !firestore) {
        setFavoriteItems([]);
        return;
      }
      const results: SwapItem[] = [];
      for (const fav of favoriteDocs) {
        const d = await getDoc(doc(firestore, 'items', fav.itemId));
        if (d.exists()) {
          results.push({ ...d.data() as SwapItem, id: d.id });
        }
      }
      setFavoriteItems(results);
    }
    fetchFavs();
  }, [favoriteDocs, firestore]);

  // 移除了 orderBy 以避免索引权限报错，改为客户端排序
  const reviewsRef = useMemoFirebase(
    () => (user && firestore ? query(
      collection(firestore, 'reviews'), 
      where('toId', '==', user.uid)
    ) : null),
    [user, firestore]
  );
  const { data: rawReviews } = useCollection<Review>(reviewsRef);

  const reviews = React.useMemo(() => {
    if (!rawReviews) return [];
    return [...rawReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  }, [rawReviews]);

  const handleSignIn = () => {
    if (auth) initiateAnonymousSignIn(auth);
  };

  const handleSaveProfile = async () => {
    if (!user || !firestore || !newDisplayName) return;
    try {
      await updateProfile(user, { displayName: newDisplayName });
      await updateDoc(doc(firestore, 'users', user.uid), { displayName: newDisplayName });
      toast({ title: lang === 'no' ? 'Profil oppdatert!' : 'Profile updated!' });
      setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
    }
  };

  const completedSwaps = profileData?.stats?.completedSwaps ?? 0;
  const co2Saved = completedSwaps * 2.45;

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8 text-center pb-64">
        <div className="mb-8 h-24 w-24 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
          <Star className="h-12 w-12 text-foreground" />
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter mb-4">{t.profile.loginPrompt}</h2>
        <Button onClick={handleSignIn} className="h-16 w-full max-w-sm rounded-2xl bg-foreground text-primary font-black text-lg shadow-2xl active:scale-95 transition-transform">
          <LogIn className="mr-2 h-6 w-6" />
          Kom i gang nå
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background p-4 pb-44">
      <div className="container mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black italic tracking-tighter">Swap<span className="text-primary">Norge</span></h1>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03]">
                <Edit3 className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-none bg-white p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tighter">{t.profile.editProfile}</DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">{t.profile.displayNameLabel}</Label>
                <Input 
                  value={newDisplayName} 
                  placeholder={profileData?.displayName}
                  onChange={(e) => setNewDisplayName(e.target.value)} 
                  className="h-14 rounded-2xl" 
                />
              </div>
              <DialogFooter>
                <Button onClick={handleSaveProfile} className="h-14 w-full rounded-2xl bg-primary text-foreground font-black shadow-lg">{t.profile.saveChanges}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mb-10 flex flex-col items-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-[2.5rem] bg-white p-1 shadow-2xl ring-1 ring-black/[0.05]">
              <Avatar className="h-full w-full rounded-[2.2rem]">
                <AvatarImage src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} />
                <AvatarFallback className="text-3xl font-black">{profileData?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500 text-white shadow-xl ring-4 ring-background">
              <Medal className="h-5 w-5 fill-current" />
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight">{profileData?.displayName || 'Nabolagsvenn'}</h2>
        </div>

        <Card className="mb-10 border-none bg-green-50 shadow-sm rounded-[2.5rem] ring-1 ring-green-100">
           <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                 <Leaf className="h-4 w-4 text-green-600" />
                 <h3 className="text-sm font-black uppercase tracking-widest text-green-800">{t.profile.impactTitle}</h3>
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <span className="text-4xl font-black italic tracking-tighter text-green-700">{co2Saved.toFixed(1)}kg</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-800/60 mt-1">{t.profile.co2Saved}</p>
                 </div>
                 <div>
                    <span className="text-4xl font-black italic tracking-tighter text-green-700">{completedSwaps}</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-800/60 mt-1">{t.profile.itemsSaved}</p>
                 </div>
              </div>
           </CardContent>
        </Card>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-3 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/[0.03]">
            <TabsTrigger value="items" className="rounded-xl font-black text-[8px] uppercase tracking-widest py-3">Mine</TabsTrigger>
            <TabsTrigger value="favs" className="rounded-xl font-black text-[8px] uppercase tracking-widest py-3">Lagret</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-xl font-black text-[8px] uppercase tracking-widest py-3">Omtaler</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items">
            {items && items.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {items.map(item => <ItemCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center rounded-[3rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-10 text-center border-2 border-dashed border-muted/50">
                <Package className="mb-4 h-12 w-12 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4">{t.profile.noPosts}</p>
                <Button asChild className="rounded-2xl bg-primary text-foreground font-black px-6 h-12 shadow-lg"><Link href={`/post?lang=${lang}`}>{t.post.title}</Link></Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favs">
             {favoriteItems.length > 0 ? (
               <div className="grid grid-cols-2 gap-4">
                 {favoriteItems.map(item => <ItemCard key={item.id} item={item} />)}
               </div>
             ) : (
               <div className="flex h-48 flex-col items-center justify-center rounded-[3rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-10 text-center border-2 border-dashed border-muted/50">
                  <Heart className="mb-4 h-12 w-12 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Ingen lagrede gjenstander</p>
               </div>
             )}
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map(rev => (
                  <Card key={rev.id} className="border-none bg-white shadow-sm rounded-[2rem] ring-1 ring-black/[0.03] overflow-hidden">
                    <CardContent className="p-6">
                       <p className="text-sm font-bold italic leading-relaxed text-foreground/80">"{rev.content}"</p>
                       <div className="mt-4 flex items-center justify-between border-t border-black/[0.03] pt-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.profile.vouchedBy} {rev.fromName}</span>
                          <div className="flex gap-0.5">
                             {[...Array(5)].map((_, i) => <Star key={i} className="h-2.5 w-2.5 fill-primary text-primary" />)}
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex h-48 items-center justify-center rounded-[2rem] bg-white text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-40 shadow-sm ring-1 ring-black/[0.03]">
                   {t.profile.noReviews}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={() => auth?.signOut()} variant="ghost" className="mt-12 w-full rounded-2xl h-16 font-black text-xs uppercase tracking-widest text-destructive hover:bg-destructive/5">
          <LogOut className="mr-2 h-5 w-5" />
          Logg ut
        </Button>
      </div>
    </div>
  );
}
