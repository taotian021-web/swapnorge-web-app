
'use client';

import * as React from 'react';
import { Header } from '@/components/neighbor-buy/Header';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto max-w-4xl px-4 py-8 md:px-8">
            <p>Loading user profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto max-w-4xl px-4 py-8 md:px-8">
            <p>Please sign in to view your profile.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8 md:px-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt="User" />
                <AvatarFallback>{user.isAnonymous ? 'A' : (user.displayName || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {user.isAnonymous ? 'Anonymous User' : user.displayName || 'My Profile'}
                </CardTitle>
                <p className="text-muted-foreground">{user.email || `User ID: ${user.uid}`}</p>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="my-6" />
              <div>
                <h3 className="text-xl font-semibold">My Drafts</h3>
                <p className="mt-2 text-muted-foreground">
                  These are items you've created but haven't shared with the community yet.
                </p>
                <div className="mt-6 flex h-40 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                  <p className="text-center text-muted-foreground">You have no drafts currently.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
