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
    Image as ImageIcon,
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

    // Group models by type for separator logic
    const imageModels = models.filter(m => m.type === "image")
    const videoModels = models.filter(m => m.type === "video")
    const hasMultipleTypes = imageModels.length > 0 && videoModels.length > 0

    // Render a single model button (shared between variants)
    const renderModelButton = (model: ModelDefinition, isCards: boolean) => {
        const Icon = getModelIcon(model)
        const isSelected = selectedModel === model.id
        const isMonochrome = model.logo?.includes("openai.svg") || model.logo?.includes("flux.svg")

        if (isCards) {
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
        }

        // Compact variant
        return (
            <Tooltip key={model.id}>
                <TooltipTrigger asChild>
                    <Button
                        variant={isSelected ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onModelChange(model.id)}
                        disabled={disabled}
                        className={cn(
                            "h-10 px-2 gap-2 justify-start transition-all border border-border/40 rounded-md",
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
                            "text-xs font-medium truncate",
                            isSelected && "text-emerald-700 dark:text-emerald-400"
                        )}>{model.displayName}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="p-3 max-w-[240px] bg-popover border border-border dark:border-white/15 text-popover-foreground shadow-[0_20px_60px_0px_rgba(0,0,0,0.8)] animate-in fade-in-0 zoom-in-95 duration-200"
                >
                    <p className="font-semibold text-sm tracking-tight">{model.displayName}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {model.description}
                    </p>
                </TooltipContent>
            </Tooltip>
        )
    }

    // Render group separator with label
    const renderGroupSeparator = (label: string, icon: React.ReactNode) => (
        <div className="col-span-full flex items-center gap-2 py-1.5" data-testid={`model-group-${label.toLowerCase().replace(/\s/g, "-")}`}>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {icon}
                <span>{label}</span>
            </div>
            <div className="flex-1 h-px bg-border/50" />
        </div>
    )

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
                    {hasMultipleTypes && imageModels.length > 0 && (
                        renderGroupSeparator("Image Models", <ImageIcon className="h-3 w-3" />)
                    )}
                    {imageModels.map((model) => renderModelButton(model, true))}
                    {hasMultipleTypes && videoModels.length > 0 && (
                        renderGroupSeparator("Video Models", <Video className="h-3 w-3" />)
                    )}
                    {videoModels.map((model) => renderModelButton(model, true))}
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
                className="grid grid-cols-2 gap-1.5"
                data-testid="model-buttons"
            >
                {hasMultipleTypes && imageModels.length > 0 && (
                    renderGroupSeparator("Image Models", <ImageIcon className="h-3 w-3" />)
                )}
                {imageModels.map((model) => renderModelButton(model, false))}
                {hasMultipleTypes && videoModels.length > 0 && (
                    renderGroupSeparator("Video Models", <Video className="h-3 w-3" />)
                )}
                {videoModels.map((model) => renderModelButton(model, false))}
            </div>
        </div>
    )
})
