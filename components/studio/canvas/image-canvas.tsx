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
const QUEUE_SHIFT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"
const QUEUE_SHIFT_DURATION_MS = 220
const QUEUE_CARD_MIN_WIDTH_PX = 156
const QUEUE_CARD_MAX_WIDTH_PX = 188
const QUEUE_GRID_GAP_PX = 20

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
 * QueueCardGrid - Memoized grid view of active single generations.
 *
 * Wrapped in React.memo so that unrelated state changes in ImageCanvas
 * (e.g. imageLoaded, imageError) don't cascade into this subtree.
 * Each card shows an aspect-ratio frame, a spinner, a status label,
 * and a per-card Stop button.
 */
const QueueCardGrid = React.memo(function QueueCardGrid({
    items,
    onCancel,
}: {
    items: QueueItem[]
    onCancel?: (id: string) => void
}) {
    if (items.length === 0) return null

    const cardRefs = React.useRef(new Map<string, HTMLDivElement>())
    const previousRectsRef = React.useRef(new Map<string, DOMRect>())
    const scrollRegionRef = React.useRef<HTMLDivElement>(null)
    const [gridMetrics, setGridMetrics] = React.useState({
        columnCount: 1,
        cardWidth: QUEUE_CARD_MAX_WIDTH_PX,
    })

    React.useLayoutEffect(() => {
        const node = scrollRegionRef.current
        if (!node) return

        const updateGridMetrics = () => {
            const regionWidth = node.clientWidth - 24
            if (regionWidth <= 0) return

            const maxColumns = Math.max(
                1,
                Math.min(
                    items.length,
                    Math.floor((regionWidth + QUEUE_GRID_GAP_PX) / (QUEUE_CARD_MIN_WIDTH_PX + QUEUE_GRID_GAP_PX))
                )
            )

            const columnCount = Math.max(1, maxColumns)
            const availableWidth = regionWidth - QUEUE_GRID_GAP_PX * (columnCount - 1)
            const cardWidth = Math.max(
                QUEUE_CARD_MIN_WIDTH_PX,
                Math.min(QUEUE_CARD_MAX_WIDTH_PX, Math.floor(availableWidth / columnCount))
            )

            setGridMetrics((current) => {
                if (current.columnCount === columnCount && current.cardWidth === cardWidth) {
                    return current
                }
                return { columnCount, cardWidth }
            })
        }

        updateGridMetrics()

        const observer = new ResizeObserver(() => {
            updateGridMetrics()
        })
        observer.observe(node)

        return () => observer.disconnect()
    }, [items.length])

    React.useLayoutEffect(() => {
        const nextRects = new Map<string, DOMRect>()

        for (const item of items) {
            const node = cardRefs.current.get(item.id)
            if (!node) continue
            nextRects.set(item.id, node.getBoundingClientRect())
        }

        for (const item of items) {
            const node = cardRefs.current.get(item.id)
            const previousRect = previousRectsRef.current.get(item.id)
            const nextRect = nextRects.get(item.id)

            if (!node || !previousRect || !nextRect) continue

            const deltaX = previousRect.left - nextRect.left
            const deltaY = previousRect.top - nextRect.top

            if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
                continue
            }

            node.animate(
                [
                    { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
                    { transform: "translate3d(0, 0, 0)" },
                ],
                {
                    duration: QUEUE_SHIFT_DURATION_MS,
                    easing: QUEUE_SHIFT_EASING,
                }
            )
        }

        previousRectsRef.current = nextRects
    }, [items])

    return (
        <div
            className="absolute inset-0 z-20 p-3 md:p-5"
            data-testid="queue-card-grid"
        >
            <div
                ref={scrollRegionRef}
                className="relative h-full w-full overflow-auto overscroll-contain rounded-[1.75rem] border border-white/6 bg-background/[0.08] px-3 py-6 backdrop-blur-[2px] [scrollbar-gutter:stable] [scrollbar-width:thin]"
                data-testid="queue-card-scroll-region"
                style={{
                    maskImage:
                        "linear-gradient(to bottom, transparent 0, black 2.75rem, black calc(100% - 2.75rem), transparent 100%)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, transparent 0, black 2.75rem, black calc(100% - 2.75rem), transparent 100%)",
                }}
            >
                <div className="pointer-events-none sticky top-0 z-10 -mt-6 h-8 bg-gradient-to-b from-background/75 via-background/35 to-transparent" />
                <div
                    className="grid min-h-full auto-rows-max justify-center gap-4 pb-6 pt-1 md:gap-5"
                    style={{
                        gap: `${QUEUE_GRID_GAP_PX}px`,
                        gridTemplateColumns: `repeat(${gridMetrics.columnCount}, minmax(0, ${gridMetrics.cardWidth}px))`,
                    }}
                >
                    {items.map((item) => (
                        <QueueCard
                            key={item.id}
                            item={item}
                            onCancel={onCancel}
                            cardWidth={gridMetrics.cardWidth}
                            registerCard={(node) => {
                                if (node) {
                                    cardRefs.current.set(item.id, node)
                                } else {
                                    cardRefs.current.delete(item.id)
                                    previousRectsRef.current.delete(item.id)
                                }
                            }}
                        />
                    ))}
                </div>
                <div className="pointer-events-none sticky bottom-0 z-10 -mb-6 h-8 bg-gradient-to-t from-background/75 via-background/35 to-transparent" />
            </div>
        </div>
    )
})

