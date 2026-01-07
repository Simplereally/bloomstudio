"use client"

/**
 * VideoSettingsPanel - Controls for video generation settings
 * 
 * Displays video-specific settings that only appear when a video model is selected:
 * - Duration control (slider or fixed options)
 * - Audio toggle (veo only)
 * 
 * Follows SRP: Only manages video generation options
 */

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { VideoDurationConstraints } from "@/lib/config/models"
import { ChevronDown, Clock, Volume2, Video } from "lucide-react"
import * as React from "react"

export interface VideoSettings {
    /** Video duration in seconds */
    duration: number
    /** Whether to include audio (veo only) */
    audio: boolean
}

export interface VideoSettingsPanelProps {
    /** Current video settings */
    settings: VideoSettings
    /** Callback when settings change */
    onSettingsChange: (settings: VideoSettings) => void
    /** Duration constraints from the model */
    durationConstraints?: VideoDurationConstraints
    /** Whether the model supports audio */
    supportsAudio?: boolean
    /** Whether panel is disabled */
    disabled?: boolean
    /** Whether to start expanded */
    defaultExpanded?: boolean
    /** Additional class names */
    className?: string
}

export const VideoSettingsPanel = React.memo(function VideoSettingsPanel({
    settings,
    onSettingsChange,
    durationConstraints,
    supportsAudio = false,
    disabled = false,
    defaultExpanded = true,
    className,
}: VideoSettingsPanelProps) {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

    // Handle duration change
    const handleDurationChange = React.useCallback((value: number) => {
        onSettingsChange({ ...settings, duration: value })
    }, [settings, onSettingsChange])

    // Handle audio toggle
    const handleAudioChange = React.useCallback((checked: boolean) => {
        onSettingsChange({ ...settings, audio: checked })
    }, [settings, onSettingsChange])

    // If no duration constraints, don't render anything
    if (!durationConstraints) {
        return null
    }

    const { min, max, fixedOptions, defaultDuration } = durationConstraints
    const hasFixedOptions = fixedOptions && fixedOptions.length > 0

    return (
        <div className={`space-y-2 ${className || ""}`} data-testid="video-settings-panel">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger
                    className="flex items-start justify-between w-full py-2 px-1 rounded-sm hover:bg-muted transition-colors text-left"
                    data-testid="video-settings-trigger"
                >
                    <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Video Settings</span>
                        <span
                            className="flex items-center justify-center px-2 h-5 rounded-full text-xs font-medium bg-primary/15 text-primary tabular-nums"
                            data-testid="duration-badge"
                        >
                            {settings.duration}s
                        </span>
                        {supportsAudio && settings.audio && (
                            <span
                                className="flex items-center justify-center px-2 h-5 rounded-full text-xs font-medium bg-primary/15 text-primary"
                                data-testid="audio-badge"
                            >
                                <Volume2 className="h-3 w-3" />
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-1">
                    <div className="rounded-sm border border-border/50 bg-background/50 divide-y divide-border/50">
                        {/* Duration Control */}
                        <div
                            className={`py-3 px-3 ${disabled ? "opacity-50" : ""}`}
                            data-testid="duration-control"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/15 text-primary">
                                    <Clock className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <Label className="text-sm font-medium leading-none">
                                        Duration
                                    </Label>
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                        {hasFixedOptions
                                            ? `Choose from ${fixedOptions.join(", ")} seconds`
                                            : `${min}-${max} seconds`}
                                    </span>
                                </div>
                            </div>

                            {hasFixedOptions ? (
                                <ToggleGroup
                                    type="single"
                                    value={settings.duration.toString()}
                                    onValueChange={(value) => value && handleDurationChange(parseInt(value, 10))}
                                    className="justify-start gap-2"
                                    disabled={disabled}
                                >
                                    {fixedOptions.map((option) => (
                                        <ToggleGroupItem
                                            key={option}
                                            value={option.toString()}
                                            className="h-9 px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                                            data-testid={`duration-option-${option}`}
                                        >
                                            {option}s
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            ) : (
                                <div className="space-y-2">
                                    <Slider
                                        value={[settings.duration]}
                                        onValueChange={([value]) => handleDurationChange(value)}
                                        min={min}
                                        max={max}
                                        step={1}
                                        disabled={disabled}
                                        className="w-full"
                                        data-testid="duration-slider"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                                        <span>{min}s</span>
                                        <span className="font-medium text-foreground">{settings.duration}s</span>
                                        <span>{max}s</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Audio Toggle (veo only) */}
                        {supportsAudio && (
                            <div
                                className={`flex items-center justify-between py-2.5 px-3 ${disabled ? "opacity-50" : ""}`}
                                data-testid="audio-control"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex items-center justify-center w-7 h-7 rounded-md ${settings.audio ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                                    >
                                        <Volume2 className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <Label
                                            htmlFor="video-audio"
                                            className="text-sm font-medium cursor-pointer leading-none"
                                        >
                                            Generate Audio
                                        </Label>
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                            Include AI-generated audio
                                        </span>
                                    </div>
                                </div>
                                <Switch
                                    id="video-audio"
                                    checked={settings.audio}
                                    onCheckedChange={handleAudioChange}
                                    disabled={disabled}
                                    data-testid="audio-switch"
                                />
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
})
