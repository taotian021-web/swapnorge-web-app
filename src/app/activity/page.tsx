'use client';

import * as React from 'react';
import Image from 'next/image';
import { useSupabase } from '@/supabase';
import { useSupabaseUser } from '@/supabase/hooks';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, ArrowUpRight, ArrowDownLeft, Clock, MessageSquareText, Search, Trash2, CreditCard, QrCode } from 'lucide-react';
import type { SwapRequest } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ActivityPage() {
  const supabase = useSupabase();
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);

  const [qrDialogOpen, setQrDialogOpen] = React.useState(false);
  const [selectedReq, setSelectedReq] = React.useState<SwapRequest | null>(null);
  const [receivedRequests, setReceivedRequests] = React.useState<SwapRequest[]>([]);
  const [sentRequests, setSentRequests] = React.useState<SwapRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function loadRequests() {
      if (!user || !supabase) {
        setReceivedRequests([]);
        setSentRequests([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const [receivedRes, sentRes] = await Promise.all([
        supabase.from('swapRequests').select('*').eq('receiverId', user.id).order('createdAt', { ascending: false }),
        supabase.from('swapRequests').select('*').eq('senderId', user.id).order('createdAt', { ascending: false }),
      ]);

      if (!mounted) return;

      setReceivedRequests(receivedRes.data ?? []);
      setSentRequests(sentRes.data ?? []);
      setIsLoading(false);
    }

    loadRequests();

    return () => {
      mounted = false;
    };
  }, [supabase, user]);

  const handleUpdateStatus = async (req: SwapRequest, newStatus: string) => {
    if (!supabase) return;

    try {
      const requests = [
        supabase.from('swapRequests').update({ status: newStatus }).eq('id', req.id),
      ];

      if (newStatus === 'accepted') {
        requests.push(
          supabase.from('items').update({ status: 'reserved' }).eq('id', req.itemId)
        );
        toast({ title: lang === 'no' ? 'Forespørsel godtatt' : 'Request accepted' });
      } else if (newStatus === 'rejected') {
        toast({ title: lang === 'no' ? 'Forespørsel avslått' : 'Request rejected' });
      }

      for (const request of requests) {
        const { error } = await request;
        if (error) throw error;
      }

      // Refresh requests
      const [receivedRes, sentRes] = await Promise.all([
        supabase.from('swapRequests').select('*').eq('receiverId', user?.id).order('createdAt', { ascending: false }),
        supabase.from('swapRequests').select('*').eq('senderId', user?.id).order('createdAt', { ascending: false }),
      ]);

      setReceivedRequests(receivedRes.data ?? []);
      setSentRequests(sentRes.data ?? []);
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const handleCancelRequest = async (reqId: string) => {
    if (!supabase) return;

    try {
      await supabase.from('swapRequests').delete().eq('id', reqId);
      toast({ title: t.activity.requestCancelled });

      // Refresh requests
      const [receivedRes, sentRes] = await Promise.all([
        supabase.from('swapRequests').select('*').eq('receiverId', user?.id).order('createdAt', { ascending: false }),
        supabase.from('swapRequests').select('*').eq('senderId', user?.id).order('createdAt', { ascending: false }),
      ]);

      setReceivedRequests(receivedRes.data ?? []);
      setSentRequests(sentRes.data ?? []);
    } catch (error) {
      console.error('Cancel request error:', error);
    }
  };

  const handleShowQr = (req: SwapRequest) => {
    setSelectedReq(req);
    setQrDialogOpen(true);
  };

  const RequestCard = ({ req, type }: { req: SwapRequest, type: 'sent' | 'received' }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mb-4"
    >
      <Card className="overflow-hidden border-none bg-white shadow-lg rounded-[2.5rem] ring-1 ring-black/[0.04]">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
            <div className="relative h-24 w-full overflow-hidden rounded-[2rem] bg-muted sm:h-24 sm:w-24">
              <Image
                src={req.itemImageUrl || `https://picsum.photos/seed/${req.itemId}/400/400`}
                alt={req.itemTitle}
                fill
                sizes="100px"
                className="object-cover"
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
                <h3 className="font-bold text-base leading-tight text-foreground truncate">{req.itemTitle}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${type === 'sent' ? req.receiverId : req.senderId}`} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">
                    {type === 'sent' ? t.activity.to : t.activity.from} {type === 'sent' ? req.receiverName : req.senderName}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/10 text-primary font-black text-[10px] rounded-full px-3 py-1">
                    {req.points} pts
                  </Badge>
                  <div className="inline-flex items-center gap-1 rounded-full bg-muted/90 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{((t.activity.status as Record<string, string>)[req.status]) ?? req.status}</span>
                  </div>
                </div>
            </div>
          </div>

          {req.message && (
            <div className="mx-4 mb-4 rounded-[1.75rem] bg-muted/80 p-4 text-sm leading-6 text-foreground/85">
              <div className="flex items-start gap-3">
                <MessageSquareText className="mt-1 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-1">{t.activity.messageLabel}</p>
                  <p className="italic">“{req.message}”</p>
                </div>
              </div>
            </div>
          )}

          {type === 'received' && req.status === 'pending' && (
            <div className="flex flex-col gap-3 border-t border-black/[0.03] px-4 py-4 sm:flex-row">
              <Button 
                variant="secondary" 
                onClick={() => handleUpdateStatus(req, 'rejected')}
                className="flex-1 h-14 rounded-2xl font-black text-sm text-destructive"
              >
                <X className="mr-2 h-4 w-4" />
                {t.activity.reject}
              </Button>
              <Button 
                onClick={() => handleUpdateStatus(req, 'accepted')}
                className="flex-1 h-14 rounded-2xl bg-green-600 text-white font-black text-sm shadow-lg hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                {t.activity.accept}
              </Button>
            </div>
          )}

          {type === 'received' && req.status === 'accepted' && (
             <div className="flex border-t border-black/[0.03]">
                <Button 
                  onClick={() => handleShowQr(req)}
                  className="flex-1 h-12 rounded-none font-black text-xs text-primary bg-foreground hover:bg-foreground/90 shadow-none"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  {t.activity.showQr}
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
                <Link href={`/scan?lang=${lang}&requestId=${req.id}&itemId=${req.itemId}&amount=${req.points}&receiverId=${req.receiverId}&receiverName=${req.receiverName}&itemTitle=${encodeURIComponent(req.itemTitle)}`}>
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

  const EmptyStateCard = ({
    title,
    description,
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
  }: {
    title: string;
    description: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref?: string;
    secondaryLabel?: string;
  }) => (
    <div className="flex min-h-[32rem] flex-col justify-between rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-black/[0.03]">
      <div className="space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Search className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="h-14 w-full rounded-2xl bg-primary font-black text-foreground shadow-lg shadow-primary/20">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
        {secondaryHref && secondaryLabel ? (
          <Button asChild variant="outline" className="h-14 w-full rounded-2xl border-primary/20 text-primary">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background p-4 pb-36">
      <div className="container mx-auto max-w-2xl">
        <header className="mb-8 mt-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary font-black">
            {t.activity.subtitle}
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight leading-tight">{t.activity.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t.activity.description}</p>
        </header>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 gap-3 rounded-[2.25rem] bg-white p-1 shadow-sm ring-1 ring-black/[0.05]">
            <TabsTrigger value="received" className="rounded-[1.75rem] font-black text-sm py-3">{t.activity.received}</TabsTrigger>
            <TabsTrigger value="sent" className="rounded-[1.75rem] font-black text-sm py-3">{t.activity.sent}</TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="overflow-hidden border-none bg-white shadow-sm rounded-3xl ring-1 ring-black/[0.03] p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 shrink-0 rounded-2xl bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : receivedRequests && receivedRequests.length > 0 ? (
                receivedRequests.map(req => <RequestCard key={req.id} req={req} type="received" />)
              ) : (
                <EmptyStateCard
                  title={t.activity.emptyTitleReceived}
                  description={t.activity.emptyBodyReceived}
                  primaryHref={`/post?lang=${lang}`}
                  primaryLabel={t.activity.postSuggest}
                  secondaryHref={`/?lang=${lang}`}
                  secondaryLabel={t.activity.browseSuggest}
                />
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="sent">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="overflow-hidden border-none bg-white shadow-sm rounded-3xl ring-1 ring-black/[0.03] p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 shrink-0 rounded-2xl bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : sentRequests && sentRequests.length > 0 ? (
                sentRequests.map(req => <RequestCard key={req.id} req={req} type="sent" />)
              ) : (
                <EmptyStateCard
                  title={t.activity.emptyTitleSent}
                  description={t.activity.emptyBodySent}
                  primaryHref={`/?lang=${lang}`}
                  primaryLabel={t.activity.browseSuggest}
                  secondaryHref={`/post?lang=${lang}`}
                  secondaryLabel={t.activity.postSuggest}
                />
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="rounded-[3rem] border-none bg-white p-10 z-[200]">
          <div className="flex flex-col items-center text-center">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black italic tracking-tighter mb-2">{t.activity.qrTitle}</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">
                {t.activity.qrDesc}
              </DialogDescription>
            </DialogHeader>

            <div className="my-10 p-8 bg-white rounded-[2rem] shadow-2xl ring-1 ring-black/5">
               <div className="relative h-64 w-64 bg-muted rounded-2xl flex items-center justify-center overflow-hidden">
                  <QrCode className="h-48 w-48 text-foreground opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="h-40 w-40 border-4 border-primary rounded-xl flex items-center justify-center bg-white shadow-xl">
                        <span className="text-4xl font-black italic text-primary">{selectedReq?.points}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="w-full p-6 rounded-2xl bg-primary/10 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{t.activity.status.completed}</p>
                <p className="font-bold text-sm">{selectedReq?.itemTitle}</p>
              </div>
              <Badge className="bg-primary text-foreground font-black px-4 py-1.5 rounded-lg">{selectedReq?.points} pts</Badge>
            </div>

            <Button onClick={() => setQrDialogOpen(false)} className="mt-10 h-16 w-full rounded-2xl bg-foreground text-primary font-black text-base shadow-xl active-scale">
               {lang === 'no' ? 'Lukk' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