/** Ticks every second, returning elapsed seconds since `startMs`. */
function useElapsedSeconds(startMs: number): number {
    const [elapsed, setElapsed] = React.useState(() =>
        Math.floor((Date.now() - startMs) / 1000)
    )

    React.useEffect(() => {
        // Sync immediately in case component mounted between ticks
        setElapsed(Math.floor((Date.now() - startMs) / 1000))

        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startMs) / 1000))
        }, 1_000)

        return () => clearInterval(id)
    }, [startMs])

    return Math.max(0, elapsed)
}

/**
 * ElapsedTimer — Isolated component that owns the per-second tick.
 *
 * By extracting the `useElapsedSeconds` hook into this leaf component,
 * the every-second state update only re-renders this tiny <span>,
 * NOT the entire QueueCard (which owns Framer Motion layout animations,
 * the stop button, gradient overlays, etc.).
 */
function ElapsedTimer({
    startMs,
    isProcessing,
}: {
    startMs: number
    isProcessing: boolean
}) {
    const elapsed = useElapsedSeconds(startMs)

    return (
        <span
            className={cn(
                "text-[10px] font-mono tabular-nums leading-none",
                isProcessing ? "text-primary/70" : "text-muted-foreground/50"
            )}
            aria-label={`${elapsed} seconds elapsed`}
        >
            {elapsed}s
        </span>
    )
}

/**
 * QueueCard — Memoized so it skips re-renders when the parent grid
 * re-renders due to items being added/removed (only the changed cards
 * re-render). The per-second timer is isolated in `ElapsedTimer`.
 */
const QueueCard = React.memo(function QueueCard({
    item,
    onCancel,
    cardWidth,
    registerCard,
}: {
    item: QueueItem
    onCancel?: (id: string) => void
    cardWidth: number
    registerCard: (node: HTMLDivElement | null) => void
}) {
    const isProcessing = item.status === "processing"
    const statusLabel = isProcessing ? "Generating" : "Queued"

    const raw = item.aspectRatio
    const aspectRatio = Number.isFinite(raw) && raw > 0 ? raw : 1
    const displayAspectRatio = Math.min(1.28, Math.max(0.74, aspectRatio))
    const isTall = aspectRatio < 1

    return (
        <div
            ref={registerCard}
            className="pointer-events-none flex w-full items-start justify-center animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
        >
            <div
                className={cn(
                    "relative overflow-hidden rounded-[1.4rem] border shadow-lg pointer-events-auto transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out transform-gpu will-change-transform",
                    "bg-background/80 backdrop-blur-xl",
                    isProcessing
                        ? "border-primary/40 ring-2 ring-primary/20 shadow-[0_12px_30px_-16px_hsl(var(--primary)/0.6)]"
                        : "border-white/10 shadow-black/40"
                )}
                style={{
                    aspectRatio: displayAspectRatio,
                    width: "100%",
                    maxWidth: isTall
                        ? `${Math.min(cardWidth, QUEUE_CARD_MIN_WIDTH_PX)}px`
                        : `${cardWidth}px`,
                }}
                data-testid="queue-card"
            >
                <div
                    className={cn(
                        "absolute inset-0",
                        isProcessing
                            ? "bg-[radial-gradient(circle_at_50%_100%,hsl(var(--primary)/0.22),transparent_58%),linear-gradient(180deg,hsl(var(--background)/0.9),hsl(var(--background)/0.76))]"
                            : "bg-[linear-gradient(180deg,hsl(var(--background)/0.92),hsl(var(--background)/0.8))]"
                    )}
                />
                <div className="absolute inset-x-[9%] top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="absolute inset-y-[10%] left-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />
                <div className="absolute inset-y-[10%] right-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 pb-4 pt-5">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <div
                            className={cn(
                                "absolute inset-[3px] rounded-full border border-white/5",
                                isProcessing && "shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]"
                            )}
                        />
                        <Loader2
                            className={cn(
                                "h-4 w-4 animate-spin",
                                isProcessing ? "text-primary" : "text-muted-foreground/60"
                            )}
                        />
                    </div>
                    <ElapsedTimer startMs={item.createdAt} isProcessing={isProcessing} />
                    <span
                        className={cn(
                            "text-[11px] font-medium leading-tight text-center tracking-[0.02em]",
                            isProcessing ? "text-primary/95" : "text-muted-foreground/78"
                        )}
                    >
                        {statusLabel}
                    </span>
                </div>

                {onCancel && (
                    <button
                        type="button"
                        onClick={() => onCancel(item.id)}
                        className={cn(
                            "absolute right-2 top-2 z-10 pointer-events-auto flex items-center justify-center rounded-full border p-1.5",
                            "bg-background/72 backdrop-blur-sm text-muted-foreground shadow-[0_6px_18px_-12px_rgba(0,0,0,0.75)]",
                            "border-white/10 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive",
                            "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
                        )}
                        aria-label={`Stop generation ${item.labelIndex}`}
                        data-testid="queue-card-stop"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    )
})

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

                                        {queueItems.length <= 1 && typeof progress === "number" && (
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
