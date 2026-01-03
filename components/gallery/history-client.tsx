"use client"

import {
    ActiveFilterBadges,
    HistoryFiltersDropdown,
    type HistoryFilterState,
} from "@/components/gallery/history-filters"
import { PaginatedImageGrid } from "@/components/gallery/paginated-image-grid"
import { SelectionToolbar } from "@/components/gallery/selection-toolbar"
import { Button } from "@/components/ui/button"
import { useImageHistoryWithDisplayData, type HistoryFilters } from "@/hooks/queries/use-image-history"
import { useImageSelection } from "@/hooks/use-image-selection"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useUser } from "@clerk/nextjs"
import { ImageOffIcon } from "lucide-react"
import Link from "next/link"
import * as React from "react"

const INITIAL_FILTER_STATE: HistoryFilterState = {
    selectedVisibility: [],
    selectedModels: [],
}

/**
 * Client component for the dedicated history page.
 * Displays the current user's generated images with pagination and filtering.
 */
export function HistoryClient() {
    const { user } = useUser()

    // Determine storage key based on user ID for account-specific preferences
    const storageKey = React.useMemo(() => 
        user?.id ? `bloom:history-filters:${user.id}` : "bloom:history-filters:anon",
    [user?.id])

    // Filter state persisted to localStorage
    const [filterState, setFilterState] = useLocalStorage<HistoryFilterState>(storageKey, INITIAL_FILTER_STATE)

    // Selection state and handlers
    const {
        selectionMode,
        setSelectionMode,
        selectedIds,
        toggleSelection,
        selectAll,
        deselectAll,
        handleDeleteSelected,
        handleSetSelectedVisibility,
        isDeleting,
        isUpdatingVisibility,
    } = useImageSelection()

    // Convert filter state to query parameters
    const queryFilters: HistoryFilters = React.useMemo(() => ({
        // Only pass visibility if exactly one is selected (filtering for one type)
        // If both or none are selected, show all (no filter)
        visibility: filterState.selectedVisibility.length === 1 
            ? filterState.selectedVisibility[0] 
            : undefined,
        models: filterState.selectedModels.length > 0 ? filterState.selectedModels : undefined,
    }), [filterState])

    const { results, status, loadMore } = useImageHistoryWithDisplayData(queryFilters)

    const hasActiveFilters = filterState.selectedVisibility.length > 0 || filterState.selectedModels.length > 0

    // Determine empty state based on filter status
    const isExhausted = status === "Exhausted"
    
    // Only show "no matching" when done loading and actually empty
    const showFilteredEmpty = hasActiveFilters && isExhausted && results.length === 0
    const showAbsoluteEmpty = !hasActiveFilters && isExhausted && results.length === 0

    // Handle selection change from ImageCard
    const handleSelectionChange = React.useCallback((id: string, _selected: boolean) => {
        toggleSelection(id)
    }, [toggleSelection])

    // Handle select all with current results
    const handleSelectAll = React.useCallback(() => {
        selectAll(results.map((r) => ({ _id: r._id } as { _id: string })))
    }, [selectAll, results])

    // Exit selection mode and clear selection when filters change
    React.useEffect(() => {
        if (selectionMode) {
            setSelectionMode(false)
            deselectAll()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterState])

    return (
        <div className="space-y-4">
            {/* Filter Controls and Selection Toolbar */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <HistoryFiltersDropdown
                            filters={filterState}
                            onFiltersChange={setFilterState}
                        />
                        {hasActiveFilters && (
                            <span className="text-sm text-muted-foreground">
                                Showing filtered results
                            </span>
                        )}
                    </div>
                    
                    {/* Selection Toolbar */}
                    <SelectionToolbar
                        selectionMode={selectionMode}
                        onToggleSelectionMode={() => setSelectionMode((prev) => !prev)}
                        selectedCount={selectedIds.size}
                        totalCount={results.length}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={deselectAll}
                        onDeleteSelected={handleDeleteSelected}
                        onSetVisibility={handleSetSelectedVisibility}
                        isDeleting={isDeleting}
                        isUpdatingVisibility={isUpdatingVisibility}
                    />
                </div>
                <ActiveFilterBadges
                    filters={filterState}
                    onFiltersChange={setFilterState}
                />
            </div>

            {/* Image Grid */}
            <PaginatedImageGrid
                images={results}
                status={status}
                loadMore={loadMore}
                showUser={false}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
                emptyState={
                    showFilteredEmpty ? (
                        <FilteredEmptyState 
                            onClearFilters={() => setFilterState({ 
                                selectedVisibility: [], 
                                selectedModels: [] 
                            })} 
                        />
                    ) : showAbsoluteEmpty ? (
                        <HistoryEmptyState />
                    ) : null
                }
            />
        </div>
    )
}

function HistoryEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="bg-primary/5 rounded-full p-8 mb-6 border border-primary/10">
                <ImageOffIcon className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No images yet</h3>
            <p className="text-muted-foreground max-w-sm">
                Head to the Studio to create your first masterpiece!
            </p>
            <Link href="/studio">
                <Button className="mt-8 rounded-full px-8">Go to Studio</Button>
            </Link>
        </div>
    )
}

function FilteredEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="bg-primary/5 rounded-full p-8 mb-6 border border-primary/10">
                <ImageOffIcon className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No matching images</h3>
            <p className="text-muted-foreground max-w-sm">
                No images match your current filter criteria.
            </p>
            <Button
                variant="outline"
                className="mt-8 rounded-full px-8"
                onClick={onClearFilters}
            >
                Clear filters
            </Button>
        </div>
    )
}

