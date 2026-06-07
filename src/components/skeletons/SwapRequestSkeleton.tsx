'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function SwapRequestSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded" />
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded" />
        <Skeleton className="h-8 flex-1 rounded" />
      </div>
    </div>
  );
}

export function SwapRequestSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SwapRequestSkeleton key={i} />
      ))}
    </div>
  );
}
