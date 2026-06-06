'use client';

import * as React from 'react';
import { useSupabaseUser, useSupabaseProfile } from '@/supabase/hooks';
import { useSupabase } from '@/supabase/provider';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { SwapItem, Review } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Language } from '@/lib/translations';
import { Star, Package, Edit3, Leaf, Heart, History, ArrowUpRight, ArrowDownLeft, Camera, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ItemCard } from '@/components/swap-norge/ItemCard';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PENDING_VERIFICATION_EMAIL_KEY = 'sn_pending_verification_email';

export default function ProfilePage() {
  const { user, isUserLoading } = useSupabaseUser();
  const { profile: profileData, isLoading: isProfileLoading } = useSupabaseProfile(user?.id);
  const supabase = useSupabase();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') || 'no') as Language;
  const t = getTranslations(lang);

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [newDisplayName, setNewDisplayName] = React.useState('');
  const [localAvatar, setLocalAvatar] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<SwapItem[]>([]);
  const [transactions, setTransactions] = React.useState<Record<string, unknown>[]>([]);
  const [favoriteItems, setFavoriteItems] = React.useState<SwapItem[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = React.useState('');
  const [authPassword, setAuthPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authMessage, setAuthMessage] = React.useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load avatar from localStorage
  React.useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`local_avatar_${user.id}`);
      if (saved) setLocalAvatar(saved);
    }
  }, [user]);

  // Clear pending verification state after successful login
  React.useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const pendingEmail = localStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
    if (pendingEmail) {
      localStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
      toast({ title: t.profile.verifySuccess, description: t.profile.loginSuccess });
    }
  }, [user, toast, t.profile]);

  // Load user items
  React.useEffect(() => {
    const loadItems = async () => {
      if (!user || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('seller_id', user.id);
        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Error loading items:', error);
      }
    };
    loadItems();
  }, [user, supabase]);

  // Load transactions
  React.useEffect(() => {
    const loadTransactions = async () => {
      if (!user || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    };
    loadTransactions();
  }, [user, supabase]);

  // Load favorites
  React.useEffect(() => {
    const loadFavorites = async () => {
      if (!user || !supabase) return;
      try {
        const { data: favData, error: favError } = await supabase
          .from('favorites')
          .select('item_id')
          .eq('user_id', user.id);
        if (favError) throw favError;
        if (!favData || favData.length === 0) {
          setFavoriteItems([]);
          return;
        }
        const itemIds = favData.map(f => f.item_id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .in('id', itemIds);
        if (itemsError) throw itemsError;
        setFavoriteItems(itemsData || []);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    loadFavorites();
  }, [user, supabase]);

  // Load reviews
  React.useEffect(() => {
    const loadReviews = async () => {
      if (!user || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('to_id', user.id);
        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };
    loadReviews();
  }, [user, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ 
          variant: 'destructive', 
          title: lang === 'no' ? 'Filen er for stor' : 'File too large',
          description: lang === 'no' ? 'Maks 2MB' : 'Max 2MB' 
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLocalAvatar(base64String);
        localStorage.setItem(`local_avatar_${user.id}`, base64String);
        toast({ title: lang === 'no' ? 'Bilde lagret lokalt' : 'Photo saved locally' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !supabase || !newDisplayName) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: newDisplayName })
        .eq('id', user.id);
      if (error) throw error;
      toast({ title: t.profile.updateSuccess });
      setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: t.profile.updateError });
    }
  };


  const validateAuthForm = () => {
    if (!authEmail || !authEmail.includes('@')) {
      return t.profile.invalidEmail;
    }
    if (!authPassword || authPassword.length < 6) {
      return t.profile.invalidPassword;
    }
    if (authMode === 'register' && authPassword !== confirmPassword) {
      return t.profile.passwordsMismatch;
    }
    return null;
  };

  const emailError = authEmail && !authEmail.includes('@') ? t.profile.invalidEmail : null;
  const passwordError = authPassword && authPassword.length < 6 ? t.profile.passwordRequirements : null;
  const confirmPasswordError = authMode === 'register' && confirmPassword && authPassword !== confirmPassword ? t.profile.passwordsMismatch : null;

  const isAuthFormValid =
    authEmail.trim().length > 0 &&
    authEmail.includes('@') &&
    authPassword.length >= 6 &&
    (authMode === 'login' || authPassword === confirmPassword);

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthMessage(null);

    const validationError = validateAuthForm();
    if (validationError) {
      setAuthError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const email = authEmail.trim();
      const password = authPassword;

      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) {
          throw new Error(t.profile.signInFailed);
        }
        toast({ title: t.profile.loginSuccess });
        setAuthMessage({ type: 'success', text: t.profile.loginSuccess });
      } else {
        const emailRedirectTo = `${window.location.origin}/profile?lang=${lang}`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: { guest: false },
          },
        });
        if (error) throw error;

        if (data.session) {
          toast({ title: t.profile.registerSuccess, description: t.profile.secureAccountDesc });
          setAuthMessage({ type: 'success', text: t.profile.registerSuccess });
        } else {
          localStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
          toast({ 
            title: t.profile.registerSuccess, 
            description: `${t.profile.verifyEmailSent}\n邮件验证后，请返回此页面并用该邮箱和密码登入` 
          });
          setAuthMessage({ 
            type: 'info', 
            text: `${t.profile.verifyEmailSent}\n\n💡 提示：验证邮件后，请用该邮箱和密码重新登入以完成注册。` 
          });
          setAuthMode('login');
        }
      }

      setAuthEmail('');
      setAuthPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setAuthError(message);
      setAuthMessage({ type: 'info', text: message });
      toast({ variant: 'destructive', title: t.profile.registerFailed, description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedSwaps = profileData?.stats?.completedSwaps ?? 0;
  const co2Saved = completedSwaps * 2.45;
  type Tx = { id?: string; amount?: number | string; created_at?: string; item_title?: string; target_name?: string };
  const txs = transactions as unknown as Tx[];
  type ReviewRaw = { id?: string; from_id?: string; from_name?: string; fromName?: string; rating?: number; content?: string; created_at?: string; createdAt?: string };
  const revs = reviews as unknown as ReviewRaw[];
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10 text-center pb-20">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mb-8 h-24 w-24 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
          <Star className="h-12 w-12 text-foreground" />
        </motion.div>
        <h2 className="text-3xl font-black italic tracking-tighter mb-4">{t.profile.loginPrompt}</h2>
        <div className="w-full max-w-md rounded-[3rem] bg-white p-8 shadow-2xl shadow-primary/10 ring-1 ring-black/[0.04]">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm leading-6 text-muted-foreground">{t.profile.secureAccountDesc}</p>
            </div>

            <form data-testid="auth-form" onSubmit={handleAuthSubmit} className="space-y-6">
              <div className="rounded-[2rem] bg-muted p-2">
                <div className="flex gap-2 rounded-[1.75rem] bg-white p-1 shadow-sm ring-1 ring-black/5" role="tablist">
                  <Button
                    type="button"
                    variant={authMode === 'login' ? 'default' : 'secondary'}
                    className={cn('flex-1 rounded-[1.75rem] py-3 font-black text-sm', authMode === 'login' ? 'shadow-lg' : '')}
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                      setAuthMessage(null);
                    }}
                    aria-pressed={authMode === 'login'}
                  >
                    {t.profile.loginTitle}
                  </Button>
                  <Button
                    type="button"
                    variant={authMode === 'login' ? 'secondary' : 'default'}
                    className={cn('flex-1 rounded-[1.75rem] py-3 font-black text-sm', authMode === 'register' ? 'shadow-lg' : '')}
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                      setAuthMessage(null);
                    }}
                    aria-pressed={authMode === 'register'}
                  >
                    {t.profile.registerTitle}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 text-left">
                <h2 className="text-3xl font-black tracking-tighter">{authMode === 'login' ? t.profile.loginHeading : t.profile.registerHeading}</h2>
                <p className="text-sm text-muted-foreground">
                  {authMode === 'login' ? t.profile.loginSubheading : t.profile.registerSubheading}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="auth-email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    {t.profile.emailLabel}
                  </Label>
                  <Input
                    id="auth-email"
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder={t.profile.emailPlaceholder}
                    autoComplete="email"
                    required
                    aria-invalid={!!emailError}
                    className={cn(
                      'h-14 rounded-2xl border border-input bg-muted px-6 font-bold',
                      emailError && 'border-destructive text-destructive'
                    )}
                  />
                  {emailError ? (
                    <p className="mt-2 text-xs text-destructive">{emailError}</p>
                  ) : null}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="auth-password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      {t.profile.passwordLabel}
                    </Label>
                    <p className="text-[10px] text-muted-foreground">{t.profile.passwordRequirements}</p>
                  </div>
                  <div className="relative">
                    <Input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder={t.profile.passwordPlaceholder}
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      minLength={6}
                      required
                      aria-invalid={!!passwordError}
                      className={cn(
                        'h-14 rounded-2xl border border-input bg-muted px-6 pr-14 font-bold',
                        passwordError && 'border-destructive text-destructive'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t.profile.hidePasswordLabel : t.profile.showPasswordLabel}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordError ? (
                    <p className="mt-2 text-xs text-destructive">{passwordError}</p>
                  ) : null}
                </div>
                {authMode === 'register' ? (
                  <div>
                    <Label htmlFor="auth-confirm-password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      {t.profile.confirmPasswordLabel}
                    </Label>
                    <div className="relative">
                      <Input
                        id="auth-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t.profile.confirmPasswordPlaceholder}
                        autoComplete="new-password"
                        minLength={6}
                        required
                        aria-invalid={!!confirmPasswordError}
                        className={cn(
                          'h-14 rounded-2xl border border-input bg-muted px-6 pr-14 font-bold',
                          confirmPasswordError && 'border-destructive text-destructive'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? t.profile.hidePasswordLabel : t.profile.showPasswordLabel}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmPasswordError ? (
                      <p className="mt-2 text-xs text-destructive">{confirmPasswordError}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {authError ? (
                <div className="rounded-2xl bg-destructive/10 p-4 border border-destructive/20" role="alert">
                  <p className="text-sm text-destructive font-medium">{authError}</p>
                </div>
              ) : authMessage ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    'rounded-2xl p-4 border',
                    authMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                      : 'bg-blue-50 border-blue-100 text-blue-900'
                  )}
                >
                  <p className="text-sm font-medium">{authMessage.text}</p>
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting || !isAuthFormValid}
                className="h-16 w-full rounded-[1.75rem] bg-foreground text-primary font-black text-lg shadow-2xl active-scale transition-transform hover:bg-foreground/90 hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {authMode === 'login' ? t.profile.loginAction : t.profile.registerAction}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background p-4 pt-6 pb-24">
      <div className="container mx-auto max-w-2xl">
        <header className="mb-8 flex flex-col items-center">
          <div className="relative rounded-[3rem] bg-white p-8 shadow-2xl ring-1 ring-black/[0.05]">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mx-auto mb-6 h-32 w-32 rounded-[2.8rem] bg-gradient-to-br from-primary/20 to-transparent p-1 shadow-xl ring-1 ring-black/[0.05]">
              <Avatar className="h-full w-full rounded-[2.5rem] overflow-hidden bg-muted">
                <AvatarImage src={localAvatar || profileData?.photo_url || `https://i.pravatar.cc/150?u=${user?.id}`} className="object-cover" />
                <AvatarFallback className="text-3xl font-black">{profileData?.display_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </motion.div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <Button 
              size="icon" 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 h-12 w-12 rounded-[1.75rem] bg-primary text-foreground shadow-xl ring-4 ring-background active-scale"
            >
              <Camera className="h-5 w-5" />
            </Button>
            
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-white/70 backdrop-blur-sm text-foreground shadow-sm active-scale">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] border-none bg-white p-8 z-[150] shadow-2xl ring-1 ring-black/[0.05]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic tracking-tighter">{t.profile.editProfile}</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.profile.displayNameLabel}</Label>
                  <Input value={newDisplayName} placeholder={profileData?.display_name} onChange={(e) => setNewDisplayName(e.target.value)} className="h-14 rounded-[1.75rem] border-none bg-muted px-6 font-bold" />
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveProfile} className="h-14 w-full rounded-[1.75rem] bg-primary text-foreground font-black shadow-lg">{t.profile.saveChanges}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight">{profileData?.display_name || 'Nabolagsvenn'}</h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
             <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-primary">
               <Star className="h-4 w-4 fill-current" />
               {profileData?.stats?.reputation?.toFixed(1) || '5.0'} {t.profile.reputationLabel}
             </span>
          </div>
        </header>

        <section className="mb-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="border-none bg-white shadow-lg rounded-[2.5rem] ring-1 ring-black/[0.04] overflow-hidden">
              <CardContent className="p-8">
                <Leaf className="mb-4 h-5 w-5 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-3xl font-black italic tracking-tighter text-green-700">{co2Saved.toFixed(1)}kg</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-800/40 mt-2">{t.profile.co2Saved}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none bg-white shadow-lg rounded-[2.5rem] ring-1 ring-black/[0.04] overflow-hidden">
              <CardContent className="p-8">
                <Package className="mb-4 h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-3xl font-black italic tracking-tighter text-foreground">{completedSwaps}</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-2">{t.profile.itemsSaved}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-2 gap-3 rounded-[2.25rem] bg-white p-2 shadow-sm ring-1 ring-black/[0.05] sm:grid-cols-4">
            <TabsTrigger value="items" className="rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.25em] py-3">{t.profile.myItems}</TabsTrigger>
            <TabsTrigger value="favs" className="rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.25em] py-3">{t.profile.savedItems}</TabsTrigger>
            <TabsTrigger value="history" className="rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.25em] py-3">{t.profile.history}</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.25em] py-3">{t.profile.reviews}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items">
            <AnimatePresence mode="wait">
              {items && items.length > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                  {items.map(item => <ItemCard key={item.id} item={item} />)}
                </motion.div>
              ) : (
                <div className="flex h-52 flex-col items-center justify-center rounded-[3rem] bg-white shadow-lg ring-1 ring-black/[0.03] p-10 text-center border border-dashed border-muted/50">
                  <Package className="mb-4 h-12 w-12 text-muted-foreground/40" />
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground/70 mb-4">{t.profile.noPosts}</p>
                  <Button asChild className="rounded-[1.75rem] bg-primary text-foreground font-black px-6 h-12 shadow-lg active-scale"><Link href={`/post?lang=${lang}`}>{t.post.title}</Link></Button>
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
                 txs.map((tx, idx) => {
                   const amount = typeof tx.amount === 'number' ? tx.amount : (typeof tx.amount === 'string' && !isNaN(Number(tx.amount)) ? Number(tx.amount) : 0);
                   return (
                   <Card key={String(tx.id ?? idx)} className="border-none bg-white shadow-sm rounded-2xl ring-1 ring-black/[0.03]">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", amount > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                            {amount > 0 ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold truncate max-w-[140px]">{tx.item_title || (amount > 0 ? t.profile.initialBonus : 'Swap')}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                              {amount > 0 ? t.profile.receivedFrom : t.profile.sentTo} {tx.target_name || 'Neighbor'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-sm font-black italic", amount > 0 ? "text-green-600" : "text-foreground")}>
                            {amount > 0 ? '+' : ''}{amount} pts
                          </p>
                          <p className="text-[8px] font-medium text-muted-foreground">{format(new Date(tx.created_at ?? ''), 'dd.MM, HH:mm')}</p>
                        </div>
                      </CardContent>
                   </Card>
                   );
                 })
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
              {revs && revs.length > 0 ? (
                revs.sort((a,b) => new Date(b.created_at ?? b.createdAt ?? '').getTime() - new Date(a.created_at ?? a.createdAt ?? '').getTime()).map(rev => (
                  <Card key={rev.id} className="border-none bg-white shadow-sm rounded-[2rem] ring-1 ring-black/[0.03] overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10 rounded-xl">
                          <AvatarImage src={`https://i.pravatar.cc/40?u=${rev.from_id ?? rev.fromName ?? rev.fromName}`} />
                          <AvatarFallback>{(rev.from_name ?? rev.fromName)?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-xs font-black">{rev.from_name ?? rev.fromName}</h3>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={cn("h-3 w-3", i < ((rev.rating ?? 5)) ? "fill-primary text-primary" : "text-muted-foreground/20")} />
                              ))}
                            </div>
                          </div>
                          <p className="text-[11px] text-foreground/80">{rev.content}</p>
                          <p className="text-[8px] font-medium text-muted-foreground/50 mt-2">{format(new Date(rev.created_at ?? rev.createdAt ?? ''), 'dd.MM.yyyy')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-[2.5rem] bg-white text-muted-foreground shadow-sm ring-1 ring-black/[0.03] p-10 text-center border-2 border-dashed border-muted/50">
                  <Star className="mb-4 h-12 w-12 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{t.profile.noReviews}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
