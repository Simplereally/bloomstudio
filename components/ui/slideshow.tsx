"use client"

import { cn } from "@/lib/utils"
import { useSlideshow, UseSlideshowOptions } from "@/hooks/use-slideshow"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ReactNode, forwardRef, useImperativeHandle, useRef } from "react"
import NextImage from "next/image"

export interface SlideshowSlide {
  /** Unique key for the slide */
  key: string | number
  /** The slide content to render */
  content: ReactNode
  /** Optional label to display in the info bar */
  label?: string
  /** Optional thumbnail image source for the thumbnail strip. If not provided, falls back to default styling. */
  thumbnailSrc?: string
}

export interface SlideshowProps {
  /** Array of slides to display */
  slides: SlideshowSlide[]
  /** Additional class name for the container */
  className?: string
  /** Options passed to the useSlideshow hook */
  options?: Omit<UseSlideshowOptions, "totalSlides">
  /** Whether to show navigation arrows (default: true) */
  showArrows?: boolean
  /** Whether to show thumbnail strip (default: true) */
  showThumbnails?: boolean
  /** Whether to show progress dots (default: true) */
  showProgress?: boolean
  /** Whether to show slide info/label (default: true) */
  showInfo?: boolean
  /** Aspect ratio for the main display (default: "16/9") */
  aspectRatio?: string
  /** Maximum height constraint for the slideshow frame */
  maxHeight?: string
  /** Additional className for the inner frame */
  frameClassName?: string
  /** Additional className for thumbnail items */
  thumbnailClassName?: string
}

export interface SlideshowRef {
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  activeIndex: number
}

/**
 * A premium slideshow/carousel component with:
 * - Glassmorphism styling
 * - Smooth slide transitions
 * - Navigation arrows
 * - Thumbnail strip with lazy-loaded images
 * - Progress indicators
 * - Auto-advance with visibility detection
 * - Hover pause
 * - Timer reset on manual interaction
 * 
 * Thumbnails are rendered internally using declarative `thumbnailSrc` data,
 * allowing parent components to remain Server Components.
 */
export const Slideshow = forwardRef<SlideshowRef, SlideshowProps>(function Slideshow(
  {
    slides,
    className,
    options,
    showArrows = true,
    showThumbnails = true,
    showProgress = true,
    showInfo = true,
    aspectRatio = "16/9",
    maxHeight,
    frameClassName,
    thumbnailClassName,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    activeIndex,
    setActiveIndex,
    next,
    prev,
    setIsHovering,
  } = useSlideshow({
    totalSlides: slides.length,
    observerRef: containerRef as React.RefObject<HTMLElement | null>,
    ...options,
  })

  // Expose imperative methods via ref
  useImperativeHandle(ref, () => ({
    next,
    prev,
    goTo: setActiveIndex,
    activeIndex,
  }), [next, prev, setActiveIndex, activeIndex])

  if (slides.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col items-center", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Main showcase container with glass morphism - inline-flex to wrap content tightly */}
      <div className="relative inline-flex rounded-2xl md:rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl p-2 md:p-3">
        {/* Inner frame */}
        <div 
          className={cn("relative rounded-xl md:rounded-2xl overflow-hidden bg-black/40", frameClassName)}
          style={{ aspectRatio, maxHeight }}
        >
          {/* Slides container */}
          <div className="absolute inset-0">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex
              const isPrev = index === (activeIndex - 1 + slides.length) % slides.length
              const isNext = index === (activeIndex + 1) % slides.length

              return (
                <div
                  key={slide.key}
                  className={cn(
                    "absolute inset-0 transition-all duration-700 ease-out",
                    isActive && "opacity-100 scale-100 z-20",
                    isPrev && "opacity-0 -translate-x-full scale-95 z-10",
                    isNext && "opacity-0 translate-x-full scale-95 z-10",
                    !isActive && !isPrev && !isNext && "opacity-0 scale-90 z-0"
                  )}
                >
                  {slide.content}

                  {/* Label overlay - cinema style bottom bar */}
                  {showInfo && slide.label && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-6 px-6 md:px-8">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-white/60 text-xs md:text-sm uppercase tracking-wider mb-1">
                            {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                          </p>
                          <h3 className="text-white text-lg md:text-2xl font-semibold leading-tight">
                            {slide.label}
                          </h3>
                        </div>
                        {/* Decorative line */}
                        <div className="hidden md:block flex-1 max-w-xs">
                          <div className="h-px bg-gradient-to-r from-white/30 to-transparent" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>

          {/* Navigation arrows */}
          {showArrows && slides.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 hover:border-white/20 transition-all duration-300 group"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={next}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 hover:border-white/20 transition-all duration-300 group"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}
      </div>

      {/* Thumbnail strip - rendered with declarative thumbnailSrc data */}
      {showThumbnails && slides.length > 1 && (
        <div className="mt-4 md:mt-6 flex justify-center gap-2 md:gap-3">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex
            
            return (
              <button
                key={slide.key}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative rounded-lg overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  "w-20 h-16 sm:w-24 sm:h-20 md:w-28 md:h-24",
                  isActive
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "opacity-60 hover:opacity-90 grayscale-[30%] hover:grayscale-0",
                  thumbnailClassName
                )}
                aria-label={`Go to slide ${index + 1}: ${slide.label || ""}`}
              >
                {slide.thumbnailSrc ? (
                  <NextImage
                    src={slide.thumbnailSrc}
                    alt={slide.label || `Slide ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : (
                  /* Fallback for slides without thumbnail */
                  <div className="h-full w-full bg-gradient-to-br from-card/80 to-card/40" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Progress indicators */}
      {showProgress && slides.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.key}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                index === activeIndex
                  ? "w-8 bg-primary"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
})

