"use client"

/**
 * ResolutionTierSelector - Visual resolution tier selection with model-aware availability
 * Follows SRP: Only manages resolution tier selection UI
 */

import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { RESOLUTION_TIERS, getSupportedTiersForModel, RESOLUTION_TIER_ORDER } from "@/lib/config/resolution-tiers"
import type { ModelConstraints, ResolutionTier } from "@/types/pollinations"
import { cn } from "@/lib/utils"
import * as React from "react"

export interface ResolutionTierSelectorProps {
    /** Currently selected tier */
    selectedTier: ResolutionTier
    /** Callback when tier changes */
    onTierChange: (tier: ResolutionTier) => void
    /** Model constraints to determine available tiers */
    constraints: ModelConstraints
    /** Whether selection is disabled */
    disabled?: boolean
    /** Additional class names */
    className?: string
    /** Compact mode for smaller UI */
    compact?: boolean
}

export const ResolutionTierSelector = React.memo(function ResolutionTierSelector({
    selectedTier,
    onTierChange,
    constraints,
    disabled = false,
    className,
    compact = false,
}: ResolutionTierSelectorProps) {
    const supportedTiers = React.useMemo(
        () => getSupportedTiersForModel(constraints),
        [constraints]
    )

    // Active selection styling - matching the emerald green from other controls
    const activeClasses = "bg-emerald-500/15 text-emerald-700 border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500 ring-1 ring-emerald-500/20"

    return (
        <div
            className={cn("flex gap-1", className)}
            data-testid="resolution-tier-selector"
        >
            {RESOLUTION_TIER_ORDER.map((tier) => {
                const config = RESOLUTION_TIERS[tier]
                const isSupported = supportedTiers.includes(tier)
                const isSelected = selectedTier === tier

                return (
                    <Tooltip key={tier}>
                        <TooltipTrigger asChild>
                            <Button
                                variant={isSelected ? "secondary" : "outline"}
                                size={compact ? "sm" : "default"}
                                onClick={() => onTierChange(tier)}
                                disabled={disabled || !isSupported}
                                className={cn(
                                    "px-2 min-w-[40px] transition-all",
                                    compact && "h-7 text-xs",
                                    isSelected && activeClasses,
                                    !isSupported && "opacity-40 cursor-not-allowed"
                                )}
                                data-testid={`tier-${tier}`}
                            >
                                {config.shortLabel}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className="font-medium">{config.label}</p>
                            <p className="text-xs opacity-70">{config.description}</p>
                            {!isSupported && (
                                <p className="text-xs text-destructive mt-1">
                                    Not supported by this model
                                </p>
                            )}
                        </TooltipContent>
                    </Tooltip>
                )
            })}
        </div>
    )
})
