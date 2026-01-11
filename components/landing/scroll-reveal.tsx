"use client"

/**
 * ScrollReveal - Progressive Enhancement Animation Component
 *
 * This component provides scroll-triggered reveal animations.
 * It's a Client Component but uses progressive enhancement:
 * - Server-side: Content is rendered with initial visible state using CSS
 * - Client-side: IntersectionObserver adds smooth reveal animations
 *
 * For critical above-the-fold content, use `instant={true}` which ensures
 * content is visible immediately without waiting for hydration.
 */

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface ScrollRevealProps {
    children: React.ReactNode
    className?: string
    delay?: number
    /** Optional horizontal offset for slide-in animation (e.g., -50 for left, 50 for right) */
    x?: number
    /** If true, content is visible immediately without waiting for scroll/hydration */
    instant?: boolean
}

export function ScrollReveal({ children, className, delay = 0, x = 0, instant = false }: ScrollRevealProps) {
    // For instant content, start visible. For non-instant, we'll animate in on scroll
    const [isVisible, setIsVisible] = useState(instant)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // If instant, we're already visible - no need for observer
        if (instant) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1, rootMargin: "50px" }
        )

        if (ref.current) observer.observe(ref.current)

        return () => observer.disconnect()
    }, [instant])

    return (
        <div
            ref={ref}
            className={cn(
                "transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]",
                isVisible ? "opacity-100" : "opacity-0",
                className
            )}
            style={{
                transitionDelay: `${delay}ms`,
                transform: isVisible ? 'translate(0, 0)' : `translate(${x}px, 32px)`
            }}
        >
            {children}
        </div>
    )
}
