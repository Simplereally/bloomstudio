"use client"

/**
 * BatchModePanel - Controls for batch image generation
 * Provides toggle for batch mode and count input
 */

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import * as React from "react"

export interface BatchModeSettings {
    enabled: boolean
    count: number
}

export interface BatchModePanelProps {
    /** Current batch mode settings */
    settings: BatchModeSettings
    /** Callback when settings change */
    onSettingsChange: (settings: BatchModeSettings) => void
    /** Whether panel is disabled */
    disabled?: boolean
    /** Additional class names */
    className?: string
}

/** Minimum batch size */
const MIN_BATCH_SIZE = 1
/** Maximum batch size */
const MAX_BATCH_SIZE = 1000

export const BatchModePanel = React.memo(function BatchModePanel({
    settings,
    onSettingsChange,
    disabled = false,
    className,
}: BatchModePanelProps) {
    const handleToggle = (enabled: boolean) => {
        onSettingsChange({ ...settings, enabled })
    }

    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10)
        if (!isNaN(value)) {
            const clampedValue = Math.min(Math.max(value, MIN_BATCH_SIZE), MAX_BATCH_SIZE)
            onSettingsChange({ ...settings, count: clampedValue })
        }
    }

    return (
        <div 
            className={`rounded-sm border border-border/50 bg-background/50 p-3 space-y-4 ${className || ""}`} 
            data-testid="batch-mode-panel"
        >
            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <Label htmlFor="batch-enabled" className="text-sm font-medium cursor-pointer">
                        Enable Batch Generation
                    </Label>
                    <span className="text-xs text-muted-foreground">
                        Queue multiple images for batch processing
                    </span>
                </div>
                <Switch
                    id="batch-enabled"
                    checked={settings.enabled}
                    onCheckedChange={handleToggle}
                    disabled={disabled}
                    data-testid="batch-enabled-switch"
                />
            </div>

            {/* Count Input - only shown when enabled */}
            {settings.enabled && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="batch-count" className="text-sm font-medium">
                            Number of Images
                        </Label>

                    </div>
                    <Input
                        id="batch-count"
                        type="number"
                        min={MIN_BATCH_SIZE}
                        max={MAX_BATCH_SIZE}
                        value={settings.count}
                        onChange={handleCountChange}
                        disabled={disabled}
                        className="h-9"
                        data-testid="batch-count-input"
                    />
                    <p className="text-xs text-muted-foreground">
                        Max {MAX_BATCH_SIZE}.
                    </p>
                </div>
            )}
        </div>
    )
})
