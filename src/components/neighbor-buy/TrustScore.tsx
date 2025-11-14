"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import type { Seller } from '@/lib/types';
import { cn } from '@/lib/utils';
import * as ProgressPrimitive from "@radix-ui/react-progress"


type TrustScoreProps = {
  seller: Seller;
};

const CustomProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
CustomProgress.displayName = ProgressPrimitive.Root.displayName


export function TrustScore({ seller }: TrustScoreProps) {
  const getProgressColor = (score: number) => {
    if (score > 90) return 'bg-green-500';
    if (score > 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={seller.avatarUrl} alt={seller.name} />
          <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">Sold by</p>
          <h3 className="font-bold">{seller.name}</h3>
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between">
          <h4 className="font-semibold">Neighborhood Trust Score</h4>
          <span className="font-bold">{seller.trustScore}/100</span>
        </div>
        <CustomProgress
          value={seller.trustScore}
          indicatorClassName={getProgressColor(seller.trustScore)}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Based on {seller.ratings} ratings from neighbors.
        </p>
      </div>
    </div>
  );
}
