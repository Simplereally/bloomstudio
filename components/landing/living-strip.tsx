"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

/**
 * Curated images for the Living Strip.
 * Selected to showcase variety: different styles, models, and visual impact.
 * Uses the same assets as the community section for consistency.
 */
const STRIP_IMAGES = [
    {
        src: "/community/portrait.png",
        alt: "Hyperrealistic portrait with cinematic lighting",
    },
    {
        src: "/community/fantasy.png",
        alt: "Fantasy landscape with floating islands",
    },
    {
        src: "/community/product.png",
        alt: "Luxury watch product photography",
    },
    {
        src: "/community/cyberpunk.png",
        alt: "Cyberpunk cityscape at night",
    },
    {
        src: "/community/cat.png",
        alt: "Fluffy orange cat in sunbeam",
    },
    {
        src: "/community/abstract.png",
        alt: "Abstract fluid art with vibrant colors",
    },
    {
        src: "/community/fashion.png",
        alt: "Avant-garde fashion editorial",
    },
    {
        src: "/community/interior.png",
        alt: "Cozy cabin interior with mountain view",
    },
];

interface LivingStripProps {
    className?: string;
}

/**
 * LivingStrip - Infinite scrolling marquee of community images
 *
 * Creates a "window into the creative stream" effect on the landing page.
 * Auto-scrolls horizontally in a seamless loop, pauses on hover.
 *
 * Design decisions:
 * - CSS-only animation for performance (no JS animation library)
 * - Duplicated content creates seamless infinite loop
 * - Fade masks on edges create depth and focus
 * - Respects prefers-reduced-motion for accessibility
 * - Click navigates to full public feed
 */
export function LivingStrip({ className }: LivingStripProps) {
    const [isPaused, setIsPaused] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Check for reduced motion preference
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    // Duplicate images for seamless loop
    const duplicatedImages = [...STRIP_IMAGES, ...STRIP_IMAGES];

    return (
        <section
            className={cn(
                "relative py-6 md:py-8 lg:py-10 overflow-hidden",
                className
            )}
            aria-label="Community creations preview"
        >
            {/* Atmospheric glow behind the strip */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

            {/* Left fade mask - creates depth effect */}
            <div
                className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 lg:w-40 z-10 pointer-events-none"
                style={{
                    background:
                        "linear-gradient(to right, rgb(0 0 0 / 0.95) 0%, rgb(0 0 0 / 0.7) 30%, transparent 100%)",
                }}
            />

            {/* Right fade mask - creates depth effect */}
            <div
                className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 lg:w-40 z-10 pointer-events-none"
                style={{
                    background:
                        "linear-gradient(to left, rgb(0 0 0 / 0.95) 0%, rgb(0 0 0 / 0.7) 30%, transparent 100%)",
                }}
            />

            {/* Marquee container */}
            <div
                ref={containerRef}
                className="relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Marquee track */}
                <div
                    className={cn(
                        "flex gap-3 md:gap-4 lg:gap-5",
                        // Animation classes
                        !prefersReducedMotion && "animate-marquee",
                        // Pause on hover
                        isPaused && "[animation-play-state:paused]"
                    )}
                    style={{
                        // Ensure width accommodates all duplicated items
                        width: "max-content",
                    }}
                >
                    {duplicatedImages.map((image, index) => (
                        <Link
                            key={`${image.src}-${index}`}
                            href="/feed/public"
                            className="group relative shrink-0 block"
                            aria-label={`${image.alt} - View community feed`}
                        >
                            {/* Image container with glass border effect */}
                            <div
                                className={cn(
                                    // Size scales with breakpoints
                                    "relative h-28 w-40 sm:h-32 sm:w-48 md:h-36 md:w-56 lg:h-40 lg:w-64 3xl:h-48 3xl:w-72 4xl:h-56 4xl:w-80",
                                    // Rounded corners and overflow
                                    "rounded-xl md:rounded-2xl overflow-hidden",
                                    // Glass border effect
                                    "border border-white/10",
                                    // Shadow and hover effects
                                    "shadow-lg shadow-black/20",
                                    "transition-all duration-300 ease-out",
                                    "group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/10",
                                    // Slight scale on hover
                                    "group-hover:scale-105 group-hover:z-20"
                                )}
                            >
                                <Image
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, (max-width: 1024px) 224px, (max-width: 2000px) 256px, 288px"
                                    className={cn(
                                        "object-cover",
                                        "transition-transform duration-500 ease-out",
                                        "group-hover:scale-110"
                                    )}
                                    // Don't priority load as this is below the fold
                                    loading="lazy"
                                />

                                {/* Subtle gradient overlay for depth */}
                                <div
                                    className={cn(
                                        "absolute inset-0",
                                        "bg-gradient-to-t from-black/30 via-transparent to-transparent",
                                        "opacity-100 group-hover:opacity-0 transition-opacity duration-300"
                                    )}
                                />

                                {/* Hover overlay with "Explore" hint */}
                                <div
                                    className={cn(
                                        "absolute inset-0 flex items-center justify-center",
                                        "bg-black/40 backdrop-blur-sm",
                                        "opacity-0 group-hover:opacity-100",
                                        "transition-opacity duration-300"
                                    )}
                                >
                                    <span className="text-xs md:text-sm font-medium text-white/90 tracking-wide uppercase">
                                        Explore
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Subtle label */}
            <div className="flex justify-center mt-4 md:mt-6">
                <Link
                    href="/feed/public"
                    className="group inline-flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span className="h-px w-8 bg-current opacity-30" />
                    <Button variant="default" size="sm">
                        Get inspired
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <span className="h-px w-8 bg-current opacity-30" />
                </Link>
            </div>

            {/* Reduced motion fallback - show static grid */}
            {prefersReducedMotion && (
                <p className="sr-only">
                    Animation paused due to reduced motion preference. Click any image to
                    explore the community feed.
                </p>
            )}
        </section>
    );
}
