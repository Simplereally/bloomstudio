"use client"

/**
 * DimensionControls - Model-aware linked width/height sliders with lock toggle
 * Enhanced with megapixel budget visualization and output certainty indicators.
 * Follows SRP: Only manages dimension input UI with model constraint awareness
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { MegapixelBudget } from "./megapixel-budget"
import { useDimensionConstraints } from "@/hooks/use-dimension-constraints"
import { cn } from "@/lib/utils"
import { Link, Ruler, Unlink } from "lucide-react"
import * as React from "react"

export interface DimensionControlsProps {
    /** Current width value */
    width: number
    /** Current height value */
    height: number
    /** Callback when width changes */
    onWidthChange: (width: number) => void
    /** Callback when height changes */
    onHeightChange: (height: number) => void
    /** Model ID for constraint lookup */
    modelId?: string
    /** Minimum dimension value (deprecated - use modelId for constraints) */
    min?: number
    /** Maximum dimension value (deprecated - use modelId for constraints) */
    max?: number
    /** Step value for slider (deprecated - use modelId for constraints) */
    step?: number
    /** Whether inputs are disabled */
    disabled?: boolean
    /** Additional class names */
    className?: string
    /** Hide the header (when wrapped in CollapsibleSection) */
    hideHeader?: boolean
    /** Whether dimensions are linked (controlled mode - overrides internal state) */
    linked?: boolean
    /** Callback when linked state changes (controlled mode) */
    onLinkedChange?: (linked: boolean) => void
    /** Show the enhanced megapixel budget visualization */
    showBudgetVisualization?: boolean
}

export const DimensionControls = React.memo(function DimensionControls({
    width,
    height,
    onWidthChange,
    onHeightChange,
    modelId = "zimage",
    disabled = false,
    className,
    hideHeader = false,
    linked: linkedProp,
    onLinkedChange,
    showBudgetVisualization = true,
}: DimensionControlsProps) {
    // Support both controlled and uncontrolled modes for linked state
    const [internalLinked, setInternalLinked] = React.useState(false)
    const isControlled = linkedProp !== undefined
    const linked = isControlled ? linkedProp : internalLinked
    const setLinked = React.useCallback((value: boolean) => {
        if (isControlled) {
            onLinkedChange?.(value)
        } else {
            setInternalLinked(value)
        }
    }, [isControlled, onLinkedChange])

    const aspectRatio = React.useRef(width / height)

    // Get model-specific constraints
    const {
        constraints,
        maxWidth,
        maxHeight,
        isEnabled,
        handleWidthChange: constrainedWidthChange,
        handleHeightChange: constrainedHeightChange,
    } = useDimensionConstraints({
        modelId,
        width,
        height,
        onWidthChange,
        onHeightChange,
    })

    // Update aspect ratio when linking
    React.useEffect(() => {
        if (linked) {
            aspectRatio.current = width / height
        }
    }, [linked, width, height])

    const handleWidthSlider = (values: number[]) => {
        const newWidth = values[0]
        constrainedWidthChange(newWidth)

        if (linked) {
            const newHeight = Math.round(newWidth / aspectRatio.current / constraints.step) * constraints.step
            constrainedHeightChange(Math.max(constraints.minDimension, newHeight))
        }
    }

    const handleHeightSlider = (values: number[]) => {
        const newHeight = values[0]
        constrainedHeightChange(newHeight)

        if (linked) {
            const newWidth = Math.round(newHeight * aspectRatio.current / constraints.step) * constraints.step
            constrainedWidthChange(Math.max(constraints.minDimension, newWidth))
        }
    }

    const handleWidthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10)
        if (!isNaN(value)) {
            handleWidthSlider([value])
        }
    }

    const handleHeightInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10)
        if (!isNaN(value)) {
            handleHeightSlider([value])
        }
    }

    if (!isEnabled) {
        return null
    }

    return (
        <div className={cn("space-y-3", className)} data-testid="dimension-controls">
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Ruler className="h-3.5 w-3.5 text-primary" />
                        Dimensions
                    </Label>
                    <div className="flex items-center gap-2">
                        {/* Compact megapixel display in header */}
                        <MegapixelBudget
                            width={width}
                            height={height}
                            maxPixels={constraints.maxPixels}
                            outputCertainty={constraints.outputCertainty}
                            dimensionWarning={constraints.dimensionWarning}
                            compact
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant={linked ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setLinked(!linked)}
                                    disabled={disabled}
                                    data-testid="link-toggle"
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
                </div>
            )}

            {/* Full megapixel budget visualization when header is hidden or explicitly enabled */}
            {(hideHeader || showBudgetVisualization) && (
                <MegapixelBudget
                    width={width}
                    height={height}
                    maxPixels={constraints.maxPixels}
                    outputCertainty={constraints.outputCertainty}
                    dimensionWarning={constraints.dimensionWarning}
                />
            )}

            {/* Width Control */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="width" className="text-xs text-muted-foreground">
                        Width
                    </Label>
                    <div className="flex items-center gap-1">
                        <Input
                            id="width"
                            type="number"
                            value={width}
                            onChange={handleWidthInput}
                            min={constraints.minDimension}
                            max={maxWidth}
                            step={constraints.step}
                            disabled={disabled}
                            className="h-6 w-16 text-xs text-right px-1.5"
                            data-testid="width-input"
                        />
                        <span className="text-xs text-muted-foreground">px</span>
                    </div>
                </div>
                <Slider
                    value={[width]}
                    onValueChange={handleWidthSlider}
                    min={constraints.minDimension}
                    max={constraints.maxDimension}
                    step={constraints.step}
                    disabled={disabled}
                    className="py-1"
                    data-testid="width-slider"
                />
            </div>

            {/* Height Control */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="height" className="text-xs text-muted-foreground">
                        Height
                    </Label>
                    <div className="flex items-center gap-1">
                        <Input
                            id="height"
                            type="number"
                            value={height}
                            onChange={handleHeightInput}
                            min={constraints.minDimension}
                            max={maxHeight}
                            step={constraints.step}
                            disabled={disabled}
                            className="h-6 w-16 text-xs text-right px-1.5"
                            data-testid="height-input"
                        />
                        <span className="text-xs text-muted-foreground">px</span>
                    </div>
                </div>
                <Slider
                    value={[height]}
                    onValueChange={handleHeightSlider}
                    min={constraints.minDimension}
                    max={constraints.maxDimension}
                    step={constraints.step}
                    disabled={disabled}
                    className="py-1"
                    data-testid="height-slider"
                />
            </div>
        </div>
    )
})
