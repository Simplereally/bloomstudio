"use client"

import {
    ActiveFilterBadges,
    HistoryFiltersDropdown,
    type HistoryFilterState,
} from "@/components/gallery/history-filters"
import { PaginatedImageGrid } from "@/components/gallery/paginated-image-grid"
import { SelectionToolbar } from "@/components/gallery/selection-toolbar"
import { Button } from "@/components/ui/button"
import { loadMyHistoryWithDisplayPage } from "@/app/_server/actions/history"
import { useImageSelection } from "@/hooks/use-image-selection"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useUser } from "@clerk/nextjs"
import { ImageOffIcon } from "lucide-react"
import Link from "next/link"
import * as React from "react"

// Type for the paginated result from the cached query/server action
type PaginatedHistoryResult = Awaited<ReturnType<typeof loadMyHistoryWithDisplayPage>>

const INITIAL_FILTER_STATE: HistoryFilterState = {
    selectedVisibility: [],
    selectedModels: [],
}

interface HistoryClientProps {
    /** Server-provided initial page (from cache) */
    initialPage: PaginatedHistoryResult
}

/**
 * Client component for the dedicated history page.
 * Displays the current user's generated images with pagination and filtering.
 *
 * Uses server-side caching:
 * - Initial page is provided by the server (cached)
 * - "Load more" fetches via server action (also cached)
 * - Filter changes reset pagination and fetch new filtered data
 */
export function HistoryClient({ initialPage }: HistoryClientProps) {
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

    // Pagination state managed locally (server action pattern)
    const [items, setItems] = React.useState(() => initialPage.page)
    const [cursor, setCursor] = React.useState(() => initialPage.continueCursor)
    const [isDone, setIsDone] = React.useState(() => initialPage.isDone)
    const [isLoadingMore, setIsLoadingMore] = React.useState(false)
    const [isLoadingFilters, setIsLoadingFilters] = React.useState(false)

    // Track the current filter key to detect changes
    const currentFilterKey = React.useMemo(() => {
        const v = filterState.selectedVisibility.length === 1
            ? filterState.selectedVisibility[0]
            : undefined
        const m = filterState.selectedModels.length > 0 ? filterState.selectedModels : undefined
        return JSON.stringify({ v, m })
    }, [filterState])

    const prevFilterKeyRef = React.useRef(currentFilterKey)

    // Convert filter state to query parameters
    const queryFilters = React.useMemo(() => ({
        visibility: filterState.selectedVisibility.length === 1
            ? filterState.selectedVisibility[0]
            : undefined,
        models: filterState.selectedModels.length > 0 ? filterState.selectedModels : undefined,
    }), [filterState])

    // Load more handler using server action
    const loadMore = React.useCallback(async () => {
        if (isDone || isLoadingMore || !cursor) return

        setIsLoadingMore(true)
        try {
            const result = await loadMyHistoryWithDisplayPage({
                cursor,
                filters: queryFilters,
            })
            setItems(prev => [...prev, ...result.page])
            setCursor(result.continueCursor)
            setIsDone(result.isDone)
        } catch (error) {
            console.error("Failed to load more:", error)
        } finally {
            setIsLoadingMore(false)
        }
    }, [cursor, isDone, isLoadingMore, queryFilters])

    // When filters change, reset pagination and fetch new data
    React.useEffect(() => {
        // Skip the initial mount
        if (prevFilterKeyRef.current === currentFilterKey) return
        prevFilterKeyRef.current = currentFilterKey

        // Check if filters are now empty (reset to initial state)
        const hasFilters = filterState.selectedVisibility.length > 0 || filterState.selectedModels.length > 0

        async function fetchFiltered() {
            setIsLoadingFilters(true)
            try {
                const result = await loadMyHistoryWithDisplayPage({
                    cursor: null, // Start from the beginning
                    filters: hasFilters ? queryFilters : undefined,
                })
                setItems(result.page)
                setCursor(result.continueCursor)
                setIsDone(result.isDone)
            } catch (error) {
                console.error("Failed to fetch filtered history:", error)
            } finally {
                setIsLoadingFilters(false)
            }
        }

        void fetchFiltered()

        // Exit selection mode and clear selection when filters change
        if (selectionMode) {
            setSelectionMode(false)
            deselectAll()
        }
    }, [currentFilterKey, filterState, queryFilters, selectionMode, setSelectionMode, deselectAll])

    const hasActiveFilters = filterState.selectedVisibility.length > 0 || filterState.selectedModels.length > 0

    // Compute status compatible with PaginatedImageGrid
    const status = isLoadingFilters
        ? "LoadingFirstPage"
        : (isDone ? "Exhausted" : isLoadingMore ? "LoadingMore" : "CanLoadMore")

    // Determine empty state based on filter status
    const isExhausted = status === "Exhausted"

    // Only show "no matching" when done loading and actually empty
    const showFilteredEmpty = hasActiveFilters && isExhausted && items.length === 0
    const showAbsoluteEmpty = !hasActiveFilters && isExhausted && items.length === 0

    // Handle selection change from ImageCard
    const handleSelectionChange = React.useCallback((id: string, _selected: boolean) => {
        toggleSelection(id)
    }, [toggleSelection])

    // Handle select all with current results
    const handleSelectAll = React.useCallback(() => {
        selectAll(items.map((r) => ({ _id: r._id } as { _id: string })))
    }, [selectAll, items])

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
                        totalCount={items.length}
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
                images={items}
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

