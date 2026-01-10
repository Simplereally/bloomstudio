"use client"

/**
 * SelectionContext - Isolated selection state for gallery performance
 * 
 * This context isolates selection state changes from parent components,
 * preventing unnecessary re-renders when selection changes. Only components
 * that consume this context will re-render on selection changes.
 * 
 * Performance benefits:
 * - Selection changes don't propagate to StudioClientShell
 * - Parent components don't re-render on checkbox toggles
 * - Uses refs internally to provide stable callbacks
 */

import * as React from "react"

export interface SelectionContextValue {
    // State
    selectionMode: boolean
    selectedIds: Set<string>
    
    // Actions
    toggleSelectionMode: () => void
    toggleSelection: (id: string) => void
    selectAll: (ids: string[]) => void
    deselectAll: () => void
    isSelected: (id: string) => boolean
    
    // Bulk action callbacks (provided by parent for actual operations)
    onDeleteSelected?: () => Promise<void>
    onMakeSelectedPublic?: () => Promise<void>
    onMakeSelectedPrivate?: () => Promise<void>
}

const SelectionContext = React.createContext<SelectionContextValue | null>(null)

export interface SelectionProviderProps {
    children: React.ReactNode
    onDeleteSelected?: () => Promise<void>
    onMakeSelectedPublic?: () => Promise<void>
    onMakeSelectedPrivate?: () => Promise<void>
}

/**
 * Provider for selection state - manages selection internally to avoid
 * propagating state changes to parent components.
 */
export function SelectionProvider({
    children,
    onDeleteSelected,
    onMakeSelectedPublic,
    onMakeSelectedPrivate,
}: SelectionProviderProps) {
    const [selectionMode, setSelectionMode] = React.useState(false)
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
    
    // Ref for stable callback access
    const selectedIdsRef = React.useRef(selectedIds)
    selectedIdsRef.current = selectedIds
    
    // Stable callbacks
    const toggleSelectionMode = React.useCallback(() => {
        setSelectionMode(prev => {
            // Clear selection when exiting selection mode
            if (prev) {
                setSelectedIds(new Set())
            }
            return !prev
        })
    }, [])
    
    const toggleSelection = React.useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])
    
    const selectAll = React.useCallback((ids: string[]) => {
        setSelectedIds(new Set(ids))
    }, [])
    
    const deselectAll = React.useCallback(() => {
        setSelectedIds(new Set())
    }, [])
    
    const isSelected = React.useCallback((id: string) => {
        return selectedIdsRef.current.has(id)
    }, [])
    
    // Memoize context value to prevent unnecessary re-renders
    const value = React.useMemo<SelectionContextValue>(() => ({
        selectionMode,
        selectedIds,
        toggleSelectionMode,
        toggleSelection,
        selectAll,
        deselectAll,
        isSelected,
        onDeleteSelected,
        onMakeSelectedPublic,
        onMakeSelectedPrivate,
    }), [
        selectionMode,
        selectedIds,
        toggleSelectionMode,
        toggleSelection,
        selectAll,
        deselectAll,
        isSelected,
        onDeleteSelected,
        onMakeSelectedPublic,
        onMakeSelectedPrivate,
    ])
    
    return (
        <SelectionContext.Provider value={value}>
            {children}
        </SelectionContext.Provider>
    )
}

/**
 * Hook to access selection context
 */
export function useSelection(): SelectionContextValue {
    const context = React.useContext(SelectionContext)
    if (!context) {
        throw new Error("useSelection must be used within a SelectionProvider")
    }
    return context
}

/**
 * Hook to access only the selection mode state (for components that only
 * need to know if selection mode is active, not the actual selections)
 */
export function useSelectionMode(): { selectionMode: boolean; toggleSelectionMode: () => void } {
    const { selectionMode, toggleSelectionMode } = useSelection()
    return { selectionMode, toggleSelectionMode }
}

/**
 * Hook to check if a specific item is selected (isolated re-render scope)
 */
export function useIsSelected(id: string): boolean {
    const { selectedIds } = useSelection()
    return selectedIds.has(id)
}