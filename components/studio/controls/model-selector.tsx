"use client"

/**
 * ModelSelector - Visual model selection with cards and previews
 * Follows SRP: Only manages model selection UI
 */

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { getModel, getModelDisplayName } from "@/lib/config/models"
import type { ImageModelInfo } from "@/lib/schemas/pollinations.schema"
import {
    Camera,
    Cloud,
    PenTool,
    Sparkles,
    Video,
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

// Map icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    sparkles: Sparkles,
    zap: Zap,
    camera: Camera,
    "pen-tool": PenTool,
    cloud: Cloud,
    video: Video,
}

/**
 * Get icon component for a model
 */
function getModelIcon(modelId: string): React.ComponentType<{ className?: string }> {
    const model = getModel(modelId)
    if (model?.icon && ICON_MAP[model.icon]) {
        return ICON_MAP[model.icon]
    }
    return Wand2
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
                        const Icon = getModelIcon(model.name)
                        const isSelected = selectedModel === model.name
                        const displayName = getModelDisplayName(model.name)

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
                                        {displayName}
                                    </span>
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
                    const Icon = getModelIcon(model.name)
                    const isSelected = selectedModel === model.name
                    const displayName = getModelDisplayName(model.name)

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
                                    <span className="text-xs font-medium">{displayName}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="flex flex-col items-center text-center">
                                <p className="font-medium">{displayName}</p>
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
