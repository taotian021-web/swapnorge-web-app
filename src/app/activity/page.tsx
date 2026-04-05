
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, ArrowUpRight, ArrowDownLeft, Clock, MessageSquareText, PlusCircle, Search, Trash2, CreditCard } from 'lucide-react';
import type { SwapRequest } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function ActivityPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);

  const receivedQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'swapRequests'), where('receiverId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: receivedRequests } = useCollection<SwapRequest>(receivedQuery);

  const sentQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'swapRequests'), where('senderId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: sentRequests } = useCollection<SwapRequest>(sentQuery);

  const handleUpdateStatus = (req: SwapRequest, newStatus: string) => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);
    const requestRef = doc(firestore, 'swapRequests', req.id);
    const itemRef = doc(firestore, 'items', req.itemId);

    batch.update(requestRef, { status: newStatus });

    if (newStatus === 'accepted') {
      batch.update(itemRef, { status: 'reserved' });
    } else if (newStatus === 'rejected' && req.status === 'accepted') {
      batch.update(itemRef, { status: 'available' });
    }

    batch.commit().catch(e => {
      console.error("Batch update failed", e);
    });
  };

  const handleCancelRequest = (reqId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'swapRequests', reqId));
    toast({ title: t.activity.requestCancelled });
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
                  {type === 'sent' ? t.activity.to : t.activity.from} {type === 'sent' ? req.receiverName : req.senderName}
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

          {req.message && (
            <div className="mx-4 mb-4 rounded-xl bg-muted/50 p-3 flex gap-2">
              <MessageSquareText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{t.activity.messageLabel}</span>
                <p className="text-[11px] font-medium leading-relaxed italic text-foreground/80">"{req.message}"</p>
              </div>
            </div>
          )}

          {type === 'received' && req.status === 'pending' && (
            <div className="flex border-t border-black/[0.03]">
              <Button 
                variant="ghost" 
                onClick={() => handleUpdateStatus(req, 'rejected')}
                className="flex-1 h-12 rounded-none font-black text-xs text-destructive hover:bg-destructive/5"
              >
                <X className="mr-2 h-4 w-4" />
                {t.activity.reject}
              </Button>
              <div className="w-[1px] bg-black/[0.03]" />
              <Button 
                onClick={() => handleUpdateStatus(req, 'accepted')}
                className="flex-1 h-12 rounded-none font-black text-xs text-green-600 bg-transparent hover:bg-green-50 shadow-none"
              >
                <Check className="mr-2 h-4 w-4" />
                {t.activity.accept}
              </Button>
            </div>
          )}

          {type === 'sent' && req.status === 'pending' && (
            <div className="flex border-t border-black/[0.03]">
               <Button 
                variant="ghost" 
                onClick={() => handleCancelRequest(req.id)}
                className="flex-1 h-12 rounded-none font-black text-xs text-muted-foreground hover:bg-muted/50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.activity.cancel}
              </Button>
            </div>
          )}

          {type === 'sent' && req.status === 'accepted' && (
            <div className="flex border-t border-black/[0.03]">
              <Button 
                asChild
                className="flex-1 h-12 rounded-none font-black text-xs bg-primary text-foreground hover:bg-primary/90 shadow-none"
              >
                <Link href={`/scan?lang=${lang}&requestId=${req.id}&itemId=${req.itemId}&amount=${req.points}&receiverId=${req.receiverId}&receiverName=${req.receiverName}`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t.activity.complete}
                </Link>
              </Button>
            </div>
          )}

          {req.status === 'completed' && (
            <div className="flex items-center justify-center py-3 border-t border-black/[0.03] bg-green-50/30">
              <Check className="h-3 w-3 text-green-600 mr-2" />
              <span className="text-[10px] font-black uppercase tracking-widest text-green-600 opacity-60">{t.activity.status.completed}</span>
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
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background/50">
                    <PlusCircle className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed px-4">
                    {t.activity.noRequestsReceived}
                  </p>
                  <Button asChild className="mt-8 h-12 rounded-xl bg-primary px-8 font-black text-foreground shadow-lg shadow-primary/20">
                    <Link href={`/post?lang=${lang}`}>{t.activity.postSuggest}</Link>
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
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background/50">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed px-4">
                    {t.activity.noRequestsSent}
                  </p>
                  <Button asChild variant="outline" className="mt-8 h-12 rounded-xl border-primary/20 bg-white px-8 font-black text-primary shadow-sm">
                    <Link href={`/?lang=${lang}`}>{t.activity.browseSuggest}</Link>
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
