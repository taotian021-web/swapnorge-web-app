import Link from 'next/link';
import {
  ShoppingBag,
  User,
  Plus,
  Megaphone,
  Camera,
  Heart,
  Users,
  Globe,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-bold tracking-tight text-foreground">
            NeighborBuy
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-5 w-5" />
                Post
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>What would you like to post?</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/post/share-deal">
                <DropdownMenuItem>
                  <Megaphone className="mr-2 h-4 w-4" />
                  <span>Share a Deal</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/post/group-buy">
                <DropdownMenuItem>
                  <Camera className="mr-2 h-4 w-4" />
                  <span>Start a Group Buy</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/post/recommend-service">
                <DropdownMenuItem>
                  <Heart className="mr-2 h-4 w-4" />
                  <span>Recommend a Service</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/post/organize-activity">
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Organize an Activity</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Globe className="h-5 w-5" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <span>English</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Norwegian</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://i.pravatar.cc/150?u=current-user" alt="User" />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Your Name</p>
                  <p className="text-xs leading-none text-muted-foreground">you@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>My Listings</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
