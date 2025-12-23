"use client"

/**
 * AdvancedSettings Component
 *
 * Collapsible panel for advanced image generation settings.
 * Includes negative prompt, guidance scale, and toggle options.
 */

import { ChevronDown } from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { API_CONSTRAINTS } from "@/lib/config/api.config"

interface AdvancedSettingsProps {
    open: boolean
    onOpenChange: (open: boolean) => void

    // Negative prompt
    negativePrompt: string
    onNegativePromptChange: (value: string) => void

    // Toggle options
    transparent: boolean
    onTransparentChange: (value: boolean) => void
    nologo: boolean
    onNologoChange: (value: boolean) => void
    enhance: boolean
    onEnhanceChange: (value: boolean) => void
    privateGen: boolean
    onPrivateChange: (value: boolean) => void
    safe: boolean
    onSafeChange: (value: boolean) => void

    // Guidance scale
    guidanceScale: number | undefined
    onGuidanceScaleChange: (value: number[]) => void

    // Disabled state
    disabled?: boolean
}

/**
 * Individual setting toggle with label and description
 */
interface SettingToggleProps {
    id: string
    label: string
    description: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    disabled?: boolean
}

function SettingToggle({
    id,
    label,
    description,
    checked,
    onCheckedChange,
    disabled = false,
}: SettingToggleProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
                    {label}
                </Label>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                data-testid={`${id}-switch`}
            />
        </div>
    )
}

export function AdvancedSettings({
    open,
    onOpenChange,
    negativePrompt,
    onNegativePromptChange,
    transparent,
    onTransparentChange,
    nologo,
    onNologoChange,
    enhance,
    onEnhanceChange,
    privateGen,
    onPrivateChange,
    safe,
    onSafeChange,
    guidanceScale,
    onGuidanceScaleChange,
    disabled = false,
}: AdvancedSettingsProps) {
    const { min: minGuidance, max: maxGuidance } = API_CONSTRAINTS.guidanceScale

    return (
        <Collapsible open={open} onOpenChange={onOpenChange}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-between px-2"
                    size="sm"
                    data-testid="advanced-settings-trigger"
                >
                    <span className="text-sm font-medium">Advanced Settings</span>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                            open ? "rotate-180" : ""
                        }`}
                    />
                </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 pt-4" data-testid="advanced-settings-content">
                {/* Negative Prompt */}
                <div className="space-y-2">
                    <Label htmlFor="negative-prompt" className="text-sm font-medium">
                        Negative Prompt
                    </Label>
                    <Textarea
                        id="negative-prompt"
                        data-testid="negative-prompt-input"
                        placeholder="What to avoid in generation..."
                        value={negativePrompt}
                        onChange={(e) => onNegativePromptChange(e.target.value)}
                        className="min-h-[60px] resize-none bg-background/50"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        Default: &quot;worst quality, blurry&quot;
                    </p>
                </div>

                <Separator />

                {/* Guidance Scale */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="guidance-scale" className="text-sm font-medium">
                            Guidance Scale
                        </Label>
                        <span className="text-sm text-muted-foreground">
                            {guidanceScale ?? "Auto"}
                        </span>
                    </div>
                    <Slider
                        id="guidance-scale"
                        data-testid="guidance-scale-slider"
                        value={[guidanceScale ?? 7]}
                        onValueChange={onGuidanceScaleChange}
                        min={minGuidance}
                        max={maxGuidance}
                        step={0.5}
                        className="w-full py-3"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        How closely to follow the prompt (1=loose, 20=strict)
                    </p>
                </div>

                <Separator />

                {/* Toggle Options */}
                <div className="space-y-3">
                    <SettingToggle
                        id="transparent"
                        label="Transparent Background"
                        description="Generate PNG with transparency"
                        checked={transparent}
                        onCheckedChange={onTransparentChange}
                        disabled={disabled}
                    />

                    <SettingToggle
                        id="nologo"
                        label="Remove Watermark"
                        description="Remove Pollinations logo"
                        checked={nologo}
                        onCheckedChange={onNologoChange}
                        disabled={disabled}
                    />

                    <SettingToggle
                        id="enhance"
                        label="Enhance Prompt"
                        description="Let AI improve your prompt"
                        checked={enhance}
                        onCheckedChange={onEnhanceChange}
                        disabled={disabled}
                    />

                    <SettingToggle
                        id="private"
                        label="Private Generation"
                        description="Hide from public feeds"
                        checked={privateGen}
                        onCheckedChange={onPrivateChange}
                        disabled={disabled}
                    />

                    <SettingToggle
                        id="safe"
                        label="Safe Mode"
                        description="Enable content safety filters"
                        checked={safe}
                        onCheckedChange={onSafeChange}
                        disabled={disabled}
                    />
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
