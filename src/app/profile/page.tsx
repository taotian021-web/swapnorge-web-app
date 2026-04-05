
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, initiateAnonymousSignIn, useAuth } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, doc, orderBy, limit, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import type { SwapItem, UserProfile, SwapRequest, Review } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Star, QrCode, ScanLine, LogIn, Package, History, ArrowUpRight, ArrowDownLeft, Trash2, Medal, Zap, Quote, Heart, Edit3, Leaf, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import { updateProfile } from 'firebase/auth';
import { cn } from '@/lib/utils';

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
        if (d.exists()) results.push({ ...d.data() as SwapItem, id: d.id });
      }
      setFavoriteItems(results);
    }
    fetchFavs();
  }, [favoriteDocs, firestore]);

  const reviewsRef = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'reviews'), where('toId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10)) : null),
    [user, firestore]
  );
  const { data: reviews } = useCollection<Review>(reviewsRef);

  const historyQuerySender = useMemoFirebase(
    () => (user && firestore ? query(
      collection(firestore, 'swapRequests'), 
      where('status', '==', 'completed'),
      where('senderId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    ) : null),
    [user, firestore]
  );
  const { data: sentHistory } = useCollection<SwapRequest>(historyQuerySender);

  const historyQueryReceiver = useMemoFirebase(
    () => (user && firestore ? query(
      collection(firestore, 'swapRequests'), 
      where('status', '==', 'completed'),
      where('receiverId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    ) : null),
    [user, firestore]
  );
  const { data: receivedHistory } = useCollection<SwapRequest>(historyQueryReceiver);

  const allHistory = React.useMemo(() => {
    return [...(sentHistory || []), ...(receivedHistory || [])].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [sentHistory, receivedHistory]);

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
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'items', itemId));
      toast({ title: t.item.deleteSuccess });
    } catch (error) {
      console.error(error);
    }
  };

  const handleInviteNeighbors = () => {
    const inviteLink = `${window.location.origin}/?lang=${lang}&ref=${user?.uid}`;
    if (navigator.share) {
      navigator.share({
        title: 'SwapNorge',
        text: t.profile.inviteDesc,
        url: inviteLink,
      });
    } else {
      navigator.clipboard.writeText(inviteLink);
      toast({ title: t.profile.linkCopied });
    }
  };

  const getRankInfo = (swaps: number) => {
    if (swaps >= 50) return { label: lang === 'no' ? 'Nabolagshelt' : 'Neighborhood Hero', color: 'text-purple-600', next: null, threshold: 50 };
    if (swaps >= 20) return { label: lang === 'no' ? 'Bytte-stjerne' : 'Swap Star', color: 'text-primary', next: 50, threshold: 20 };
    if (swaps >= 5) return { label: lang === 'no' ? 'Aktiv Nabo' : 'Active Neighbor', color: 'text-green-600', next: 20, threshold: 5 };
    return { label: lang === 'no' ? 'Ny i nabolaget' : 'Neighborhood Newbie', color: 'text-muted-foreground', next: 5, threshold: 0 };
  };

  const completedSwaps = profileData?.stats?.completedSwaps ?? 0;
  const rank = getRankInfo(completedSwaps);
  const co2Saved = completedSwaps * 2.45;

  const progressPercent = rank.next 
    ? ((completedSwaps - rank.threshold) / (rank.next - rank.threshold)) * 100 
    : 100;

  if (isUserLoading) return <div className="flex h-screen items-center justify-center bg-background font-black italic text-foreground/50">Laster...</div>;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8 text-center pb-44">
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
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03]"
              onClick={handleInviteNeighbors}
            >
              <Users className="h-5 w-5 text-primary" />
            </Button>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03]"
                  onClick={() => setNewDisplayName(profileData?.displayName || user?.displayName || '')}
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] border-none bg-white p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic tracking-tighter">{t.profile.editProfile}</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">{t.profile.displayNameLabel}</Label>
                    <Input 
                      value={newDisplayName} 
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      placeholder="F.eks. Ola Nordmann"
                      className="h-14 rounded-2xl border-none bg-background px-6 font-bold shadow-inner ring-1 ring-black/[0.05] focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveProfile} className="h-14 w-full rounded-2xl bg-primary text-foreground font-black shadow-lg">
                    {t.profile.saveChanges}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="mb-10 flex flex-col items-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-[2.5rem] bg-white p-1 shadow-2xl ring-1 ring-black/[0.05]">
              <Avatar className="h-full w-full rounded-[2.2rem]">
                <AvatarImage src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} />
                <AvatarFallback className="text-3xl font-black">{profileData?.displayName?.charAt(0) || user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500 text-white shadow-xl ring-4 ring-background">
              <Medal className="h-5 w-5 fill-current" />
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight">{profileData?.displayName || user?.displayName || (user.isAnonymous ? 'Nabolagsvenn' : 'Bruker')}</h2>
          
          <div className="mt-4 w-full max-w-xs space-y-3">
             <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className={rank.color}>{rank.label}</span>
                {rank.next && <span className="text-muted-foreground opacity-60">{t.profile.nextLevel}: {rank.next}</span>}
             </div>
             <Progress value={progressPercent} className="h-2 rounded-full bg-muted shadow-inner" />
          </div>
        </div>

        <Card className="mb-10 border-none bg-green-50 shadow-sm rounded-[2.5rem] ring-1 ring-green-100 overflow-hidden">
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

        <div className="mb-8 grid grid-cols-2 gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-28 flex-col gap-2 rounded-[2rem] bg-white text-foreground shadow-sm ring-1 ring-black/[0.03] hover:bg-primary transition-all">
                <QrCode className="h-8 w-8" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.profile.receivePoints}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[3rem] border-none p-10 bg-white">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-black italic tracking-tighter">{t.profile.myQrTitle}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-8 py-6">
                <div className="relative h-72 w-72 rounded-[3rem] bg-white p-6 shadow-2xl ring-1 ring-black/[0.05]">
                  <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-2 opacity-90">
                    {[...Array(25)].map((_, i) => (
                      <div key={i} className={`rounded-md ${Math.random() > 0.4 ? 'bg-foreground' : 'bg-primary'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-bold text-muted-foreground text-center">{t.profile.qrHint}</p>
              </div>
            </DialogContent>
          </Dialog>

          <Button asChild className="h-28 flex-col gap-2 rounded-[2rem] bg-foreground text-primary shadow-2xl">
            <Link href={`/scan?lang=${lang}`}>
              <ScanLine className="h-8 w-8 text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">{t.profile.scanToPay}</span>
            </Link>
          </Button>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4">
          <Card className="border-none bg-primary text-foreground shadow-xl rounded-[2.5rem] relative overflow-hidden group">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <span className="text-5xl font-black italic tracking-tighter">{profileData?.stats?.points ?? 0}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">{t.profile.balance}</span>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                 <Zap className="h-20 w-20 fill-current" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none bg-white shadow-sm rounded-[2.5rem] ring-1 ring-black/[0.03]">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <span className="text-5xl font-black italic tracking-tighter">{completedSwaps}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-2">{t.profile.swaps}</span>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-4 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/[0.03]">
            <TabsTrigger value="items" className="rounded-xl font-black text-[8px] uppercase tracking-widest py-3">Mine</TabsTrigger>
            <TabsTrigger value="favs" className="rounded-xl font-black text-[8px] uppercase tracking-widest py-3">Lagret</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-xl font-black text-[8px] uppercase tracking-widest py-3">Omtaler</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-black text-[8px] uppercase tracking-widest py-3">Logg</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items">
            {items && items.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {items.map(item => (
                  <Card key={item.id} className="group overflow-hidden border-none bg-white shadow-sm rounded-3xl ring-1 ring-black/[0.03]">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/400`} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      <Badge className="absolute top-3 left-3 bg-primary/95 text-foreground font-black text-[10px] rounded-lg shadow-lg">{item.points} pts</Badge>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                         <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="icon" className="h-10 w-10 rounded-full"><Trash2 className="h-5 w-5" /></Button></AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2.5rem] border-none">
                              <AlertDialogHeader><AlertDialogTitle>{t.item.deleteConfirm}</AlertDialogTitle></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-bold">Avbryt</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="rounded-xl bg-destructive font-bold">Slett</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="line-clamp-1 text-sm font-bold">{item.title}</h4>
                      <p className="mt-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{(t.categories as any)[item.category] || item.category}</p>
                    </div>
                  </Card>
                ))}
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
              {reviews && reviews.length > 0 ? (
                reviews.map(rev => (
                  <Card key={rev.id} className="border-none bg-white shadow-sm rounded-[2rem] ring-1 ring-black/[0.03] overflow-hidden">
                    <CardContent className="p-6">
                       <div className="flex items-start gap-4">
                          <Quote className="h-6 w-6 text-primary shrink-0 opacity-20" />
                          <div className="flex-1">
                             <p className="text-sm font-bold italic leading-relaxed text-foreground/80">"{rev.content}"</p>
                             <div className="mt-4 flex items-center justify-between border-t border-black/[0.03] pt-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.profile.vouchedBy} {rev.fromName}</span>
                                <div className="flex gap-0.5">
                                   {[...Array(5)].map((_, i) => <Star key={i} className="h-2.5 w-2.5 fill-primary text-primary" />)}
                                </div>
                             </div>
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

          <TabsContent value="history">
             {allHistory.length > 0 ? (
               <div className="space-y-4">
                 {allHistory.map(req => {
                   const isSender = req.senderId === user.uid;
                   return (
                     <Card key={req.id} className="border-none bg-white shadow-sm rounded-[2rem] ring-1 ring-black/[0.03] overflow-hidden">
                       <CardContent className="p-4 flex items-center gap-4">
                         <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isSender ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-600'}`}>
                           {isSender ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="text-sm font-bold truncate">{req.itemTitle}</h4>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                             {format(new Date(req.createdAt), 'dd.MM.yyyy')}
                           </p>
                         </div>
                         <div className="text-right">
                           <span className={cn(
                             "text-sm font-black italic tracking-tighter",
                             isSender ? "text-foreground" : "text-green-600"
                           )}>
                             {isSender ? '-' : '+'}{req.points} pts
                           </span>
                         </div>
                       </CardContent>
                     </Card>
                   );
                 })}
               </div>
             ) : (
               <div className="flex h-48 flex-col items-center justify-center rounded-[3rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-10 text-center border-2 border-dashed border-muted/50">
                <History className="mb-4 h-12 w-12 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{t.profile.noHistory}</p>
              </div>
             )}
          </TabsContent>
        </Tabs>

        <Button onClick={() => auth?.signOut()} variant="ghost" className="mt-12 w-full rounded-2xl h-16 font-black text-xs uppercase tracking-widest text-destructive hover:bg-destructive/5 transition-colors">
          <LogOut className="mr-2 h-5 w-5" />
          Logg ut
        </Button>
      </div>
    </div>
  );
}
