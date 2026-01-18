"use client"

/**
 * ImageCanvas - Main image display area with premium "Luminous Tide" animations
 * 
 * Design Philosophy: The idle → generating transition represents a liminal moment —
 * potential energy becoming kinetic. The canvas dots represent dormant coordinates
 * that awaken with luminous waves as generation begins.
 * 
 * Key Animation: The LuminousTideEffect creates sweeping conic gradients that
 * wash across the dot grid, causing it to appear as if the canvas itself is
 * coming alive with anticipation.
 */

import { isVideoContent, MediaPlayer } from "@/components/ui/media-player"
import { cn } from "@/lib/utils"
import type { GeneratedImage } from "@/types/pollinations"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { ImagePlus, Loader2 } from "lucide-react"
import NextImage from "next/image"
import * as React from "react"
import { CanvasWave } from "./canvas-wave"

// --- Animation Configuration ---

// Premium easing: Expo out for satisfying deceleration
const EXPO_OUT = [0.22, 1, 0.36, 1] as const

// --- Animation Variants ---

const containerVariants: Variants = {
    initial: { opacity: 0 },
    idle: {
        opacity: 1,
        transition: { duration: 0.5, ease: EXPO_OUT }
    },
    generating: {
        opacity: 1,
        transition: { duration: 0.4, ease: EXPO_OUT }
    },
}

// --- Component ---

export interface ImageCanvasProps {
    image: GeneratedImage | null
    isGenerating?: boolean
    progress?: number
    onImageClick?: () => void
    children?: React.ReactNode
    className?: string
}

// Refined capillary progress bar - liquid-like precision
function CapillaryProgress({ progress }: { progress: number }) {
    return (
        <div className="w-56 space-y-3">
            {/* Progress track */}
            <div className="relative h-0.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                {/* Fill */}
                <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: EXPO_OUT }}
                />
                {/* Meniscus highlight at leading edge */}
                <motion.div
                    className="absolute inset-y-0 w-6 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
                    style={{ left: `calc(${Math.max(0, progress - 3)}%)` }}
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                />
            </div>

            {/* Percentage */}
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-[0.15em]">
                    Progress
                </span>
                <span className="text-[10px] font-mono text-primary/90 tabular-nums font-medium">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    )
}



export const ImageCanvas = React.memo(function ImageCanvas({
    image,
    isGenerating = false,
    progress,
    onImageClick,
    children,
    className,
}: ImageCanvasProps) {
    const [imageLoaded, setImageLoaded] = React.useState(false)
    const [imageError, setImageError] = React.useState(false)

    React.useEffect(() => {
        setImageLoaded(false)
        setImageError(false)
    }, [image?.url])

    const handleImageLoad = React.useCallback(() => {
        setImageLoaded(true)
    }, [])

    const showPlaceholder = !image || isGenerating

    return (
        <div
            className={cn(
                "relative overflow-hidden flex flex-col h-full max-h-full rounded-xl border border-white/5 transition-colors duration-700",
                className
            )}
            style={{
                backgroundColor: "var(--canvas-bg)",
                // background-image handled by CanvasWave now
            }}
            data-testid="image-canvas"
        >
            {/* === CANVASPUNK WAVE ENGINE === */}
            {/* High-fidelity 3D dot simulation */}
            <div className="absolute inset-0 z-0">
                <CanvasWave isActive={isGenerating} className="w-full h-full" />
            </div>

            <div
                className="relative w-full flex-1 min-h-0 overflow-hidden z-10"
                data-testid="canvas-container"
            >
                <AnimatePresence mode="popLayout">
                    {showPlaceholder ? (
                        <motion.div
                            key="placeholder"
                            variants={containerVariants}
                            initial="initial"
                            animate={isGenerating ? "generating" : "idle"}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                            transition={{ duration: 0.4 }}
                        >
                            <AnimatePresence mode="popLayout">
                                {!isGenerating ? (
                                    <motion.div
                                        key="idle-content"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                                        transition={{ duration: 0.4, ease: EXPO_OUT }}
                                        className="flex flex-col items-center justify-center gap-6"
                                    >
                                        <div className={cn(
                                            "w-20 h-20 flex items-center justify-center rounded-3xl",
                                            "bg-foreground/[0.02] backdrop-blur-sm border border-white/5",
                                            "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]"
                                        )}>
                                            <ImagePlus data-testid="empty-state-icon" className="h-8 w-8 text-foreground/20" strokeWidth={1.5} />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="generating-content"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }}
                                        transition={{ duration: 0.4 }}
                                        className="flex flex-col items-center justify-center gap-6"
                                    >

                                        {typeof progress === "number" && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2, duration: 0.4, ease: EXPO_OUT }}
                                                className="w-full flex justify-center"
                                            >
                                                <CapillaryProgress progress={progress} />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="image"
                            className="absolute inset-0 group"
                            initial={{ opacity: 0, scale: 1.02 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: EXPO_OUT }}
                        >
                            <div
                                className={cn(
                                    "relative w-full h-full rounded-2xl overflow-hidden border border-white/5 transition-all duration-500",
                                    onImageClick && !isVideoContent(image.contentType, image.url) && "cursor-pointer"
                                )}
                                onClick={isVideoContent(image.contentType, image.url) ? undefined : onImageClick}
                            >
                                <MediaPlayer
                                    url={image.url}
                                    alt={image.prompt}
                                    contentType={image.contentType}
                                    controls={isVideoContent(image.contentType, image.url)}
                                    autoPlay={false}
                                    loop={false}
                                    muted={true}
                                    className={cn(
                                        "w-full h-full transition-all duration-700",
                                        imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-98 blur-lg"
                                    )}
                                    onLoad={handleImageLoad}
                                    onError={() => setImageError(true)}
                                />

                                <AnimatePresence>
                                    {!imageLoaded && !isVideoContent(image.contentType, image.url) && (
                                        <div className="absolute inset-0 bg-background/20 backdrop-blur-md flex items-center justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                            </div>
                                        </div>
                                    )}
                                </AnimatePresence>

                                {imageError && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-md">
                                        <p className="text-sm font-medium text-destructive">Sync Error</p>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </div>
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
})
