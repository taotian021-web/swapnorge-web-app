
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, initiateAnonymousSignIn, useAuth } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, doc, orderBy, limit, deleteDoc } from 'firebase/firestore';
import type { SwapItem, UserProfile, SwapRequest } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Settings, Package, History, Star, QrCode, ScanLine, LogIn, PlusCircle, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
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

  // User's active items
  const userItemsRef = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'items'), where('sellerId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: items } = useCollection<SwapItem>(userItemsRef);

  // User's transaction history (completed requests where user is sender or receiver)
  const historyQuerySender = useMemoFirebase(
    () => (user && firestore ? query(
      collection(firestore, 'swapRequests'), 
      where('status', '==', 'completed'),
      where('senderId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
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
      limit(10)
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

  const handleDeleteItem = async (itemId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'items', itemId));
      toast({
        title: t.item.deleteSuccess,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete item.',
      });
    }
  };

  if (isUserLoading) return <div className="flex h-screen items-center justify-center bg-background font-black italic">Laster SwapNorge...</div>;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <div className="mb-8 h-24 w-24 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
          <Star className="h-12 w-12 text-foreground" />
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter mb-4">{t.profile.loginPrompt}</h2>
        <p className="mb-10 text-sm font-medium text-muted-foreground max-w-xs leading-relaxed">
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
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.03]">
            <Settings className="h-6 w-6" />
          </Button>
        </header>

        <div className="mb-10 flex flex-col items-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-[2.5rem] bg-white p-1 shadow-2xl ring-1 ring-black/[0.05]">
              <Avatar className="h-full w-full rounded-[2.2rem]">
                <AvatarImage src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} />
                <AvatarFallback className="text-3xl font-black">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500 text-white shadow-xl ring-4 ring-background">
              <Star className="h-5 w-5 fill-current" />
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight">{user?.displayName || (user.isAnonymous ? 'Nabolagsvenn' : 'Bruker')}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mt-1">
            {profileData?.stats?.memberSince ? `Medlem siden ${new Date(profileData.stats.memberSince).getFullYear()}` : 'Ny i nabolaget'}
          </p>
        </div>

        {/* Action Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-28 flex-col gap-2 rounded-[2rem] bg-white text-foreground shadow-sm ring-1 ring-black/[0.03] hover:bg-primary transition-all active:scale-95">
                <QrCode className="h-8 w-8" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.profile.receivePoints}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[3rem] border-none p-10 bg-white shadow-2xl">
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
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-2xl bg-white p-1.5 shadow-2xl">
                      <div className="h-full w-full rounded-xl bg-primary flex items-center justify-center">
                        <span className="text-xs font-black">SN</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                    {t.profile.qrHint}
                  </p>
                  <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">ID: {user.uid.slice(0, 8)}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button asChild className="h-28 flex-col gap-2 rounded-[2rem] bg-foreground text-primary shadow-2xl transition-all active:scale-95">
            <Link href={`/scan?lang=${lang}`}>
              <ScanLine className="h-8 w-8 text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">{t.profile.scanToPay}</span>
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-10 grid grid-cols-2 gap-4">
          <Card className="border-none bg-primary text-foreground shadow-[0_20px_40px_-10px_rgba(243,197,0,0.3)] rounded-[2.5rem]">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <span className="text-5xl font-black italic tracking-tighter">{profileData?.stats?.points ?? 0}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">{t.profile.balance}</span>
            </CardContent>
          </Card>
          <Card className="border-none bg-white shadow-sm rounded-[2.5rem] ring-1 ring-black/[0.03]">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <div className="flex items-center gap-2">
                <span className="text-5xl font-black italic tracking-tighter">{profileData?.stats?.reputation ?? 5.0}</span>
                <Star className="h-7 w-7 fill-primary text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-2">{t.profile.reputation}</span>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-2 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/[0.03]">
            <TabsTrigger value="items" className="rounded-xl font-black text-xs uppercase tracking-widest py-3 data-[state=active]:bg-foreground data-[state=active]:text-primary transition-all">
              {t.profile.myItems}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-black text-xs uppercase tracking-widest py-3 data-[state=active]:bg-foreground data-[state=active]:text-primary transition-all">
              {t.profile.history}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="items">
            {items && items.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {items.map(item => (
                  <Card key={item.id} className="group overflow-hidden border-none bg-white shadow-sm rounded-3xl ring-1 ring-black/[0.03] transition-all hover:shadow-md">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      <img 
                        src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/400`} 
                        alt={item.title} 
                        className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                      />
                      <Badge className="absolute top-3 left-3 bg-primary/95 backdrop-blur-sm text-foreground font-black text-[10px] rounded-lg border-none shadow-lg">
                        {item.points} pts
                      </Badge>
                      
                      {/* Delete Action Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="h-10 w-10 rounded-full scale-90 group-hover:scale-100 transition-transform">
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2.5rem] border-none">
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.item.deleteConfirm}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Denne handlingen kan ikke angres.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-bold">Avbryt</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="rounded-xl bg-destructive font-bold">Slett</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="line-clamp-1 text-sm font-bold text-foreground">{item.title}</h4>
                      <div className="mt-3 flex items-center justify-between">
                         <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                           {(t.categories as any)[item.category] || item.category}
                         </span>
                         <div className={`h-2.5 w-2.5 rounded-full shadow-sm ${item.status === 'available' ? 'bg-green-500' : (item.status === 'swapped' ? 'bg-muted' : 'bg-orange-500')}`} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center rounded-[3rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-10 text-center border-2 border-dashed border-muted/50">
                <Package className="mb-6 h-16 w-16 opacity-10" />
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-8">{t.profile.noPosts}</p>
                <Button asChild className="rounded-2xl bg-primary text-foreground font-black px-10 h-14 shadow-lg active:scale-95 transition-all">
                  <Link href={`/post?lang=${lang}`}>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    {t.post.title}
                  </Link>
                </Button>
              </div>
            )}
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
                             {format(new Date(req.createdAt), 'dd.MM.yyyy')} • {isSender ? (lang === 'no' ? 'Kjøpt' : 'Bought') : (lang === 'no' ? 'Solgt' : 'Sold')}
                           </p>
                         </div>
                         <div className="text-right">
                           <span className={`text-sm font-black italic tracking-tighter ${isSender ? 'text-foreground' : 'text-green-600'}`}>
                             {isSender ? '-' : '+'}{req.points} pts
                           </span>
                         </div>
                       </CardContent>
                     </Card>
                   );
                 })}
               </div>
             ) : (
               <div className="flex h-72 flex-col items-center justify-center rounded-[3rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-10 text-center border-2 border-dashed border-muted/50">
                <History className="mb-6 h-16 w-16 opacity-10" />
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">{t.profile.noHistory}</p>
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
