
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import type { SwapRequest } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

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

  const RequestCard = ({ req, type }: { req: any, type: 'sent' | 'received' }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="overflow-hidden border-none bg-white shadow-sm rounded-3xl">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className={req.status === 'accepted' ? "text-green-500" : "text-primary"}>
                {type === 'sent' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">{req.itemTitle}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${type === 'sent' ? req.receiverId : req.senderId}`} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <span>{type === 'sent' ? t.activity.to : t.activity.from} {type === 'sent' ? 'Selger' : req.senderName}</span>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-black rounded-lg">
              {req.points} pts
            </Badge>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Clock className="h-3 w-3" />
              <span>{(t.activity.status as any)[req.status]}</span>
            </div>

            {type === 'received' && req.status === 'pending' && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleUpdateStatus(req.id, 'rejected')}
                  className="h-9 w-9 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleUpdateStatus(req.id, 'accepted')}
                  className="h-9 w-9 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
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
          <TabsList className="mb-6 grid w-full grid-cols-2 rounded-2xl bg-white p-1 shadow-sm">
            <TabsTrigger value="received" className="rounded-xl font-bold py-2.5">{t.activity.received}</TabsTrigger>
            <TabsTrigger value="sent" className="rounded-xl font-bold py-2.5">{t.activity.sent}</TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <AnimatePresence>
              {receivedRequests && receivedRequests.length > 0 ? (
                receivedRequests.map(req => <RequestCard key={req.id} req={req} type="received" />)
              ) : (
                <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                  <ArrowDownLeft className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-sm font-medium">{t.activity.noRequests}</p>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="sent">
            <AnimatePresence>
              {sentRequests && sentRequests.length > 0 ? (
                sentRequests.map(req => <RequestCard key={req.id} req={req} type="sent" />)
              ) : (
                <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                  <ArrowUpRight className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-sm font-medium">{t.activity.noRequests}</p>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
