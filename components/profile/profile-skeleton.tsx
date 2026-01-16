"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { MasonryGrid } from "@/components/ui/masonry-grid"

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen pt-4 pb-4">
      <div className="container mx-auto px-4 space-y-4">
        {/* Compact Header Skeleton */}
        <div className="flex items-center gap-4 py-2">
          {/* Avatar Skeleton */}
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />

          {/* User Info Skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* Follow Button Skeleton */}
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>

        {/* Grid Skeleton */}
        <div className="border-t border-border/40 pt-4 px-1 md:px-2 max-w-[2400px] mx-auto">
          <MasonryGrid minColumnWidth={260} gap={4}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="rounded-lg animate-pulse bg-muted"
                style={{
                  aspectRatio: [1, 0.75, 1.33, 0.56, 1.78][i % 5],
                }}
              />
            ))}
          </MasonryGrid>
        </div>
      </div>
    </div>
  )
}
