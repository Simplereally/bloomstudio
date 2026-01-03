"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { MODEL_REGISTRY, type ModelDefinition } from "@/lib/config/models"
import { cn } from "@/lib/utils"
import { Filter, X } from "lucide-react"
import * as React from "react"

/** Visibility filter options */
export type VisibilityFilter = "public" | "unlisted"

/** Filter state for history */
export interface HistoryFilterState {
    /** Selected visibility options (empty = show all) */
    selectedVisibility: VisibilityFilter[]
    /** Selected model IDs */
    selectedModels: string[]
}

interface HistoryFiltersProps {
    /** Current filter state */
    filters: HistoryFilterState
    /** Callback when filters change */
    onFiltersChange: (filters: HistoryFilterState) => void
}

// Get all image models from the registry (exclude video models)
const IMAGE_MODELS: ModelDefinition[] = Object.values(MODEL_REGISTRY).filter(
    (model): model is ModelDefinition => model.type === "image"
)

/**
 * Legacy models that are no longer available for generation but may exist in user history.
 * These are shown separately in the filter dropdown so users can still filter by them.
 */
const LEGACY_FILTER_MODELS: { id: string; displayName: string }[] = [
    { id: "flux", displayName: "Flux (Legacy)" },
]

/** Combined list of all filterable models (active + legacy) */
const ALL_FILTERABLE_MODELS = [
    ...IMAGE_MODELS.map(m => ({ id: m.id, displayName: m.displayName, isLegacy: false })),
    ...LEGACY_FILTER_MODELS.map(m => ({ ...m, isLegacy: true })),
]

// Visibility options with labels
const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
    { value: "unlisted", label: "Private" },
    { value: "public", label: "Public" },
]

/**
 * Multi-select filter dropdown for filtering image history.
 * Allows filtering by visibility (private/public) and by specific generation models.
 */
export function HistoryFiltersDropdown({ filters, onFiltersChange }: HistoryFiltersProps) {
    const [open, setOpen] = React.useState(false)

    // Buffer state changes internally while the popover is open
    // This prevents triggering a backend fetch on every single checkbox toggle
    const [pendingFilters, setPendingFilters] = React.useState<HistoryFilterState>(filters)

    // Sync pending filters when the prop changes (e.g. cleared externally)
    React.useEffect(() => {
        if (!open) {
            setPendingFilters(filters)
        }
    }, [filters, open])

    // When popover closes, commit the pending changes
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            // Only fire the callback if something actually changed
            if (JSON.stringify(pendingFilters) !== JSON.stringify(filters)) {
                onFiltersChange(pendingFilters)
            }
        } else {
            // Reset pending state to current real state when opening
            setPendingFilters(filters)
        }
    }

    const activeFilterCount =
        filters.selectedVisibility.length + filters.selectedModels.length

    const handleVisibilityToggle = (visibility: VisibilityFilter) => {
        const isSelected = pendingFilters.selectedVisibility.includes(visibility)
        const newVisibility = isSelected
            ? pendingFilters.selectedVisibility.filter((v) => v !== visibility)
            : [...pendingFilters.selectedVisibility, visibility]

        setPendingFilters({
            ...pendingFilters,
            selectedVisibility: newVisibility,
        })
    }

    const handleModelToggle = (modelId: string) => {
        const isSelected = pendingFilters.selectedModels.includes(modelId)
        const newModels = isSelected
            ? pendingFilters.selectedModels.filter((id) => id !== modelId)
            : [...pendingFilters.selectedModels, modelId]

        setPendingFilters({
            ...pendingFilters,
            selectedModels: newModels,
        })
    }

    const handleClearFilters = () => {
        setPendingFilters({
            selectedVisibility: [],
            selectedModels: [],
        })
    }

    const handleSelectAllModels = () => {
        setPendingFilters({
            ...pendingFilters,
            selectedModels: ALL_FILTERABLE_MODELS.map((m) => m.id),
        })
    }

    const handleClearModels = () => {
        setPendingFilters({
            ...pendingFilters,
            selectedModels: [],
        })
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 gap-2 border-dashed",
                        activeFilterCount > 0 && "border-primary/50 bg-primary/5"
                    )}
                >
                    <Filter className="h-3.5 w-3.5" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-1 h-5 px-1.5 text-xs font-normal"
                        >
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search filters..." />
                    <CommandList>
                        <CommandEmpty>No filters found.</CommandEmpty>

                        {/* Visibility Section */}
                        <CommandGroup heading="Visibility">
                            {VISIBILITY_OPTIONS.map((option) => {
                                const isSelected = pendingFilters.selectedVisibility.includes(option.value)
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => handleVisibilityToggle(option.value)}
                                        className="gap-2"
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            className="pointer-events-none"
                                        />
                                        <span>{option.label}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>

                        <CommandSeparator />

                        {/* Models Section */}
                        <CommandGroup heading="Models">
                            {/* Quick actions for models */}
                            <div className="flex items-center gap-1 px-2 py-1.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleSelectAllModels()
                                    }}
                                >
                                    Select all
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleClearModels()
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>

                            {ALL_FILTERABLE_MODELS.map((model) => {
                                const isSelected = pendingFilters.selectedModels.includes(model.id)
                                return (
                                    <CommandItem
                                        key={model.id}
                                        onSelect={() => handleModelToggle(model.id)}
                                        className={cn("gap-2", model.isLegacy && "opacity-60")}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            className="pointer-events-none"
                                        />
                                        <span>{model.displayName}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>

                    {/* Clear all footer */}
                    {(pendingFilters.selectedVisibility.length > 0 || pendingFilters.selectedModels.length > 0) && (
                        <>
                            <CommandSeparator />
                            <div className="p-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
                                    onClick={handleClearFilters}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear all filters
                                </Button>
                            </div>
                        </>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    )
}

/**
 * Display active filters as removable badges
 */
export function ActiveFilterBadges({
    filters,
    onFiltersChange,
}: HistoryFiltersProps) {
    if (filters.selectedVisibility.length === 0 && filters.selectedModels.length === 0) {
        return null
    }

    const handleRemoveVisibility = (visibility: VisibilityFilter) => {
        onFiltersChange({
            ...filters,
            selectedVisibility: filters.selectedVisibility.filter((v) => v !== visibility),
        })
    }

    const handleRemoveModel = (modelId: string) => {
        onFiltersChange({
            ...filters,
            selectedModels: filters.selectedModels.filter((id) => id !== modelId),
        })
    }

    // Get the display label for a visibility option
    const getVisibilityLabel = (visibility: VisibilityFilter) => {
        return VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label || visibility
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {filters.selectedVisibility.map((visibility) => (
                <Badge
                    key={visibility}
                    variant="secondary"
                    className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleRemoveVisibility(visibility)}
                >
                    {getVisibilityLabel(visibility)}
                    <X className="h-3 w-3" />
                </Badge>
            ))}
            {filters.selectedModels.map((modelId) => {
                const model = ALL_FILTERABLE_MODELS.find(m => m.id === modelId)
                return (
                    <Badge
                        key={modelId}
                        variant="secondary"
                        className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                        onClick={() => handleRemoveModel(modelId)}
                    >
                        {model?.displayName || modelId}
                        <X className="h-3 w-3" />
                    </Badge>
                )
            })}
        </div>
    )
}
