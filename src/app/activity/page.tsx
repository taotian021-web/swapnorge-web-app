
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, ArrowUpRight, ArrowDownLeft, Clock, ShoppingBag } from 'lucide-react';
import type { SwapRequest } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ActivityPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);

  // Received requests (I am the seller/receiver)
  const receivedQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'swapRequests'), where('receiverId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: receivedRequests, isLoading: isLoadingReceived } = useCollection<SwapRequest>(receivedQuery);

  // Sent requests (I am the sender)
  const sentQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'swapRequests'), where('senderId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: sentRequests, isLoading: isLoadingSent } = useCollection<SwapRequest>(sentQuery);

  const handleUpdateStatus = (requestId: string, newStatus: string) => {
    if (!firestore) return;
    const requestRef = doc(firestore, 'swapRequests', requestId);
    updateDoc(requestRef, { status: newStatus });
  };

  const RequestCard = ({ req, type }: { req: SwapRequest, type: 'sent' | 'received' }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="overflow-hidden border-none bg-white shadow-sm rounded-3xl ring-1 ring-black/[0.03]">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
              <img 
                src={req.itemImageUrl || `https://picsum.photos/seed/${req.itemId}/400/400`} 
                alt={req.itemTitle} 
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-1 right-1">
                 {type === 'sent' ? (
                   <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-foreground shadow-lg">
                      <ArrowUpRight className="h-3 w-3" />
                   </div>
                 ) : (
                   <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
                      <ArrowDownLeft className="h-3 w-3" />
                   </div>
                 )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm leading-tight truncate">{req.itemTitle}</h3>
              <div className="mt-1.5 flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${type === 'sent' ? req.receiverId : req.senderId}`} />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {type === 'sent' ? t.activity.to : t.activity.from} {type === 'sent' ? (lang === 'no' ? 'Selger' : 'Seller') : req.senderName}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="secondary" className="bg-primary/10 text-primary font-black text-[10px] rounded-lg">
                  {req.points} pts
                </Badge>
                <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                   <Clock className="h-2.5 w-2.5" />
                   <span>{(t.activity.status as any)[req.status]}</span>
                </div>
              </div>
            </div>
          </div>

          {type === 'received' && req.status === 'pending' && (
            <div className="flex border-t border-black/[0.03]">
              <Button 
                variant="ghost" 
                onClick={() => handleUpdateStatus(req.id, 'rejected')}
                className="flex-1 h-12 rounded-none font-black text-xs text-destructive hover:bg-destructive/5"
              >
                <X className="mr-2 h-4 w-4" />
                {t.activity.reject}
              </Button>
              <div className="w-[1px] bg-black/[0.03]" />
              <Button 
                onClick={() => handleUpdateStatus(req.id, 'accepted')}
                className="flex-1 h-12 rounded-none font-black text-xs text-green-600 bg-transparent hover:bg-green-50 shadow-none"
              >
                <Check className="mr-2 h-4 w-4" />
                {t.activity.accept}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background p-4 pb-32">
      <div className="container mx-auto max-w-2xl">
        <header className="mb-8 mt-4">
          <h1 className="text-3xl font-black italic tracking-tighter">{t.activity.title}</h1>
        </header>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/[0.03]">
            <TabsTrigger value="received" className="rounded-xl font-bold py-2.5">{t.activity.received}</TabsTrigger>
            <TabsTrigger value="sent" className="rounded-xl font-bold py-2.5">{t.activity.sent}</TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <AnimatePresence>
              {receivedRequests && receivedRequests.length > 0 ? (
                receivedRequests.map(req => <RequestCard key={req.id} req={req} type="received" />)
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-[2.5rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background">
                    <ArrowDownLeft className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40">{t.activity.noRequests}</p>
                  <Button asChild variant="ghost" className="mt-6 font-black text-primary">
                    <Link href={`/post?lang=${lang}`}>+ {t.post.title}</Link>
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="sent">
            <AnimatePresence>
              {sentRequests && sentRequests.length > 0 ? (
                sentRequests.map(req => <RequestCard key={req.id} req={req} type="sent" />)
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-[2.5rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background">
                    <ShoppingBag className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40">{t.activity.noRequests}</p>
                  <Button asChild variant="ghost" className="mt-6 font-black text-primary">
                    <Link href={`/?lang=${lang}`}>{t.home.vsFinn.cta}</Link>
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
