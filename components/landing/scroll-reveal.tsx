"use client"

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
  const [isVisible, setIsVisible] = useState(instant)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
      style={{ 
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

