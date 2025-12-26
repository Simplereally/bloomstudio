"use client"

/**
 * QualitySelector Component
 *
 * Dropdown for selecting image generation quality.
 * Options derived from Zod schema for type safety.
 */

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { QUALITY_OPTIONS } from "@/lib/config/api.config"
import type { Quality } from "@/lib/schemas/pollinations.schema"

interface QualitySelectorProps {
    value: Quality
    onChange: (value: Quality) => void
    disabled?: boolean
}

/**
 * Quality option metadata for UI display
 * Maps Quality enum values to user-friendly labels and descriptions
 */
const QUALITY_METADATA: Record<Quality, { label: string; description: string }> = {
    low: { label: "Low", description: "Faster generation" },
    medium: { label: "Medium", description: "Balanced quality" },
    high: { label: "High", description: "Better details" },
    hd: { label: "HD", description: "Best quality" },
}

export function QualitySelector({
    value,
    onChange,
    disabled = false,
}: QualitySelectorProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="quality" className="text-sm font-medium">
                Quality
            </Label>
            <Select
                value={value}
                onValueChange={(v) => onChange(v as Quality)}
                disabled={disabled}
            >
                <SelectTrigger
                    id="quality"
                    data-testid="quality-select"
                    className="w-full bg-background/50"
                >
                    <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                    {QUALITY_OPTIONS.map((quality) => {
                        const meta = QUALITY_METADATA[quality]
                        return (
                            <SelectItem
                                key={quality}
                                value={quality}
                                data-testid={`quality-item-${quality}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">{meta.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {meta.description}
                                    </span>
                                </div>
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>
    )
}
