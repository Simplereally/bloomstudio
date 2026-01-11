"use client";

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { useRef } from "react";
import { SmartVideo } from "@/components/ui/smart-video";
import { cn } from "@/lib/utils";

const isVideo = (src: string) => src.toLowerCase().endsWith(".mp4");

interface SolutionHeroCarouselProps {
  images: string[];
  /** Optional className for the outer container - use this to control sizing from parent */
  className?: string;
}

/**
 * A presentational carousel component for solution hero images/videos.
 * Sizing should be controlled by the parent via className prop.
 * The component maintains 9:16 aspect ratio internally.
 */
export function SolutionHeroCarousel({ images, className }: SolutionHeroCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));

  return (
    <div className={cn("relative aspect-[9/16]", className)}>
      <div className="relative w-full h-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm ring-1 ring-white/20">
        <Carousel
          plugins={[plugin.current]}
          className="w-full h-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent className="h-full ml-0">
            {images.length > 0
              ? images.map((src, index) => (
                  <CarouselItem key={index} className="h-full pl-0">
                    <div className="relative w-full h-full bg-black/40 border border-white/5">
                      <div className="absolute inset-0">
                        {isVideo(src) ? (
                          <SmartVideo
                             src={src}
                             className="h-full w-full object-cover"
                             autoPlay
                             muted
                             loop
                             playsInline
                             priority={index === 0}
                             lazy={index !== 0}
                          />
                        ) : (
                          <Image
                            src={src}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority={index === 0}
                          />
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))
              : // Fallback if no images provided
                [1, 2, 3].map((_, index) => (
                  <CarouselItem key={index} className="h-full pl-0">
                    <div className="relative w-full h-full bg-secondary/20 border border-white/5 flex items-center justify-center">
                      <span className="text-muted-foreground">No Preview</span>
                    </div>
                  </CarouselItem>
                ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
