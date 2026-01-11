import { useState, useCallback, useEffect, useRef, RefObject } from "react"

export interface UseVideoSlideshowOptions {
  /** Total number of slides */
  totalSlides: number
  /** Delay between auto-advances in milliseconds (default: 4000) */
  autoAdvanceDelay?: number
  /** IntersectionObserver threshold for visibility detection (default: 0.7) */
  visibilityThreshold?: number
  /** Whether auto-advance is enabled (default: true) */
  autoAdvanceEnabled?: boolean
  /** External ref to observe for visibility. If not provided, you must attach the returned ref. */
  observerRef?: RefObject<HTMLElement | null>
}

export interface UseVideoSlideshowReturn {
  /** Current active slide index (0-based) */
  activeIndex: number
  /** Set the active slide index directly */
  setActiveIndex: (index: number) => void
  /** Go to the next slide */
  next: () => void
  /** Go to the previous slide */
  prev: () => void
  /** Whether the carousel is currently visible in the viewport */
  isVisible: boolean
  /** Whether the user is currently hovering over the carousel */
  isHovering: boolean
  /** Set hover state (call onMouseEnter/onMouseLeave) */
  setIsHovering: (hovering: boolean) => void
  /** Ref to attach to the container element for visibility observation */
  containerRef: RefObject<HTMLElement | null>
}

/**
 * Custom hook for slideshow/carousel logic with:
 * - Auto-advance with configurable delay
 * - Visibility-aware playback (only advances when in viewport)
 * - Hover pause functionality
 * - Timer reset on manual navigation
 * 
 * @example
 * ```tsx
 * const { activeIndex, next, prev, setIsHovering, containerRef } = useVideoSlideshow({
 *   totalSlides: 5,
 *   autoAdvanceDelay: 4000,
 * })
 * 
 * return (
 *   <div ref={containerRef} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
 *     {slides[activeIndex]}
 *     <button onClick={prev}>Prev</button>
 *     <button onClick={next}>Next</button>
 *   </div>
 * )
 * ```
 */
export function useVideoSlideshow({
  totalSlides,
  autoAdvanceDelay = 4000,
  visibilityThreshold = 0.7,
  autoAdvanceEnabled = true,
  observerRef,
}: UseVideoSlideshowOptions): UseVideoSlideshowReturn {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const internalRef = useRef<HTMLElement | null>(null)
  
  // Use external ref if provided, otherwise use internal ref
  const containerRef = observerRef ?? internalRef

  const next = useCallback(() => {
    if (totalSlides === 0) return
    setActiveIndex((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prev = useCallback(() => {
    if (totalSlides === 0) return
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  // Intersection Observer to detect when the slideshow is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: visibilityThreshold }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [containerRef, visibilityThreshold])

  // Auto-advance logic:
  // 1. Only runs when visible
  // 2. Only runs when not hovering
  // 3. Resets the timer whenever activeIndex changes (preventing jarring jumps after manual clicks)
  useEffect(() => {
    if (!autoAdvanceEnabled || !isVisible || isHovering || totalSlides === 0) {
      return
    }

    const interval = setInterval(next, autoAdvanceDelay)
    return () => clearInterval(interval)
  }, [autoAdvanceEnabled, isVisible, isHovering, next, totalSlides, autoAdvanceDelay, activeIndex])

  return {
    activeIndex,
    setActiveIndex,
    next,
    prev,
    isVisible,
    isHovering,
    setIsHovering,
    containerRef,
  }
}

