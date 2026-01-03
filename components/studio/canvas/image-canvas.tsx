"use client"

/**
 * ImageCanvas - Main image display area with premium "Creation Nexus" animations
 */

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { GeneratedImage } from "@/types/pollinations"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { ImagePlus, Loader2, Sparkles } from "lucide-react"
import * as React from "react"

// --- Animation Constants ---

const SPRING_CONFIG = { type: "spring", stiffness: 300, damping: 30, mass: 1 } as const

const nexusContainerVariants: Variants = {
    empty: {
        scale: 1,
        transition: SPRING_CONFIG,
    },
    generating: {
        scale: 0.95,
        transition: SPRING_CONFIG,
    },
}

// Holographic expansion rings
const echoVariants: Variants = {
    animate: (i: number) => ({
        scale: [1, 2],
        opacity: [0.3, 0],
        transition: {
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeOut",
        },
    }),
}

// Drifting atmospheric nebula
const nebulaVariants: Variants = {
    animate: (i: number) => ({
        x: [0, i % 2 === 0 ? 40 : -40, 0],
        y: [0, i % 2 === 0 ? -30 : 30, 0],
        opacity: [0.1, 0.3, 0.1],
        transition: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
        },
    }),
}

const hubVariants: Variants = {
    empty: {
        scale: 1,
        borderRadius: "20px",
        backgroundColor: "rgba(var(--primary-rgb), 0.03)",
        borderColor: "rgba(var(--primary-rgb), 0.4)",
    },
    generating: {
        scale: 0.8,
        borderRadius: "999px",
        backgroundColor: "rgba(var(--primary-rgb), 0.1)",
        borderColor: "rgba(var(--primary-rgb), 0.4)",
    },
}

// Symmetrical light ray variants
const lightRayVariants: Variants = {
    initial: { opacity: 0, scale: 0 },
    animate: (i: number) => ({
        opacity: [0, 0.8, 0],
        scale: [0.5, 1.2, 0.5],
        rotate: [0, 180, 360],
        transition: {
            duration: 3,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
        },
    }),
}

// Text entrance
const textVariants: Variants = {
    initial: { opacity: 0, y: 12, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -12, filter: "blur(4px)" },
}

