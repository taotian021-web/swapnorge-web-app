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
          <p className="text-sm text-muted-foreground">由邻居发布</p>
          <h3 className="font-bold">{seller.name}</h3>
        </div>
      </div>
      <div className="space-y-4">
        <div>
            <div className="mb-1 flex justify-between text-sm">
            <h4 className="font-semibold">热心值</h4>
            <span className="font-bold">{seller.trustScore}/100</span>
            </div>
            <CustomProgress
            value={seller.trustScore}
            indicatorClassName={getProgressColor(seller.trustScore)}
            />
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
            <div>
                <p className="font-bold text-lg">{seller.positiveFeedbackRate}%</p>
                <p className="text-xs text-muted-foreground">好评率</p>
            </div>
            <div>
                <p className="font-bold text-lg">{seller.responseRate}%</p>
                <p className="text-xs text-muted-foreground">响应率</p>
            </div>
        </div>
        <p className="mt-2 text-xs text-center text-muted-foreground">
          基于 {seller.ratings} 条邻里评价
        </p>
      </div>
    </div>
  );
}
