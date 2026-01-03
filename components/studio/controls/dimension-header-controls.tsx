"use client"

/**
 * DimensionHeaderControls - Header controls for the Dimensions section
 * Displays megapixels, limit indicator, and link/unlink toggle
 */

import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { AlertTriangle, Link, Unlink } from "lucide-react"
import * as React from "react"

export interface DimensionHeaderControlsProps {
    /** Megapixels as a formatted string (e.g., "2.10") */
    megapixels: string
    /** Whether current dimensions exceed the limit */
    isOverLimit: boolean
    /** Percentage of pixel limit used (null if no limit) */
    percentOfLimit: number | null
    /** Whether the model has a pixel limit */
    hasPixelLimit: boolean
    /** Whether dimensions are linked */
    linked: boolean
    /** Callback when link state changes */
    onLinkedChange: (linked: boolean) => void
    /** Whether controls are disabled */
    disabled?: boolean
}

export const DimensionHeaderControls = React.memo(function DimensionHeaderControls({
    megapixels,
    isOverLimit,
    percentOfLimit,
    hasPixelLimit,
    linked,
    onLinkedChange,
    disabled = false,
}: DimensionHeaderControlsProps) {
    return (
        <div className="flex items-center gap-2">
            <span
                className={cn(
                    "text-xs tabular-nums",
                    isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                )}
                data-testid="dimension-header-megapixels"
            >
                {megapixels} MP
                {hasPixelLimit && percentOfLimit !== null && ` (${percentOfLimit.toFixed(0)}%)`}
            </span>
            {isOverLimit && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="cursor-help" data-testid="dimension-header-warning">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        Exceeds model limit. Image will be auto-scaled.
                    </TooltipContent>
                </Tooltip>
            )}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant={linked ? "secondary" : "ghost"}
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onLinkedChange(!linked)}
                        disabled={disabled}
                        data-testid="dimension-header-link-toggle"
                    >
                        {linked ? (
                            <Link className="h-3.5 w-3.5" />
                        ) : (
                            <Unlink className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                    {linked ? "Unlink dimensions" : "Link dimensions"}
                </TooltipContent>
            </Tooltip>
        </div>
    )
})

