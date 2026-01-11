"use client"

import React from "react"
import { cn } from "@/lib/utils"
// Use custom hook for logic separation
import { useSmartVideo } from "@/hooks/use-smart-video"

interface SmartVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string
  /** If true, browser is instructed to preload eagerly. Good for LCP. */
  priority?: boolean
  /** If true, video only starts loading when it enters the viewport. */
  lazy?: boolean
}

export function SmartVideo({ 
  src, 
  priority = false, 
  lazy = true, 
  className,
  ...props 
}: SmartVideoProps) {
  const { videoRef, shouldLoad } = useSmartVideo({ priority, lazy })

  return (
    <video
      ref={videoRef}
      // Only set src when we want to load. 
      // Note: Changing src from undefined to string triggers load.
      src={shouldLoad ? src : undefined}
      preload={priority ? "auto" : "metadata"}
      className={cn(className, !shouldLoad && "bg-black/10")} 
      // Essential for avoiding hydration mismatch if extensions inject attributes
      suppressHydrationWarning
      {...props}
    />
  )
}
