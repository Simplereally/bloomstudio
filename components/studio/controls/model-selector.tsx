"use client"

/**
 * ModelSelector - Visual model selection with cards and previews
 * Follows SRP: Only manages model selection UI
 */

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ImageModelInfo } from "@/lib/schemas/pollinations.schema"
import {
    Box,
    Camera,
    Cloud,
    Moon,
    Palette,
    PenTool,
    Sparkles,
    Wand2,
    Zap,
} from "lucide-react"
import * as React from "react"

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

export const ModelSelector = React.memo(function ModelSelector({
    selectedModel,
    onModelChange,
    models,
    disabled = false,
    variant = "compact",
    className,
}: ModelSelectorProps) {
    if (variant === "cards") {
        return (
            <div className={`space-y-2 ${className || ""}`} data-testid="model-selector">
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
                            <Button
                                key={model.name}
                                variant={isSelected ? "secondary" : "outline"}
                                className="h-auto flex flex-col items-start gap-1 p-3 text-left transition-all"
                                onClick={() => onModelChange(model.name)}
                                disabled={disabled}
                                data-testid={`model-card-${model.name}`}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
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
                            </Button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Compact variant using shadcn buttons
    return (
        <div className={`space-y-2 ${className || ""}`} data-testid="model-selector">
            <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Model
            </Label>
            <div className="flex flex-wrap gap-1" data-testid="model-buttons">
                {models.map((model) => {
                    const Icon = MODEL_ICONS[model.name] || Wand2
                    const isSelected = selectedModel === model.name

                    return (
                        <Tooltip key={model.name}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={isSelected ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => onModelChange(model.name)}
                                    disabled={disabled}
                                    className={`h-8 px-3 gap-1.5 transition-all ${isSelected ? "bg-primary/15 text-primary border-primary/30" : ""}`}
                                    data-testid={`model-button-${model.name}`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    <span className="text-xs font-medium">{getModelDisplayName(model)}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="flex flex-col items-center text-center">
                                <p className="font-medium">{getModelDisplayName(model)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {model.description || "Image generation model"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </div>
        </div>
    )
})
