"use client"

/**
 * ModelSelector Component
 *
 * Dynamic model selector using useImageModels hook.
 * Displays models from API with fallback indicator for offline mode.
 */

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useImageModels } from "@/hooks/queries"
import type { ImageModel } from "@/lib/schemas/pollinations.schema"

interface ModelSelectorProps {
    value: string
    onChange: (value: ImageModel) => void
    disabled?: boolean
}

/**
 * Capitalizes the first letter of a model name for display
 */
function formatModelName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1)
}

export function ModelSelector({
    value,
    onChange,
    disabled = false,
}: ModelSelectorProps) {
    const { models, isLoading, isError, getModel } = useImageModels()

    const currentModel = getModel(value)

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Label className="text-sm font-medium">Model</Label>
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="model-selector" className="text-sm font-medium">
                    Model
                </Label>
                {isError && (
                    <Badge variant="outline" className="text-xs">
                        Offline
                    </Badge>
                )}
            </div>
            <Select
                value={value}
                onValueChange={(v) => onChange(v as ImageModel)}
                disabled={disabled || models.length === 0}
            >
                <SelectTrigger
                    id="model-selector"
                    data-testid="model-selector"
                    className="w-full bg-background/50"
                >
                    <SelectValue>
                        <span className="font-medium text-sm">
                            {currentModel
                                ? formatModelName(currentModel.name)
                                : formatModelName(value)}
                        </span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {models.map((model) => (
                        <SelectItem
                            key={model.name}
                            value={model.name}
                            data-testid={`model-selector-item-${model.name}`}
                        >
                            <div className="flex flex-col items-start">
                                <span className="font-medium">
                                    {formatModelName(model.name)}
                                </span>
                                {model.description && (
                                    <span className="text-xs text-muted-foreground">
                                        {model.description}
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
