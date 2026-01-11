"use client"

import { useState, useEffect, useRef, RefObject } from "react"

interface UseSmartVideoProps {
  priority?: boolean
  lazy?: boolean
}

interface UseSmartVideoReturn {
  videoRef: RefObject<HTMLVideoElement | null>
  shouldLoad: boolean
}

export function useSmartVideo({ priority = false, lazy = true }: UseSmartVideoProps): UseSmartVideoReturn {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // If priority is true, we force load immediately (not lazy)
  // If not lazy, we also load immediately
  const [shouldLoad, setShouldLoad] = useState(!lazy || priority)
  
  useEffect(() => {
    // If we're already loading, no need to observe
    if (shouldLoad) return
    // Safety check if ref exists
    if (!videoRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      // Load when within 200px of viewport to ensure smooth playback on scroll
      { rootMargin: "200px" } 
    )

    observer.observe(videoRef.current)
    return () => observer.disconnect()
  }, [shouldLoad])

  return {
    videoRef,
    shouldLoad
  }
}
