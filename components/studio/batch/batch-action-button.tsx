"use client"

/**
 * BatchActionButton - A refined progress button for batch generation
 * 
 * Features:
 * - Smooth progress fill animation with elegant gradient
 * - Understated, minimal design that feels premium
 * - Subtle glow effect that pulses during active generation
 * - In-flight indicator when paused showing items still completing
 */

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2, Pause, Play, X } from "lucide-react"
import * as React from "react"

export interface BatchActionButtonProps {
    /** Whether the batch is currently paused */
    isPaused: boolean
    /** Number of completed generations */
    completedCount: number
    /** Total number of generations */
    totalCount: number
    /** Number of items currently in-flight (will complete even after pause) */
    inFlightCount?: number
    /** Callback when pause is clicked */
    onPause: () => void
    /** Callback when resume is clicked */
    onResume: () => void
    /** Callback when cancel is clicked */
    onCancel: () => void
    /** Additional class names */
    className?: string
}

export const BatchActionButton = React.memo(function BatchActionButton({
    isPaused,
    completedCount,
    totalCount,
    inFlightCount = 0,
    onPause,
    onResume,
    onCancel,
    className,
}: BatchActionButtonProps) {
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    
    // Show in-flight indicator when paused and items are still processing
    const showInFlightIndicator = isPaused && inFlightCount > 0
    
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <div className="flex gap-2">
                {/* Main action button with progress fill */}
                <div className="relative flex-1 group">
                    {/* Background track - subtle and refined */}
                    <div className="absolute inset-0 rounded-lg bg-secondary/60 overflow-hidden">
                        {/* Progress fill - elegant emerald gradient */}
                        <div
                            className={cn(
                                "absolute inset-y-0 left-0 transition-[width] duration-500 ease-out",
                                // Gradient that feels alive but not overwhelming
                                isPaused
                                    ? "bg-gradient-to-r from-amber-500/30 via-amber-400/20 to-amber-500/10"
                                    : "bg-gradient-to-r from-emerald-500/40 via-emerald-400/25 to-emerald-300/15"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                        
                        {/* Subtle shimmer effect on progress edge - only when active */}
                        {!isPaused && progress > 0 && progress < 100 && (
                            <div
                                className="absolute inset-y-0 w-8 transition-all duration-500 ease-out"
                                style={{ 
                                    left: `calc(${progress}% - 2rem)`,
                                    background: "linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.15), transparent)"
                                }}
                            />
                        )}
                        
                        {/* Soft inner glow on progress area */}
                        <div
                            className={cn(
                                "absolute inset-y-0 left-0 pointer-events-none transition-[width] duration-500 ease-out",
                                isPaused
                                    ? "shadow-[inset_0_-1px_1px_rgba(251,191,36,0.1)]"
                                    : "shadow-[inset_0_-1px_1px_rgba(52,211,153,0.15)]"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    
                    {/* The actual button - positioned above progress */}
                    <Button
                        onClick={isPaused ? onResume : onPause}
                        variant="ghost"
                        size="lg"
                        className={cn(
                            "relative w-full h-11 text-base font-medium",
                            "bg-transparent hover:bg-transparent",
                            "border border-border/40 hover:border-border/60",
                            "rounded-lg overflow-hidden",
                            "transition-all duration-300",
                            // Text color based on state
                            isPaused 
                                ? "text-amber-600 dark:text-amber-400" 
                                : "text-emerald-700 dark:text-emerald-300"
                        )}
                    >
                        {/* Icon with subtle animation */}
                        <span className={cn(
                            "transition-transform duration-200",
                            !isPaused && "group-hover:scale-110"
                        )}>
                            {isPaused ? (
                                <Play className="h-4 w-4 fill-current" />
                            ) : (
                                <Pause className="h-4 w-4 fill-current" />
                            )}
                        </span>
                        
                        {/* Text content with refined typography */}
                        <span className="font-medium tracking-tight">
                            {isPaused ? "Resume" : "Pause"}
                        </span>
                        
                        {/* Progress counter - elegant monospace */}
                        <span className={cn(
                            "ml-1 text-sm tabular-nums opacity-70",
                            "font-mono tracking-tighter"
                        )}>
                            {completedCount}/{totalCount}
                        </span>
                    </Button>
                    
                    {/* Subtle ambient glow when generating - very understated */}
                    {!isPaused && (
                        <div 
                            className={cn(
                                "absolute -inset-px rounded-lg pointer-events-none",
                                "opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                                "shadow-[0_0_12px_-3px_rgba(52,211,153,0.3)]"
                            )}
                        />
                    )}
                </div>
                
                {/* Cancel button - minimal and refined */}
                <Button
                    onClick={onCancel}
                    variant="ghost"
                    size="lg"
                    className={cn(
                        "h-11 w-11 px-0",
                        "rounded-lg",
                        "border border-border/40 hover:border-destructive/50",
                        "text-muted-foreground hover:text-destructive",
                        "bg-transparent hover:bg-destructive/5",
                        "transition-all duration-200"
                    )}
                    title="Cancel batch generation"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            
            {/* In-flight indicator - subtle text showing items still completing */}
            {showInFlightIndicator && (
                <div className={cn(
                    "flex items-center justify-center gap-1.5",
                    "text-xs text-muted-foreground/80",
                    "animate-in fade-in-0 slide-in-from-top-1 duration-300"
                )}>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>
                        {inFlightCount} {inFlightCount === 1 ? "image" : "images"} finishing...
                    </span>
                </div>
            )}
        </div>
    )
})

