"use client"

import { ImageLightbox } from "@/components/images/image-lightbox"
import { ImageCard, type ImageCardData } from "@/components/ui/image-card"
import { MasonryGrid } from "@/components/ui/masonry-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, type Variants } from "framer-motion"
import { ArrowUp, Loader2, Sparkles } from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"

interface PaginatedImageGridProps {
    images: ImageCardData[]
    status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted"
    loadMore: (n: number) => void
    emptyState?: React.ReactNode
    showUser?: boolean
    /** Whether selection mode is active */
    selectionMode?: boolean
    /** Set of selected image IDs */
    selectedIds?: Set<string>
    /** Called when an image's selection state changes */
    onSelectionChange?: (id: string, selected: boolean) => void
}

// Animation variants for staggered entrance
const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24,
        },
    },
}

// Sparkle animation - gentle floating + scale pulse
const sparkleVariants: Variants = {
    animate: {
        rotate: [0, 8, -8, 0],
        scale: [1, 1.15, 1],
        transition: {
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
}

export function PaginatedImageGrid({
    images,
    status,
    loadMore,
    emptyState,
    showUser = true,
    selectionMode = false,
    selectedIds = new Set(),
    onSelectionChange,
}: PaginatedImageGridProps) {
    const [selectedImage, setSelectedImage] = useState<ImageCardData | null>(null)
    
    // Ref for the infinite scroll sentinel element
    const sentinelRef = useRef<HTMLDivElement>(null)

    const handleSelectImage = useCallback((image: ImageCardData) => {
        setSelectedImage(image)
    }, [])

    const handleCloseLightbox = useCallback(() => {
        setSelectedImage(null)
    }, [])
    const [isLaunching, setIsLaunching] = useState(false)

    // Scroll to top with a delay for the launch animation
    const handleLaunch = () => {
        if (isLaunching) return
        setIsLaunching(true)

        // Wait for the arrow to launch before scrolling
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" })
            // Reset state after scrolling completes (approximate)
            setTimeout(() => setIsLaunching(false), 1000)
        }, 400)
    }

    const isLoadingFirst = status === "LoadingFirstPage"
    const isLoadingMore = status === "LoadingMore"
    const canLoadMore = status === "CanLoadMore"
    const isExhausted = status === "Exhausted"

    // Infinite scroll: automatically load more when sentinel becomes visible
    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel || !canLoadMore || isLoadingMore) {
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry?.isIntersecting && canLoadMore && !isLoadingMore) {
                    loadMore(20)
                }
            },
            {
                // Use document viewport as root
                root: null,
                // Trigger when the sentinel is 400px from being visible
                rootMargin: "0px 0px 400px 0px",
                threshold: 0,
            }
        )

        observer.observe(sentinel)

        return () => {
            observer.disconnect()
        }
    }, [canLoadMore, isLoadingMore, loadMore])

    if (isLoadingFirst) {
        return (
            <div className="px-1 md:px-2 max-w-[2400px] mx-auto">
                <MasonryGrid minColumnWidth={260} gap={4}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="rounded-lg animate-pulse bg-muted"
                            style={{
                                // Random aspect ratios for skeleton loading
                                aspectRatio: [1, 0.75, 1.33, 0.56, 1.78][i % 5],
                            }}
                        />
                    ))}
                </MasonryGrid>
            </div>
        )
    }

    // FIXED: Only show empty state when we're done loading AND no results
    // Previously this showed immediately if images.length === 0
    if (isExhausted && images.length === 0 && emptyState) {
        return <>{emptyState}</>
    }

    return (
        <div className="space-y-12 px-1 md:px-2 max-w-[2400px] mx-auto">
            <MasonryGrid
                minColumnWidth={360}
                gap={4}
            >
                {images.map((image) => (
                    <ImageCard
                        key={image._id}
                        image={image}
                        showUser={showUser}
                        onSelect={handleSelectImage}
                        selectionMode={selectionMode}
                        isSelected={selectedIds.has(image._id)}
                        onSelectionChange={onSelectionChange}
                    />
                ))}
            </MasonryGrid>

            {/* Infinite scroll sentinel - triggers loadMore when visible */}
            {(canLoadMore || isLoadingMore) && (
                <div
                    ref={sentinelRef}
                    className="flex justify-center items-center py-12"
                    data-testid="infinite-scroll-sentinel"
                >
                    {isLoadingMore && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm font-medium">Discovering more...</span>
                        </div>
                    )}
                </div>
            )}

            {isExhausted && images.length > 0 && (
                <motion.div
                    className="flex flex-col items-center gap-4 pb-16 pt-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Sparkles + message */}
                    <motion.div
                        className="flex items-center gap-2 text-muted-foreground mb-4"
                        variants={itemVariants}
                    >
                        <motion.div variants={sparkleVariants} animate="animate" className="text-primary">
                            <Sparkles className="h-5 w-5 fill-primary/10" />
                        </motion.div>
                        <span className="text-lg font-medium">You&apos;ve seen it all!</span>
                    </motion.div>

                    {/* Animated button - The Launchpad */}
                    <motion.div variants={itemVariants} className="z-10">
                        <motion.button
                            onClick={handleLaunch}
                            disabled={isLaunching}
                            whileHover={{ y: -4 }}
                            whileTap={{ y: 0 }}
                            className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden cursor-pointer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <span className="font-semibold text-lg tracking-tight">Take me back up</span>
                            <div className="relative flex items-center justify-center w-6 h-6">
                                <motion.div
                                    animate={isLaunching ? { y: -50, opacity: 0 } : { y: 0, opacity: 1 }}
                                    transition={{ duration: 0.4, ease: "backIn" }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <ArrowUp className="w-6 h-6 stroke-[3px] group-hover:-translate-y-1 transition-transform duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)" />
                                </motion.div>
                                {/* Trail effect or secondary arrow could go here if we wanted extra flair, but keeping it clean for now */}
                            </div>
                            
                            {/* Subtle shine effect on hover */}
                            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                            </div>
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}

            <ImageLightbox
                image={selectedImage}
                isOpen={!!selectedImage}
                onClose={handleCloseLightbox}
            />
        </div>
    )
}
