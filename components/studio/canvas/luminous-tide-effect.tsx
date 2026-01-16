"use client"

/**
 * LuminousTideEffect - Premium canvas awakening animation
 * 
 * Creates a mesmerizing wave that sweeps across the dot grid canvas,
 * causing dots to illuminate as if touched by light. The effect uses
 * multiple layered gradients with different speeds and blend modes
 * to create depth and organic movement.
 * 
 * Design Philosophy:
 * - The canvas dots represent potential - dormant coordinates awaiting data
 * - The wave represents attention/computation flowing through the grid
 * - Multiple waves at different speeds create natural, non-mechanical rhythm
 * - The effect should feel like aurora borealis meeting radar sweep
 */

import { cn } from "@/lib/utils"
import { motion, type Variants } from "framer-motion"
import * as React from "react"

// Premium easing curves
const EXPO_OUT = [0.22, 1, 0.36, 1] as const

// Container fade in
const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: { 
        opacity: 1,
        transition: { duration: 0.8, ease: EXPO_OUT }
    },
    exit: { 
        opacity: 0,
        transition: { duration: 0.5, ease: EXPO_OUT }
    }
}

// Individual wave layer variants
const waveLayerVariants: Variants = {
    initial: { opacity: 0, scale: 0.85 },
    animate: { 
        opacity: 1, 
        scale: 1,
        transition: { duration: 1.2, ease: EXPO_OUT }
    },
    exit: { 
        opacity: 0,
        scale: 1.05,
        transition: { duration: 0.4 }
    }
}

export interface LuminousTideEffectProps {
    /** Whether the effect is active */
    isActive?: boolean
    /** Optional progress (0-100) to influence wave behavior */
    progress?: number
    /** Additional className */
    className?: string
}

/**
 * Primary wave layer - the main sweeping conic gradient
 * Uses CSS animation for smooth, GPU-accelerated rotation
 */
function PrimaryWave() {
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none"
            variants={waveLayerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {/* Main conic sweep - the primary "radar" effect */}
            <div 
                className="absolute inset-0 animate-luminous-tide-primary"
                style={{
                    background: `conic-gradient(
                        from 0deg at 50% 50%,
                        transparent 0deg,
                        transparent 20deg,
                        hsl(25 95% 53% / 0.03) 50deg,
                        hsl(25 95% 53% / 0.1) 80deg,
                        hsl(25 95% 53% / 0.2) 110deg,
                        hsl(25 95% 53% / 0.1) 140deg,
                        hsl(25 95% 53% / 0.03) 170deg,
                        transparent 200deg,
                        transparent 360deg
                    )`,
                    mixBlendMode: "screen",
                }}
            />
            
            {/* Glow trail - softer, larger version that follows */}
            <div 
                className="absolute inset-[-50%] animate-luminous-tide-primary-glow"
                style={{
                    background: `conic-gradient(
                        from 0deg at 50% 50%,
                        transparent 0deg,
                        transparent 50deg,
                        hsl(25 95% 60% / 0.06) 90deg,
                        hsl(25 95% 60% / 0.12) 120deg,
                        hsl(25 95% 60% / 0.06) 150deg,
                        transparent 190deg,
                        transparent 360deg
                    )`,
                    filter: "blur(50px)",
                    mixBlendMode: "screen",
                }}
            />
        </motion.div>
    )
}

/**
 * Secondary wave layer - counter-rotating for depth
 * Slightly slower, different angle coverage
 */
function SecondaryWave() {
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none"
            variants={waveLayerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ delay: 0.15 }}
        >
            <div 
                className="absolute inset-0 animate-luminous-tide-secondary"
                style={{
                    background: `conic-gradient(
                        from 180deg at 50% 50%,
                        transparent 0deg,
                        transparent 30deg,
                        hsl(25 90% 55% / 0.02) 60deg,
                        hsl(25 90% 55% / 0.06) 90deg,
                        hsl(25 90% 55% / 0.02) 120deg,
                        transparent 150deg,
                        transparent 360deg
                    )`,
                    mixBlendMode: "overlay",
                }}
            />
        </motion.div>
    )
}

/**
 * Radial pulse layer - breathing pulse from center
 * Creates the "heartbeat" of the generation process
 */
function RadialPulse() {
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none"
            variants={waveLayerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ delay: 0.1 }}
        >
            <div 
                className="absolute inset-0 animate-luminous-pulse"
                style={{
                    background: `radial-gradient(
                        ellipse 70% 55% at 50% 50%,
                        hsl(25 95% 55% / 0.12) 0%,
                        hsl(25 95% 55% / 0.04) 35%,
                        transparent 65%
                    )`,
                    mixBlendMode: "screen",
                }}
            />
        </motion.div>
    )
}

/**
 * Grid highlight layer - enhances the dot grid itself
 * Creates the effect of dots being "awakened" as the wave passes
 */
function GridHighlight() {
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Animated dot grid overlay with brighter dots */}
            <div 
                className="absolute inset-0 animate-grid-shimmer"
                style={{
                    backgroundImage: `radial-gradient(
                        circle at center, 
                        hsl(25 95% 55% / 0.35) 1px, 
                        transparent 1px
                    )`,
                    backgroundSize: "14px 14px",
                    maskImage: `linear-gradient(
                        135deg,
                        transparent 0%,
                        black 35%,
                        black 65%,
                        transparent 100%
                    )`,
                    WebkitMaskImage: `linear-gradient(
                        135deg,
                        transparent 0%,
                        black 35%,
                        black 65%,
                        transparent 100%
                    )`,
                }}
            />
        </motion.div>
    )
}

