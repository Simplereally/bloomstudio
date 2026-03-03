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
import { ImagePlus, Loader2, X } from "lucide-react"
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

// --- Queue Item Type ---

export interface QueueItem {
    id: string
    status: "pending" | "processing"
    createdAt: number
    aspectRatio: number
    labelIndex: number
}

// --- Component ---

export interface ImageCanvasProps {
    image: GeneratedImage | null
    isGenerating?: boolean
    /** Structured queue items for per-generation cards */
    queueItems?: QueueItem[]
    /** Callback to cancel a specific generation by ID */
    onCancelItem?: (id: string) => void

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

/**
 * QueueCardGrid - Per-item grid/tray of active single generations.
 *
 * Each card shows an aspect-ratio frame, a spinner, a status label,
 * and a per-card Stop button. Cards are laid out in a flex-wrap grid
 * anchored to the bottom of the canvas — never stacked on top of each other.
 */
function QueueCardGrid({
    items,
    onCancel,
}: {
    items: QueueItem[]
    onCancel?: (id: string) => void
}) {
    if (items.length === 0) return null

    return (
        <div
            className="absolute inset-x-4 bottom-4 z-20 pointer-events-none"
            data-testid="queue-card-grid"
        >
            <div className="mx-auto max-w-[800px] max-h-[50%] overflow-y-auto">
                <div className="flex flex-wrap items-end justify-center gap-2.5">
                    {items.map((item) => (
                        <QueueCard
                            key={item.id}
                            item={item}
                            onCancel={onCancel}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

function QueueCard({
    item,
    onCancel,
}: {
    item: QueueItem
    onCancel?: (id: string) => void
}) {
    const isProcessing = item.status === "processing"
    const statusLabel = isProcessing ? "Generating" : "Queued"

    // Size cards relative to count — keep them compact but legible
    const targetWidthPx = 140
    const heightPx = Math.round(targetWidthPx / Math.max(0.4, item.aspectRatio))
    const clampedHeightPx = Math.max(64, Math.min(180, heightPx))

    return (
        <div
            className={cn(
                "relative rounded-xl border shadow-sm overflow-hidden pointer-events-auto",
                "bg-background/60 backdrop-blur-md",
                isProcessing
                    ? "border-primary/30 ring-1 ring-primary/10"
                    : "border-primary/15"
            )}
            style={{
                height: clampedHeightPx,
                aspectRatio: item.aspectRatio,
            }}
            data-testid="queue-card"
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />

            {/* Content: spinner + label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2">
                <Loader2
                    className={cn(
                        "h-5 w-5 animate-spin",
                        isProcessing ? "text-primary" : "text-muted-foreground/60"
                    )}
                />
                <span
                    className={cn(
                        "text-[10px] font-medium leading-tight text-center",
                        isProcessing ? "text-primary/90" : "text-muted-foreground/70"
                    )}
                >
                    {statusLabel}
                </span>
            </div>

            {/* Per-card Stop button — top-right corner */}
            {onCancel && (
                <button
                    type="button"
                    onClick={() => onCancel(item.id)}
                    className={cn(
                        "absolute top-1 right-1 z-10 pointer-events-auto",
                        "flex items-center justify-center",
                        "h-5 w-5 rounded-full",
                        "bg-background/80 backdrop-blur-sm border border-white/10",
                        "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                        "transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
                    )}
                    aria-label={`Stop generation ${item.labelIndex}`}
                    data-testid="queue-card-stop"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    )
}

export const ImageCanvas = React.memo(function ImageCanvas({
    image,
    isGenerating = false,
    queueItems = [],
    onCancelItem,

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

            {queueItems.length > 0 && (
                <QueueCardGrid
                    items={queueItems}
                    onCancel={onCancelItem}
                />
            )}
        </div>
    )
})
