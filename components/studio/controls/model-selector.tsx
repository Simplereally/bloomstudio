"use client"

/**
 * ModelSelector - Visual model selection with cards and previews
 * Follows SRP: Only manages model selection UI
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Zap,
    Sparkles,
    Camera,
    Palette,
    Box,
    Moon,
    Wand2,
    PenTool,
    Cloud,
} from "lucide-react"
import type { ImageModelInfo } from "@/lib/schemas/pollinations.schema"

export interface ModelSelectorProps {
    /** Currently selected model */
    selectedModel: string
    /** Callback when model changes */
    onModelChange: (model: string) => void
    /** Available models */
    models: ImageModelInfo[]
    /** Whether selection is disabled */
    disabled?: boolean
    /** Display mode */
    variant?: "compact" | "cards"
    /** Additional class names */
    className?: string
}

// Map model names to icons
const MODEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    flux: Sparkles,
    turbo: Zap,
    gptimage: Camera,
    kontext: PenTool,
    seedream: Cloud,
    "seedream-pro": Cloud,
    // Legacy fallbacks
    "flux-realism": Camera,
    "flux-anime": Palette,
    "flux-3d": Box,
    "any-dark": Moon,
}

// Map model names to style badges
const MODEL_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    turbo: { label: "Fast", variant: "secondary" },
    gptimage: { label: "GPT", variant: "default" },
    "seedream-pro": { label: "Pro", variant: "default" },
}

/**
 * Get display name for a model
 */
function getModelDisplayName(model: ImageModelInfo): string {
    // Capitalize and format the model name
    return model.name.charAt(0).toUpperCase() + model.name.slice(1)
}

export function ModelSelector({
    selectedModel,
    onModelChange,
    models,
    disabled = false,
    variant = "compact",
    className,
}: ModelSelectorProps) {
    if (variant === "cards") {
        return (
            <div className={cn("space-y-2", className)} data-testid="model-selector">
                <Label className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Model
                </Label>
                <div className="grid grid-cols-2 gap-2" data-testid="model-cards">
                    {models.map((model) => {
                        const Icon = MODEL_ICONS[model.name] || Wand2
                        const badge = MODEL_BADGES[model.name]
                        const isSelected = selectedModel === model.name

                        return (
                            <button
                                key={model.name}
                                type="button"
                                disabled={disabled}
                                onClick={() => onModelChange(model.name)}
                                className={cn(
                                    "relative flex flex-col items-start gap-1 p-3 rounded-lg border text-left",
                                    "transition-all duration-200",
                                    "hover:border-primary/50 hover:bg-primary/5",
                                    isSelected
                                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                        : "border-border/50 bg-background/50",
                                    disabled && "opacity-50 cursor-not-allowed"
                                )}
                                data-testid={`model-card-${model.name}`}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <Icon
                                        className={cn(
                                            "h-4 w-4",
                                            isSelected ? "text-primary" : "text-muted-foreground"
                                        )}
                                    />
                                    <span className="text-sm font-medium truncate">
                                        {getModelDisplayName(model)}
                                    </span>
                                    {badge && (
                                        <Badge
                                            variant={badge.variant}
                                            className="ml-auto text-[10px] px-1.5 py-0"
                                        >
                                            {badge.label}
                                        </Badge>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                    {model.description || "Image generation model"}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Compact toggle group variant
    return (
        <div className={cn("space-y-2", className)} data-testid="model-selector">
            <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Model
            </Label>
            <ToggleGroup
                type="single"
                value={selectedModel}
                onValueChange={(value) => value && onModelChange(value)}
                disabled={disabled}
                className="flex flex-wrap gap-1"
                data-testid="model-toggle-group"
            >
                {models.map((model) => {
                    const Icon = MODEL_ICONS[model.name] || Wand2

                    return (
                        <Tooltip key={model.name}>
                            <TooltipTrigger asChild>
                                <ToggleGroupItem
                                    value={model.name}
                                    aria-label={getModelDisplayName(model)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 h-8",
                                        "data-[state=on]:bg-primary/15 data-[state=on]:text-primary",
                                        "data-[state=on]:border-primary/30"
                                    )}
                                    data-testid={`model-toggle-${model.name}`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    <span className="text-xs font-medium">{getModelDisplayName(model)}</span>
                                </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[200px]">
                                <p className="font-medium">{getModelDisplayName(model)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {model.description || "Image generation model"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </ToggleGroup>
        </div>
    )
}