/**
 * Scanline accent - subtle horizontal sweep for texture
 * Adds a hint of technological precision
 */
function ScanlineAccent() {
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
        >
            <div 
                className="absolute inset-0 animate-scanline"
                style={{
                    background: `linear-gradient(
                        to bottom,
                        transparent 0%,
                        transparent 47%,
                        hsl(25 95% 55% / 0.06) 48.5%,
                        hsl(25 95% 55% / 0.12) 50%,
                        hsl(25 95% 55% / 0.06) 51.5%,
                        transparent 53%,
                        transparent 100%
                    )`,
                }}
            />
        </motion.div>
    )
}

/**
 * Particle field - subtle floating particles that drift
 * Adds organic life to the mechanical grid
 */
function ParticleField() {
    // Generate stable particle positions
    const particles = React.useMemo(() => {
        return Array.from({ length: 6 }).map((_, i) => ({
            id: i,
            x: 20 + (i * 13) % 60,
            y: 25 + (i * 19) % 50,
            delay: i * 0.5,
            duration: 10 + (i % 3) * 3,
            size: 3 + (i % 2) * 2,
        }))
    }, [])

    return (
        <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        >
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                        background: "hsl(25 95% 55% / 0.25)",
                        boxShadow: "0 0 10px hsl(25 95% 55% / 0.4)",
                    }}
                    animate={{
                        y: [0, -25, 0],
                        x: [0, 8, 0],
                        opacity: [0.15, 0.45, 0.15],
                        scale: [0.7, 1.1, 0.7],
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </motion.div>
    )
}

/**
 * Edge vignette - darkens edges to focus attention on center
 */
function EdgeVignette() {
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
        >
            <div 
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(
                        ellipse 65% 55% at 50% 50%,
                        transparent 0%,
                        transparent 45%,
                        hsl(0 0% 0% / 0.12) 100%
                    )`,
                }}
            />
        </motion.div>
    )
}

/**
 * Corner accents - subtle geometric corner markers
 * Adds visual anchoring and premium feel
 */
function CornerAccents() {
    const cornerClasses = "absolute w-8 h-8 pointer-events-none"
    const lineClasses = "absolute bg-primary/20"
    
    return (
        <motion.div
            className="absolute inset-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            {/* Top-left corner */}
            <div className={cn(cornerClasses, "top-0 left-0")}>
                <motion.div 
                    className={cn(lineClasses, "top-0 left-0 h-px w-0")}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                />
                <motion.div 
                    className={cn(lineClasses, "top-0 left-0 w-px h-0")}
                    animate={{ height: "100%" }}
                    transition={{ duration: 0.4, delay: 0.45 }}
                />
            </div>
            
            {/* Top-right corner */}
            <div className={cn(cornerClasses, "top-0 right-0")}>
                <motion.div 
                    className={cn(lineClasses, "top-0 right-0 h-px w-0")}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                />
                <motion.div 
                    className={cn(lineClasses, "top-0 right-0 w-px h-0")}
                    animate={{ height: "100%" }}
                    transition={{ duration: 0.4, delay: 0.55 }}
                />
            </div>
            
            {/* Bottom-left corner */}
            <div className={cn(cornerClasses, "bottom-0 left-0")}>
                <motion.div 
                    className={cn(lineClasses, "bottom-0 left-0 h-px w-0")}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                />
                <motion.div 
                    className={cn(lineClasses, "bottom-0 left-0 w-px h-0")}
                    animate={{ height: "100%" }}
                    transition={{ duration: 0.4, delay: 0.65 }}
                />
            </div>
            
            {/* Bottom-right corner */}
            <div className={cn(cornerClasses, "bottom-0 right-0")}>
                <motion.div 
                    className={cn(lineClasses, "bottom-0 right-0 h-px w-0")}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                />
                <motion.div 
                    className={cn(lineClasses, "bottom-0 right-0 w-px h-0")}
                    animate={{ height: "100%" }}
                    transition={{ duration: 0.4, delay: 0.75 }}
                />
            </div>
        </motion.div>
    )
}

export const LuminousTideEffect = React.memo(function LuminousTideEffect({
    className,
}: LuminousTideEffectProps) {
    return (
        <motion.div
            className={cn(
                "absolute inset-0 overflow-hidden rounded-xl z-[1]",
                className
            )}
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {/* Layer 1: Edge vignette for focus */}
            <EdgeVignette />
            
            {/* Layer 2: Grid highlight - awakened dots */}
            <GridHighlight />
            
            {/* Layer 3: Radial pulse - central heartbeat */}
            <RadialPulse />
            
            {/* Layer 4: Secondary wave - depth through counter-rotation */}
            <SecondaryWave />
            
            {/* Layer 5: Primary wave - main sweeping effect */}
            <PrimaryWave />
            
            {/* Layer 6: Scanline accent - technological precision */}
            <ScanlineAccent />
            
            {/* Layer 7: Particle field - organic life */}
            <ParticleField />
            
            {/* Layer 8: Corner accents - geometric anchoring */}
            <CornerAccents />
        </motion.div>
    )
})
