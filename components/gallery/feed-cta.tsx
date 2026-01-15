"use client"

import { Button } from "@/components/ui/button"
import { trackCtaClick, trackCtaView } from "@/lib/analytics"
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


    // Show CTA after user has scrolled a bit (engagement signal)
    React.useEffect(() => {
        if (!isLoaded || isSignedIn) return

        const handleScroll = () => {
            // Show after scrolling 600px (roughly 4-6 images viewed)
            if (window.scrollY > 1200 && !isVisible) {
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
        }, 8000)

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", handleScroll)
            clearTimeout(timer)
        }
    }, [isLoaded, isSignedIn])

    // Don't render for authenticated users or while loading
    if (!isLoaded || isSignedIn) {
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
                        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto",
                        className
                    )}
                >
                    <div className="flex flex-row items-center justify-between sm:justify-start gap-4 p-3 pl-5 sm:px-6 sm:py-4 rounded-full border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl backdrop-saturate-150 bg-black/5 dark:bg-black/10">
                        {/* Icon - Hidden on mobile to save space */}
                        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20 shrink-0">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>

                        {/* Text - Mix blend diff for dynamic contrast */}
                        <div className="flex flex-col gap-0.5 mr-auto mix-blend-difference text-white">
                            <span className="text-sm font-semibold whitespace-nowrap">
                                Inspired by what you see?
                            </span>
                            <span className="text-xs font-medium hidden sm:block opacity-90">
                                Create your own AI masterpiece for free
                            </span>
                        </div>

                        {/* Sign up button */}
                        <Link href="/sign-up" onClick={trackCtaClick} className="shrink-0">
                            <Button
                                size="sm"
                                className="rounded-full px-4 sm:px-5 gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-lg hover:shadow-primary/25 transition-all hover:scale-105"
                            >
                                Start Creating
                                <ArrowRight className="w-4 h-4 hidden sm:block" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
