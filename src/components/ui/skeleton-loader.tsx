'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 🔧 FIX #3A: Generic Skeleton Loader
 * 用于显示基础加载状态
 */
export function SkeletonLoader() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-12 w-40 rounded-lg" />
    </div>
  );
}

/**
 * 🔧 FIX #3B: POST Page Skeleton Loader
 * 针对POST页面的详细加载状态
 */
export function PostPageSkeletonLoader() {
  return (
    <div className="space-y-6 p-4">
      {/* Title input skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      {/* Description textarea skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>

      {/* Category/Condition selectors skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Points slider skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>

      {/* Image upload skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>

      {/* Submit button skeleton */}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

/**
 * 🔧 FIX #3C: Profile Page Skeleton Loader
 * 针对Profile页面的详细加载状态
 */
export function ProfilePageSkeletonLoader() {
  return (
    <div className="space-y-6 p-4">
      {/* Header with avatar and stats */}
      <div className="flex items-center gap-4">
        {/* Avatar skeleton */}
        <Skeleton className="h-16 w-16 rounded-full" />
        {/* User info skeleton */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b">
        <Skeleton className="h-10 w-24 rounded" />
        <Skeleton className="h-10 w-24 rounded" />
      </div>

      {/* Content list skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * 🔧 FIX #3D: Activity Page Skeleton Loader
 * 针对Activity页面的详细加载状态
 */
export function ActivityPageSkeletonLoader() {
  return (
    <div className="space-y-4 p-4">
      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-20 rounded" />
        <Skeleton className="h-10 w-20 rounded" />
      </div>

      {/* Activity items skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 rounded-lg border p-3">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 🔧 FIX #3E: Centered Loading State
 * 用于全屏加载状态
 */
export function CenteredSkeletonLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
