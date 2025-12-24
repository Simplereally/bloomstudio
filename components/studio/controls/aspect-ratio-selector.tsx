"use client"

/**
 * AspectRatioSelector - Visual aspect ratio selection with previews
 * Follows SRP: Only manages aspect ratio selection UI
 */

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AspectRatio, AspectRatioOption } from "@/types/pollinations"
import {
    Frame,
    SlidersHorizontal,
} from "lucide-react"
import * as React from "react"

export interface AspectRatioSelectorProps {
    /** Currently selected aspect ratio */
    selectedRatio: AspectRatio
    /** Callback when aspect ratio changes */
    onRatioChange: (ratio: AspectRatio, dimensions: { width: number; height: number }) => void
    /** Available aspect ratios */
    ratios: AspectRatioOption[]
    /** Whether selection is disabled */
    disabled?: boolean
    /** Additional class names */
    className?: string
}

export const AspectRatioSelector = React.memo(function AspectRatioSelector({
    selectedRatio,
    onRatioChange,
    ratios,
    disabled = false,
    className,
}: AspectRatioSelectorProps) {
    const handleChange = (value: string) => {
        if (!value) return
        const ratio = ratios.find((r) => r.value === value)
        if (ratio) {
            onRatioChange(ratio.value, { width: ratio.width, height: ratio.height })
        }
    }

    return (
        <div className={`space-y-2 ${className || ""}`} data-testid="aspect-ratio-selector">
            <Label className="text-sm font-medium flex items-center gap-2">
                <Frame className="h-3.5 w-3.5 text-primary" />
                Aspect Ratio
            </Label>
            <div className="grid grid-cols-6 gap-1.5" data-testid="aspect-ratio-buttons">
                {ratios.map((ratio) => {
                    const isSelected = selectedRatio === ratio.value
                    const isCustom = ratio.value === "custom"

                    return (
                        <Tooltip key={ratio.value}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={isSelected ? "secondary" : "outline"}
                                    onClick={() => onRatioChange(ratio.value, { width: ratio.width, height: ratio.height })}
                                    disabled={disabled}
                                    className={`flex flex-col items-center gap-1.5 h-auto py-3 px-1 transition-all ${isSelected ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" : ""}`}
                                    data-testid={`ratio-${ratio.value.replace(":", "-")}`}
                                >
                                    {/* Visual ratio preview box */}
                                    <div
                                        className={`flex items-center justify-center border rounded-sm ${isSelected ? "border-primary/50 bg-primary/20" : "border-border/50 bg-background/50"}`}
                                        style={{
                                            width: isCustom ? 32 : Math.min(32, 32 * (ratio.width / Math.max(ratio.width, ratio.height))),
                                            height: isCustom ? 32 : Math.min(32, 32 * (ratio.height / Math.max(ratio.width, ratio.height))),
                                        }}
                                    >
                                        {isCustom && (
                                            <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
                                        )}
                                    </div>
                                    <span className="text-xs font-medium leading-none">
                                        {isCustom ? "Custom" : ratio.value}
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p className="font-medium">{ratio.label}</p>
                                {!isCustom && (
                                    <p className="text-xs text-muted-foreground">
                                        {ratio.width} × {ratio.height}
                                    </p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </div>
        </div>
    )
})
