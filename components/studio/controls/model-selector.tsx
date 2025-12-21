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
} from "lucide-react"
import type { ImageModel, ModelInfo } from "@/types/pollinations"

export interface ModelSelectorProps {
    /** Currently selected model */
    selectedModel: ImageModel
    /** Callback when model changes */
    onModelChange: (model: ImageModel) => void
    /** Available models */
    models: ModelInfo[]
    /** Whether selection is disabled */
    disabled?: boolean
    /** Display mode */
    variant?: "compact" | "cards"
    /** Additional class names */
    className?: string
}

// Map model IDs to icons
const MODEL_ICONS: Record<ImageModel, React.ComponentType<{ className?: string }>> = {
    flux: Sparkles,
    turbo: Zap,
    "flux-realism": Camera,
    "flux-anime": Palette,
    "flux-3d": Box,
    "any-dark": Moon,
}

// Map model IDs to style badges
const MODEL_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    turbo: { label: "Fast", variant: "secondary" },
    "flux-realism": { label: "HD", variant: "default" },
    "flux-anime": { label: "Art", variant: "outline" },
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
                        const Icon = MODEL_ICONS[model.id] || Sparkles
                        const badge = MODEL_BADGES[model.id]
                        const isSelected = selectedModel === model.id

                        return (
                            <button
                                key={model.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => onModelChange(model.id)}
                                className={cn(
                                    "relative flex flex-col items-start gap-1 p-3 rounded-lg border text-left",
                                    "transition-all duration-200",
                                    "hover:border-primary/50 hover:bg-primary/5",
                                    isSelected
                                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                        : "border-border/50 bg-background/50",
                                    disabled && "opacity-50 cursor-not-allowed"
                                )}
                                data-testid={`model-card-${model.id}`}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <Icon
                                        className={cn(
                                            "h-4 w-4",
                                            isSelected ? "text-primary" : "text-muted-foreground"
                                        )}
                                    />
                                    <span className="text-sm font-medium truncate">
                                        {model.name}
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
                                    {model.description}
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
                onValueChange={(value) => value && onModelChange(value as ImageModel)}
                disabled={disabled}
                className="flex flex-wrap gap-1"
                data-testid="model-toggle-group"
            >
                {models.map((model) => {
                    const Icon = MODEL_ICONS[model.id] || Sparkles

                    return (
                        <Tooltip key={model.id}>
                            <TooltipTrigger asChild>
                                <ToggleGroupItem
                                    value={model.id}
                                    aria-label={model.name}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 h-8",
                                        "data-[state=on]:bg-primary/15 data-[state=on]:text-primary",
                                        "data-[state=on]:border-primary/30"
                                    )}
                                    data-testid={`model-toggle-${model.id}`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    <span className="text-xs font-medium">{model.name}</span>
                                </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[200px]">
                                <p className="font-medium">{model.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {model.description}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </ToggleGroup>
        </div>
    )
}
