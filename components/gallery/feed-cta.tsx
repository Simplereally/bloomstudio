"use client"

import { Button } from "@/components/ui/button"
import { trackCtaClick, trackCtaDismiss, trackCtaView } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { useAuth } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import * as React from "react"

interface FeedCtaProps {
    className?: string
}

/**
 * Floating call-to-action for unauthenticated users on the feed page.
 * Encourages visitors to sign up after seeing community creations.
 * Only renders for unauthenticated users.
 */
export function FeedCta({ className }: FeedCtaProps) {
    const { isSignedIn, isLoaded } = useAuth()
    const [isVisible, setIsVisible] = React.useState(false)
    const [isDismissed, setIsDismissed] = React.useState(false)

    // Show CTA after user has scrolled a bit (engagement signal)
    React.useEffect(() => {
        if (!isLoaded || isSignedIn || isDismissed) return

        const handleScroll = () => {
            // Show after scrolling 300px (roughly 2-3 images viewed)
            if (window.scrollY > 300 && !isVisible) {
                setIsVisible(true)
                trackCtaView()
            }
        }

        // Also show after a short delay if user doesn't scroll
        const timer = setTimeout(() => {
            if (!isVisible) {
                setIsVisible(true)
                trackCtaView()
            }
        }, 5000)

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", handleScroll)
            clearTimeout(timer)
        }
    }, [isLoaded, isSignedIn, isDismissed])

    // Don't render for authenticated users or while loading
    if (!isLoaded || isSignedIn || isDismissed) {
        return null
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
                        className
                    )}
                >
                    <div className="relative group">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/60 via-purple-500/60 to-pink-500/60 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity" />

                        {/* Main CTA container */}
                        <div className="relative flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                            {/* Icon */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>

                            {/* Text */}
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">
                                    Inspired by what you see?
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Create your own AI masterpiece for free
                                </span>
                            </div>

                            {/* Sign up button */}
                            <Link href="/sign-up" onClick={trackCtaClick}>
                                <Button
                                    size="sm"
                                    className="rounded-full px-5 gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-lg hover:shadow-primary/25 transition-all hover:scale-105"
                                >
                                    Start Creating
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>

                            {/* Dismiss button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDismissed(true)
                                    trackCtaDismiss()
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Dismiss"
                            >
                                <span className="text-xs font-bold">×</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
