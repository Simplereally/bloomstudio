"use client"

import { ImageLightbox } from "@/components/images/image-lightbox"
import { Button } from "@/components/ui/button"
import { ImageCard, type ImageCardData } from "@/components/ui/image-card"
import { MasonryGrid } from "@/components/ui/masonry-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, type Variants } from "framer-motion"
import { ArrowUp, Loader2, Sparkles } from "lucide-react"
import React, { useState } from "react"

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
    const [buttonState, setButtonState] = useState<"idle" | "hovered" | "launching">("idle")

    const handleSelectImage = React.useCallback((image: ImageCardData) => {
        setSelectedImage(image)
    }, [])

    const handleCloseLightbox = React.useCallback(() => {
        setSelectedImage(null)
    }, [])

    const handleHoverStart = () => {
        if (buttonState === "idle") setButtonState("hovered")
    }

    const handleHoverEnd = () => {
        if (buttonState === "hovered") setButtonState("idle")
    }

    const handleLaunch = () => {
        if (buttonState !== "hovered") return
        setButtonState("launching")

        // Wait for the arrow to shoot up, then scroll
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" })
            // Reset state after scrolling
            setTimeout(() => setButtonState("idle"), 500)
        }, 300)
    }

    const isLoadingFirst = status === "LoadingFirstPage"
    const isLoadingMore = status === "LoadingMore"
    const canLoadMore = status === "CanLoadMore"
    const isExhausted = status === "Exhausted"

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

            {/* Show load more when we can or are loading more */}
            {(canLoadMore || isLoadingMore) && (
                <div className="flex justify-center pb-12">
                    <Button
                        variant="outline"
                        onClick={() => loadMore(20)}
                        disabled={isLoadingMore}
                        className="rounded-full px-12 h-12 text-base font-medium border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                Discovering...
                            </>
                        ) : (
                            "Explore More"
                        )}
                    </Button>
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
                        className="flex items-center gap-2 text-muted-foreground"
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
                            layout
                            onHoverStart={handleHoverStart}
                            onHoverEnd={handleHoverEnd}
                            onClick={handleLaunch}
                            disabled={buttonState === "launching"}
                            className="relative flex items-center justify-center bg-primary text-primary-foreground font-medium shadow-xl cursor-pointer"
                            initial={false}
                            animate={{
                                width: buttonState === "idle" ? "auto" : 56,
                                height: 56,
                                borderRadius: 9999,
                                opacity: 1,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                            }}
                        >
                            <motion.div
                                className="flex items-center justify-center px-6 relative"
                            >
                                <motion.div
                                    animate={
                                        buttonState === "launching"
                                            ? {
                                                y: -2000,
                                                x: 0,
                                                scaleY: 2,
                                                opacity: 0,
                                                transition: {
                                                    y: { duration: 0.4, ease: "easeIn" },
                                                    opacity: { duration: 0.3, ease: "easeOut" }
                                                }
                                            }
                                            : buttonState === "hovered"
                                                ? {
                                                    y: 6,
                                                    scale: 0.9,
                                                    opacity: 1,
                                                    x: [0, -3, 3, -2, 2, -3, 3, 0],
                                                    transition: {
                                                        y: { type: "spring", stiffness: 400 },
                                                        scale: { type: "spring", stiffness: 400 },
                                                        x: {
                                                            duration: 0.15,
                                                            repeat: Infinity,
                                                            ease: "linear"
                                                        }
                                                    }
                                                }
                                                : {
                                                    y: 0,
                                                    x: 0,
                                                    scale: 1,
                                                    opacity: 1
                                                }
                                    }
                                >
                                    <ArrowUp className="h-7 w-7 stroke-[3px]" />
                                </motion.div>

                                <motion.div
                                    className="overflow-hidden whitespace-nowrap"
                                    initial={{ width: "auto", opacity: 1 }}
                                    animate={
                                        buttonState !== "idle"
                                            ? { width: 0, opacity: 0, marginLeft: 0 }
                                            : { width: "auto", opacity: 1, marginLeft: 8 }
                                    }
                                    transition={{ duration: 0.2 }}
                                >
                                    <span>Take me back up!</span>
                                </motion.div>
                            </motion.div>
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