export interface ImageCanvasProps {
    image: GeneratedImage | null
    isGenerating?: boolean
    progress?: number
    onImageClick?: () => void
    children?: React.ReactNode
    className?: string
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
        <Card
            className={cn(
                "relative overflow-hidden flex flex-col h-full max-h-full transition-colors duration-700",
                "border-border/40",
                className
            )}
            style={{
                backgroundColor: "var(--canvas-bg)",
                backgroundImage: "radial-gradient(circle at center, var(--canvas-dot) 0.75px, transparent 0.75px)",
                backgroundSize: "14px 14px",
            }}
            data-testid="image-canvas"
        >
            <div
                className="relative w-full flex-1 flex items-center justify-center min-h-[400px]"
                data-testid="canvas-container"
            >
                {/* Atmospheric Nebulas (Only active during generation) */}
                <AnimatePresence>
                    {isGenerating && (
                        <>
                            {[0, 1].map((i) => (
                                <motion.div
                                    key={`nebula-${i}`}
                                    custom={i}
                                    variants={nebulaVariants}
                                    animate="animate"
                                    className={cn(
                                        "absolute w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none",
                                        i === 0 ? "bg-primary/20 -top-20 -left-20" : "bg-accent/20 -bottom-20 -right-20"
                                    )}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="popLayout">
                    {showPlaceholder ? (
                        <motion.div
                            key="placeholder"
                            className="flex flex-col items-center justify-center gap-12 z-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* The Creation Nexus - fixed size wrapper prevents layout shift */}
                            <div className="relative group w-[100px] h-[100px] flex items-center justify-center">
                                {/* Holographic Echo Rings */}
                                <AnimatePresence>
                                    {isGenerating && (
                                        <>
                                            {[0, 1].map((i) => (
                                                <motion.div
                                                    key={`echo-${i}`}
                                                    custom={i}
                                                    variants={echoVariants}
                                                    animate="animate"
                                                    className="absolute inset-0 rounded-full border border-primary/30"
                                                />
                                            ))}
                                            {/* Corner Brackets */}
                                            <div className="absolute -inset-8 pointer-events-none opacity-40">
                                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50 rounded-tl-sm animate-pulse" />
                                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50 rounded-tr-sm animate-pulse" />
                                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50 rounded-bl-sm animate-pulse" />
                                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50 rounded-br-sm animate-pulse" />
                                            </div>
                                        </>
                                    )}
                                </AnimatePresence>

                                {/* The Central Hub */}
                                <motion.div
                                    layoutId="central-hub"
                                    className="relative w-[100px] h-[100px] flex items-center justify-center overflow-hidden shadow-lg border border-foreground/10"
                                    variants={hubVariants}
                                    initial={false}
                                    animate={isGenerating ? "generating" : "empty"}
                                    transition={SPRING_CONFIG}
                                >
                                    <AnimatePresence mode="wait">
                                        {!isGenerating ? (
                                            <motion.div
                                                key="icon-plus"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 1.2 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ImagePlus className="h-10 w-10 text-primary transition-colors " />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="icon-sparkles"
                                                initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Sparkles className="h-8 w-8 text-primary drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.6)]" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Scanning Beam */}
                                    {isGenerating && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-t from-transparent via-primary/10 to-transparent h-1/2 w-full"
                                            animate={{ top: ["-100%", "200%"] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        />
                                    )}
                                </motion.div>
                            </div>

                            {/* Status Area - fixed height prevents layout shift */}
                            <div className="relative flex flex-col items-center justify-center w-72 h-24">
                                <AnimatePresence mode="popLayout">
                                    {!isGenerating ? (
                                        <motion.div
                                            key="empty-text"
                                            variants={textVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="text-center absolute inset-0 flex flex-col items-center justify-center"
                                        >
                                            <h3 className="text-xl font-medium tracking-tight bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
                                                Create something amazing
                                            </h3>
                                            {/* Powered by Pollinations attribution */}
                                            <a
                                                href="https://pollinations.ai"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity"
                                            >
                                                <span className="text-sm text-muted-foreground font-light">Powered by</span>
                                                <img
                                                    src="/branding/pollinations/logo-white.svg"
                                                    alt="Pollinations"
                                                    className="h-5 invert dark:invert-0"
                                                />
                                            </a>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="gen-text"
                                            variants={textVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="text-center absolute inset-0 flex flex-col items-center justify-center w-full"
                                        >
                                            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-primary/80 mb-4 animate-pulse">
                                                Generating Vision
                                            </h3>
                                            {typeof progress === "number" && (
                                                <div className="space-y-3 w-full">
                                                    <div className="relative h-1 w-full bg-primary/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="absolute inset-y-0 left-0 bg-primary"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            transition={{ duration: 0.5 }}
                                                        />
                                                        {/* Scanning glare over progress bar */}
                                                        <motion.div
                                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                                            animate={{ x: ["-100%", "200%"] }}
                                                            transition={{ duration: 1, repeat: Infinity }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-50">Frame Sync</span>
                                                        <span className="text-[10px] font-mono text-primary font-bold">{Math.round(progress)}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="image"
                            className="relative w-full h-full flex items-center justify-center p-6"
                            initial={{ opacity: 0, scale: 1.02 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                        >
                            {/* Wrapper for hover detection and positioning context - NO overflow hidden here */}
                            <div className="relative group w-fit">
                                <div
                                    className={cn(
                                        "relative rounded-2xl overflow-hidden border border-white/5 transition-all duration-500",
                                        onImageClick && "cursor-pointer"
                                    )}
                                    onClick={onImageClick}
                                >
                                    <img
                                        src={image.url}
                                        alt={image.prompt}
                                        className={cn(
                                            "max-w-full max-h-[80vh] w-auto h-auto object-contain transition-all duration-700",
                                            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-98 blur-lg"
                                        )}
                                        onLoad={handleImageLoad}
                                        onError={() => setImageError(true)}
                                    />

                                    <AnimatePresence>
                                        {!imageLoaded && (
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
                            </div>


                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    )
})

