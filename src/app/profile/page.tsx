
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, initiateAnonymousSignIn, useAuth } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, doc, getDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import type { SwapItem, UserProfile, Review } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Star, LogIn, Package, Edit3, Leaf, Heart, Sparkles, Mail, ShieldCheck, History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import { updateProfile, linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);
  const firestore = useFirestore();

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSecureOpen, setIsSecureOpen] = React.useState(false);
  const [newDisplayName, setNewDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLinking, setIsLinking] = React.useState(false);

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

  const historyQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'transactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(50)) : null),
    [user, firestore]
  );
  const { data: transactions } = useCollection<any>(historyQuery);

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

  const reviewsRef = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'reviews'), where('toId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: reviews } = useCollection<Review>(reviewsRef);

  const handleSignIn = () => {
    if (auth) initiateAnonymousSignIn(auth);
  };

  const handleSaveProfile = async () => {
    if (!user || !firestore || !newDisplayName) return;
    try {
      await updateProfile(user, { displayName: newDisplayName });
      await updateDoc(doc(firestore, 'users', user.uid), { displayName: newDisplayName });
      toast({ title: t.profile.updateSuccess });
      setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: t.profile.updateError });
    }
  };

  const handleLinkAccount = async () => {
    if (!user || !email || !password) return;
    setIsLinking(true);
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(user, credential);
      toast({ title: lang === 'no' ? 'Konto sikret!' : 'Account secured!' });
      setIsSecureOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLinking(false);
    }
  };

  const completedSwaps = profileData?.stats?.completedSwaps ?? 0;
  const co2Saved = completedSwaps * 2.45;
  const isAnonymous = user?.isAnonymous;

  if (isUserLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8 text-center pb-64">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mb-8 h-24 w-24 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
          <Star className="h-12 w-12 text-foreground" />
        </motion.div>
        <h2 className="text-3xl font-black italic tracking-tighter mb-4">{t.profile.loginPrompt}</h2>
        <Button onClick={handleSignIn} className="h-16 w-full max-sm rounded-2xl bg-foreground text-primary font-black text-lg shadow-2xl active-scale transition-transform">
          <LogIn className="mr-2 h-6 w-6" />
          {t.profile.getStarted}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background p-4 pt-8 pb-44">
      <div className="container mx-auto max-w-2xl">
        
        {/* Registration Incentive Banner */}
        <AnimatePresence>
          {isAnonymous && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 overflow-hidden rounded-[2.5rem] bg-foreground p-6 text-primary shadow-2xl ring-1 ring-white/10"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black italic tracking-tight">{t.profile.secureAccount}</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">{t.profile.secureAccountDesc}</p>
                  </div>
                </div>
                <Dialog open={isSecureOpen} onOpenChange={setIsSecureOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-primary/10 text-primary active-scale">
                      <Mail className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[3rem] border-none bg-white p-10 z-[150]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black italic tracking-tighter">{t.profile.secureAccount}</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.profile.emailLabel}</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl border-none bg-muted px-6 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.profile.passwordLabel}</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 rounded-2xl border-none bg-muted px-6 font-bold" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleLinkAccount} disabled={isLinking} className="h-14 w-full rounded-2xl bg-primary text-foreground font-black shadow-lg">
                        {isLinking ? '...' : t.profile.linkButton}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="mb-10 flex flex-col items-center">
          <div className="relative">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="h-32 w-32 rounded-[2.8rem] bg-white p-1 shadow-2xl ring-1 ring-black/[0.05]">
              <Avatar className="h-full w-full rounded-[2.5rem]">
                <AvatarImage src={profileData?.photoURL || user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} />
                <AvatarFallback className="text-3xl font-black">{profileData?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </motion.div>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-primary text-foreground shadow-xl ring-4 ring-background active-scale">
                  <Edit3 className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] border-none bg-white p-8 z-[150]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic tracking-tighter">{t.profile.editProfile}</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.profile.displayNameLabel}</Label>
                  <Input value={newDisplayName} placeholder={profileData?.displayName} onChange={(e) => setNewDisplayName(e.target.value)} className="h-14 rounded-2xl border-none bg-muted px-6 font-bold" />
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveProfile} className="h-14 w-full rounded-2xl bg-primary text-foreground font-black shadow-lg">{t.profile.saveChanges}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight">{profileData?.displayName || 'Nabolagsvenn'}</h2>
          <div className="mt-2 flex items-center gap-1">
             <Star className="h-3.5 w-3.5 fill-primary text-primary" />
             <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{profileData?.stats?.reputation?.toFixed(1) || '5.0'} {t.profile.reputationLabel}</span>
          </div>
        </header>

        <section className="mb-10">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none bg-green-50 shadow-sm rounded-[2.5rem] ring-1 ring-green-100/50">
              <CardContent className="p-8">
                <Leaf className="mb-4 h-5 w-5 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-3xl font-black italic tracking-tighter text-green-700">{co2Saved.toFixed(1)}kg</span>
                  <p className="text-[9px] font-black uppercase tracking-widest text-green-800/40 mt-1">{t.profile.co2Saved}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none bg-primary/5 shadow-sm rounded-[2.5rem] ring-1 ring-primary/10">
              <CardContent className="p-8">
                <Package className="mb-4 h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-3xl font-black italic tracking-tighter text-foreground">{completedSwaps}</span>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30 mt-1">{t.profile.itemsSaved}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-8 grid h-12 w-full grid-cols-4 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/[0.03]">
            <TabsTrigger value="items" className="rounded-xl font-black text-[8px] uppercase tracking-tighter py-2 px-1">{t.profile.myItems}</TabsTrigger>
            <TabsTrigger value="favs" className="rounded-xl font-black text-[8px] uppercase tracking-tighter py-2 px-1">{t.profile.savedItems}</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-black text-[8px] uppercase tracking-tighter py-2 px-1">{t.profile.history}</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-xl font-black text-[8px] uppercase tracking-tighter py-2 px-1">{t.profile.reviews}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items">
            <AnimatePresence mode="wait">
              {items && items.length > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                  {items.map(item => <ItemCard key={item.id} item={item} />)}
                </motion.div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-[3rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-10 text-center border-2 border-dashed border-muted/50">
                  <Package className="mb-4 h-12 w-12 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4">{t.profile.noPosts}</p>
                  <Button asChild className="rounded-2xl bg-primary text-foreground font-black px-6 h-12 shadow-lg active-scale"><Link href={`/post?lang=${lang}`}>{t.post.title}</Link></Button>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="favs">
             <AnimatePresence mode="wait">
               {favoriteItems.length > 0 ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                   {favoriteItems.map(item => <ItemCard key={item.id} item={item} />)}
                 </motion.div>
               ) : (
                 <div className="flex h-48 flex-col items-center justify-center rounded-[3rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-10 text-center border-2 border-dashed border-muted/50">
                    <Heart className="mb-4 h-12 w-12 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{t.profile.noFavorites}</p>
                 </div>
               )}
             </AnimatePresence>
          </TabsContent>

          <TabsContent value="history">
             <div className="space-y-3">
               {transactions && transactions.length > 0 ? (
                 transactions.map((tx: any) => (
                   <Card key={tx.id} className="border-none bg-white shadow-sm rounded-2xl ring-1 ring-black/[0.03]">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", tx.amount > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                            {tx.amount > 0 ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold truncate max-w-[140px]">{tx.itemTitle || (tx.amount > 0 ? t.profile.initialBonus : 'Swap')}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                              {tx.amount > 0 ? t.profile.receivedFrom : t.profile.sentTo} {tx.targetName || 'Neighbor'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-sm font-black italic", tx.amount > 0 ? "text-green-600" : "text-foreground")}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                          </p>
                          <p className="text-[8px] font-medium text-muted-foreground">{format(new Date(tx.createdAt), 'dd.MM, HH:mm')}</p>
                        </div>
                      </CardContent>
                   </Card>
                 ))
               ) : (
                 <div className="flex h-48 flex-col items-center justify-center rounded-[2.5rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-10 text-center border-2 border-dashed border-muted/50">
                    <History className="mb-4 h-12 w-12 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{t.profile.noHistory}</p>
                 </div>
               )}
             </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews && reviews.length > 0 ? (
                reviews.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(rev => (
                  <Card key={rev.id} className="border-none bg-white shadow-sm rounded-[2rem] ring-1 ring-black/[0.03] overflow-hidden">
                    <CardContent className="p-6">
                       <p className="text-sm font-bold italic leading-relaxed text-foreground/80">"{rev.content}"</p>
                       <div className="mt-4 flex items-center justify-between border-t border-black/[0.03] pt-3">
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{t.profile.vouchedBy} {rev.fromName}</span>
                          <div className="flex gap-0.5">
                             {[...Array(5)].map((_, i) => <Star key={i} className="h-2.5 w-2.5 fill-primary text-primary" />)}
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex h-48 items-center justify-center rounded-[2.5rem] bg-white text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40 shadow-sm ring-1 ring-black/[0.03]">
                   {t.profile.noReviews}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={() => auth?.signOut()} variant="ghost" className="mt-16 w-full rounded-2xl h-16 font-black text-xs uppercase tracking-[0.2em] text-destructive hover:bg-destructive/5 active-scale">
          <LogOut className="mr-2 h-5 w-5" />
          {t.profile.logout}
        </Button>
      </div>
    </div>
  );
}
