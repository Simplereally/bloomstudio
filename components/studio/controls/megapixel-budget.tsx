"use client"

/**
 * MegapixelBudget - Visual indicator of pixel budget usage
 * Shows megapixel count and percentage of model limit with a progress bar
 */

import { Progress } from "@/components/ui/progress"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    formatMegapixels,
    formatDimensions,
    calculatePixelBudgetPercent,
} from "@/lib/config/resolution-tiers"
import type { OutputCertainty } from "@/types/pollinations"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react"
import * as React from "react"

export interface MegapixelBudgetProps {
    /** Current width */
    width: number
    /** Current height */
    height: number
    /** Maximum allowed pixels */
    maxPixels: number
    /** Output certainty level for the current model */
    outputCertainty?: OutputCertainty
    /** Warning message to display */
    dimensionWarning?: string
    /** Additional class names */
    className?: string
    /** Compact mode */
    compact?: boolean
}

/**
 * Get color classes based on usage percentage
 */
function getUsageColorClasses(percent: number, isOverLimit: boolean): string {
    if (isOverLimit) return "text-destructive"
    if (percent > 90) return "text-amber-600 dark:text-amber-400"
    if (percent > 70) return "text-amber-500 dark:text-amber-400"
    return "text-muted-foreground"
}

/**
 * Get progress bar color based on usage
 */
function getProgressColor(percent: number, isOverLimit: boolean): string {
    if (isOverLimit) return "bg-destructive"
    if (percent > 90) return "bg-amber-500"
    if (percent > 70) return "bg-amber-400"
    return "bg-primary"
}

/**
 * Get certainty indicator props
 */
function getCertaintyIndicator(certainty?: OutputCertainty) {
    switch (certainty) {
        case "exact":
            return {
                icon: CheckCircle2,
                color: "text-emerald-500",
                label: "Exact dimensions",
                description: "Output will match requested size exactly",
            }
        case "likely":
            return {
                icon: HelpCircle,
                color: "text-blue-500",
                label: "Likely dimensions",
                description: "Output should match, minor variations possible",
            }
        case "variable":
            return {
                icon: AlertTriangle,
                color: "text-amber-500",
                label: "Variable output",
                description: "Output dimensions may vary from request",
            }
        default:
            return null
    }
}

export const MegapixelBudget = React.memo(function MegapixelBudget({
    width,
    height,
    maxPixels,
    outputCertainty,
    dimensionWarning,
    className,
    compact = false,
}: MegapixelBudgetProps) {
    const pixelCount = width * height
    const hasLimit = maxPixels < Infinity && maxPixels > 0
    const percent = hasLimit ? calculatePixelBudgetPercent(pixelCount, maxPixels) : 0
    const isOverLimit = hasLimit && pixelCount > maxPixels

    const certaintyIndicator = getCertaintyIndicator(outputCertainty)
    const colorClasses = getUsageColorClasses(percent, isOverLimit)
    const progressColor = getProgressColor(percent, isOverLimit)

    if (compact) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "flex items-center gap-1.5 cursor-help",
                            colorClasses,
                            className
                        )}
                        data-testid="megapixel-budget-compact"
                    >
                        <span className="text-xs font-medium">
                            {formatMegapixels(pixelCount)}
                        </span>
                        {hasLimit && (
                            <span className="text-xs opacity-70">
                                ({percent.toFixed(0)}%)
                            </span>
                        )}
                        {isOverLimit && (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                        {certaintyIndicator && !isOverLimit && (
                            <certaintyIndicator.icon
                                className={cn("h-3 w-3", certaintyIndicator.color)}
                            />
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px]">
                    <div className="space-y-1">
                        <p className="font-medium">
                            {formatDimensions(width, height)}
                        </p>
                        <p className="text-xs opacity-70">
                            {formatMegapixels(pixelCount)}
                            {hasLimit && ` of ${formatMegapixels(maxPixels)} limit`}
                        </p>
                        {isOverLimit && (
                            <p className="text-xs text-destructive">
                                Exceeds model limit. Image will be auto-scaled.
                            </p>
                        )}
                        {dimensionWarning && !isOverLimit && (
                            <p className="text-xs text-amber-500">{dimensionWarning}</p>
                        )}
                        {certaintyIndicator && (
                            <p className="text-xs text-muted-foreground">
                                {certaintyIndicator.description}
                            </p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        )
    }

    return (
        <div
            className={cn("space-y-1.5", className)}
            data-testid="megapixel-budget"
        >
            {/* Stats row */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                    <span className={cn("font-medium", colorClasses)}>
                        {formatMegapixels(pixelCount)}
                    </span>
                    {hasLimit && (
                        <span className="text-muted-foreground">
                            / {formatMegapixels(maxPixels)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">
                        {formatDimensions(width, height)}
                    </span>
                    {certaintyIndicator && (
                        <Tooltip>
                            <TooltipTrigger>
                                <certaintyIndicator.icon
                                    className={cn("h-3.5 w-3.5", certaintyIndicator.color)}
                                />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p className="font-medium">{certaintyIndicator.label}</p>
                                <p className="text-xs opacity-70">
                                    {certaintyIndicator.description}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            {hasLimit && (
                <div className="relative">
                    <Progress
                        value={Math.min(100, percent)}
                        className="h-1.5"
                        data-testid="budget-progress"
                    />
                    {/* Custom colored overlay */}
                    <div
                        className={cn(
                            "absolute inset-0 h-1.5 rounded-full transition-all",
                            progressColor
                        )}
                        style={{ width: `${Math.min(100, percent)}%` }}
                    />
                </div>
            )}

            {/* Warning message */}
            {(isOverLimit || dimensionWarning) && (
                <p
                    className={cn(
                        "text-xs",
                        isOverLimit ? "text-destructive" : "text-amber-500"
                    )}
                    data-testid="budget-warning"
                >
                    {isOverLimit
                        ? "Exceeds model limit. Image will be auto-scaled."
                        : dimensionWarning}
                </p>
            )}
        </div>
    )
})
