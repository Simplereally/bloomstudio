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
import type { ModelDefinition } from "@/lib/config/models"
import { cn } from "@/lib/utils"
import {
    Camera,
    Cloud,
    PenTool,
    Sparkles,
    Video,
    Wand2,
    Zap,
} from "lucide-react"
import Image from "next/image"
import * as React from "react"

export interface ModelSelectorProps {
    /** Currently selected model */
    selectedModel: string
    /** Callback when model changes */
    onModelChange: (model: string) => void
    /** Available models from MODEL_REGISTRY */
    models: ModelDefinition[]
    /** Whether selection is disabled */
    disabled?: boolean
    /** Display mode */
    variant?: "compact" | "cards"
    /** Additional class names */
    className?: string
    /** Hide the header label (when wrapped in CollapsibleSection) */
    hideHeader?: boolean
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
function getModelIcon(model: ModelDefinition): React.ComponentType<{ className?: string }> {
    if (model.icon && ICON_MAP[model.icon]) {
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
    hideHeader = false,
}: ModelSelectorProps) {
    // Active selection green colors - harmonious with our warm orange palette
    // Using a sage/forest green that complements ember orange
    const activeClasses = "bg-emerald-500/15 text-emerald-700 border border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500 ring-1 ring-emerald-500/20"

    if (variant === "cards") {
        return (
            <div className={`space-y-3 ${className || ""}`} data-testid="model-selector">
                {!hideHeader && (
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Model
                    </Label>
                )}
                <div
                    className="grid grid-cols-2 gap-2.5"
                    data-testid="model-cards"
                >
                    {models.map((model) => {
                        const Icon = getModelIcon(model)
                        const isSelected = selectedModel === model.id
                        const isMonochrome = model.logo?.includes("openai.svg") || model.logo?.includes("flux.svg")

                        return (
                            <Button
                                key={model.id}
                                variant="outline"
                                className={cn(
                                    "h-auto flex flex-col items-start gap-2 p-4 text-left transition-all",
                                    "hover:border-foreground/30 hover:shadow-md",
                                    isSelected && activeClasses
                                )}
                                onClick={() => onModelChange(model.id)}
                                disabled={disabled}
                                data-testid={`model-card-${model.id}`}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    {model.logo ? (
                                        <Image
                                            src={model.logo}
                                            alt={`${model.displayName} logo`}
                                            width={32}
                                            height={32}
                                            className={cn(
                                                "transition-all flex-shrink-0",
                                                isMonochrome && "dark:invert",
                                                !isSelected && "opacity-70"
                                            )}
                                        />
                                    ) : (
                                        <Icon className={cn(
                                            "h-8 w-8 flex-shrink-0",
                                            isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                                        )} />
                                    )}
                                    <span className={cn(
                                        "text-base font-semibold truncate",
                                        isSelected && "text-emerald-700 dark:text-emerald-400"
                                    )}>
                                        {model.displayName}
                                    </span>
                                </div>
                                <span className="text-sm text-muted-foreground line-clamp-2">
                                    {model.description}
                                </span>
                            </Button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Compact variant using shadcn buttons with 2-column responsive grid
    return (
        <div className={`space-y-3 ${className || ""}`} data-testid="model-selector">
            {!hideHeader && (
                <Label className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Model
                </Label>
            )}
            <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                data-testid="model-buttons"
            >
                {models.map((model) => {
                    const Icon = getModelIcon(model)
                    const isSelected = selectedModel === model.id
                    const isMonochrome = model.logo?.includes("openai.svg") || model.logo?.includes("flux.svg")

                    return (
                        <Tooltip key={model.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={isSelected ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => onModelChange(model.id)}
                                    disabled={disabled}
                                    className={cn(
                                        "h-12 px-3 gap-2.5 justify-start transition-all",
                                        isSelected && activeClasses
                                    )}
                                    data-testid={`model-button-${model.id}`}
                                >
                                    {model.logo ? (
                                        <Image
                                            src={model.logo}
                                            alt={`${model.displayName} logo`}
                                            width={28}
                                            height={28}
                                            className={cn(
                                                "transition-all flex-shrink-0",
                                                isMonochrome && "dark:invert",
                                                !isSelected && "opacity-60"
                                            )}
                                        />
                                    ) : (
                                        <Icon className={cn(
                                            "h-7 w-7 flex-shrink-0",
                                            isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                                        )} />
                                    )}
                                    <span className={cn(
                                        "text-sm font-medium truncate",
                                        isSelected && "text-emerald-700 dark:text-emerald-400"
                                    )}>{model.displayName}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="flex flex-col items-center text-center max-w-[200px]">
                                <p className="font-medium">{model.displayName}</p>
                                <p className="text-xs opacity-70">
                                    {model.description}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </div>
        </div>
    )
})
