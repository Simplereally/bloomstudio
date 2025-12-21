"use client"

/**
 * AspectRatioSelector - Visual aspect ratio selection with previews
 * Follows SRP: Only manages aspect ratio selection UI
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Square,
    RectangleHorizontal,
    RectangleVertical,
    Image as ImageIcon,
    Frame,
    Monitor,
    SlidersHorizontal,
} from "lucide-react"
import type { AspectRatio, AspectRatioOption } from "@/types/pollinations"

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

// Map ratio icons to components
const RATIO_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    square: Square,
    "rectangle-horizontal": RectangleHorizontal,
    "rectangle-vertical": RectangleVertical,
    image: ImageIcon,
    frame: Frame,
    monitor: Monitor,
    sliders: SlidersHorizontal,
}

export function AspectRatioSelector({
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
        <div className={cn("space-y-2", className)} data-testid="aspect-ratio-selector">
            <Label className="text-sm font-medium flex items-center gap-2">
                <Frame className="h-3.5 w-3.5 text-primary" />
                Aspect Ratio
            </Label>

            <ToggleGroup
                type="single"
                value={selectedRatio}
                onValueChange={handleChange}
                disabled={disabled}
                className="grid grid-cols-4 gap-1.5"
                data-testid="aspect-ratio-group"
            >
                {ratios.map((ratio) => {
                    const Icon = RATIO_ICONS[ratio.icon] || Square
                    const isSelected = selectedRatio === ratio.value

                    return (
                        <Tooltip key={ratio.value}>
                            <TooltipTrigger asChild>
                                <ToggleGroupItem
                                    value={ratio.value}
                                    aria-label={ratio.label}
                                    className={cn(
                                        "flex flex-col items-center gap-1 h-auto py-2 px-1",
                                        "data-[state=on]:bg-primary/15 data-[state=on]:text-primary",
                                        "data-[state=on]:border-primary/30 data-[state=on]:ring-1 data-[state=on]:ring-primary/20"
                                    )}
                                    data-testid={`ratio-${ratio.value.replace(":", "-")}`}
                                >
                                    {/* Visual ratio preview box */}
                                    <div
                                        className={cn(
                                            "flex items-center justify-center",
                                            "border rounded-sm",
                                            isSelected
                                                ? "border-primary/50 bg-primary/10"
                                                : "border-border/50 bg-background/50"
                                        )}
                                        style={{
                                            width: ratio.value === "custom" ? 24 : Math.min(24, 24 * (ratio.width / Math.max(ratio.width, ratio.height))),
                                            height: ratio.value === "custom" ? 24 : Math.min(24, 24 * (ratio.height / Math.max(ratio.width, ratio.height))),
                                        }}
                                    >
                                        {ratio.value === "custom" && (
                                            <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium leading-none">
                                        {ratio.value === "custom" ? "Custom" : ratio.value}
                                    </span>
                                </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p className="font-medium">{ratio.label}</p>
                                {ratio.value !== "custom" && (
                                    <p className="text-xs text-muted-foreground">
                                        {ratio.width} × {ratio.height}
                                    </p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </ToggleGroup>
        </div>
    )
}
