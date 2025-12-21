"use client"

/**
 * DimensionControls - Linked width/height sliders with lock toggle
 * Follows SRP: Only manages dimension input UI
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Link, Unlink, Ruler } from "lucide-react"

export interface DimensionControlsProps {
    /** Current width value */
    width: number
    /** Current height value */
    height: number
    /** Callback when width changes */
    onWidthChange: (width: number) => void
    /** Callback when height changes */
    onHeightChange: (height: number) => void
    /** Minimum dimension value */
    min?: number
    /** Maximum dimension value */
    max?: number
    /** Step value for slider */
    step?: number
    /** Whether inputs are disabled */
    disabled?: boolean
    /** Additional class names */
    className?: string
}

export function DimensionControls({
    width,
    height,
    onWidthChange,
    onHeightChange,
    min = 64,
    max = 2048,
    step = 64,
    disabled = false,
    className,
}: DimensionControlsProps) {
    const [linked, setLinked] = React.useState(false)
    const aspectRatio = React.useRef(width / height)

    // Update aspect ratio when linking
    React.useEffect(() => {
        if (linked) {
            aspectRatio.current = width / height
        }
    }, [linked, width, height])

    const roundToStep = (value: number) => {
        return Math.round(value / step) * step
    }

    const handleWidthChange = (values: number[]) => {
        const newWidth = roundToStep(values[0])
        onWidthChange(newWidth)

        if (linked) {
            const newHeight = roundToStep(newWidth / aspectRatio.current)
            const clampedHeight = Math.max(min, Math.min(max, newHeight))
            onHeightChange(clampedHeight)
        }
    }

    const handleHeightChange = (values: number[]) => {
        const newHeight = roundToStep(values[0])
        onHeightChange(newHeight)

        if (linked) {
            const newWidth = roundToStep(newHeight * aspectRatio.current)
            const clampedWidth = Math.max(min, Math.min(max, newWidth))
            onWidthChange(clampedWidth)
        }
    }

    const handleWidthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10)
        if (!isNaN(value)) {
            const rounded = roundToStep(Math.max(min, Math.min(max, value)))
            handleWidthChange([rounded])
        }
    }

    const handleHeightInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10)
        if (!isNaN(value)) {
            const rounded = roundToStep(Math.max(min, Math.min(max, value)))
            handleHeightChange([rounded])
        }
    }

    // Calculate megapixels
    const megapixels = ((width * height) / 1_000_000).toFixed(2)

    return (
        <div className={cn("space-y-3", className)} data-testid="dimension-controls">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                    <Ruler className="h-3.5 w-3.5 text-primary" />
                    Dimensions
                </Label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground" data-testid="megapixels">
                        {megapixels} MP
                    </span>
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
                            min={min}
                            max={max}
                            step={step}
                            disabled={disabled}
                            className="h-6 w-16 text-xs text-right px-1.5"
                            data-testid="width-input"
                        />
                        <span className="text-xs text-muted-foreground">px</span>
                    </div>
                </div>
                <Slider
                    value={[width]}
                    onValueChange={handleWidthChange}
                    min={min}
                    max={max}
                    step={step}
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
                            min={min}
                            max={max}
                            step={step}
                            disabled={disabled}
                            className="h-6 w-16 text-xs text-right px-1.5"
                            data-testid="height-input"
                        />
                        <span className="text-xs text-muted-foreground">px</span>
                    </div>
                </div>
                <Slider
                    value={[height]}
                    onValueChange={handleHeightChange}
                    min={min}
                    max={max}
                    step={step}
                    disabled={disabled}
                    className="py-1"
                    data-testid="height-slider"
                />
            </div>
        </div>
    )
}
