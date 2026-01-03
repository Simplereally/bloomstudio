"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ImageVisibility } from "@/hooks/mutations/use-set-visibility"
import { cn } from "@/lib/utils"
import { CheckSquare, Eye, EyeOff, Loader2, MoreHorizontal, Square, Trash2 } from "lucide-react"
import * as React from "react"

interface SelectionToolbarProps {
    /** Whether selection mode is active */
    selectionMode: boolean
    /** Toggle selection mode on/off */
    onToggleSelectionMode: () => void
    /** Number of selected items */
    selectedCount: number
    /** Total number of items */
    totalCount: number
    /** Select all items */
    onSelectAll: () => void
    /** Deselect all items */
    onDeselectAll: () => void
    /** Delete selected items */
    onDeleteSelected: () => void
    /** Change visibility of selected items */
    onSetVisibility?: (visibility: ImageVisibility) => void
    /** Whether a delete operation is in progress */
    isDeleting?: boolean
    /** Whether a visibility update is in progress */
    isUpdatingVisibility?: boolean
    /** Additional class names */
    className?: string
}

/**
 * A toolbar component for managing bulk selection and actions on images.
 * Can be used in history, favorites, or any list view with selectable items.
 */
export function SelectionToolbar({
    selectionMode,
    onToggleSelectionMode,
    selectedCount,
    totalCount,
    onSelectAll,
    onDeselectAll,
    onDeleteSelected,
    onSetVisibility,
    isDeleting = false,
    isUpdatingVisibility = false,
    className,
}: SelectionToolbarProps) {
    const isAllSelected = totalCount > 0 && selectedCount === totalCount
    const hasSelection = selectedCount > 0
    const isLoading = isDeleting || isUpdatingVisibility

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {selectionMode ? (
                <>
                    {/* Select All / None button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={isAllSelected ? onDeselectAll : onSelectAll}
                        disabled={totalCount === 0 || isLoading}
                    >
                        {isAllSelected ? (
                            <>
                                <Square className="h-3.5 w-3.5 mr-1.5" />
                                Deselect All
                            </>
                        ) : (
                            <>
                                <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                                Select All
                            </>
                        )}
                    </Button>

                    {/* Actions dropdown - only show when items are selected */}
                    {hasSelection && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                        <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    Actions ({selectedCount})
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {onSetVisibility && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => onSetVisibility("public")}
                                            disabled={isLoading}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Make Public
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onSetVisibility("unlisted")}
                                            disabled={isLoading}
                                        >
                                            <EyeOff className="h-4 w-4 mr-2" />
                                            Make Private
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                <DropdownMenuItem
                                    onClick={onDeleteSelected}
                                    disabled={isLoading}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Selected
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Done button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={onToggleSelectionMode}
                        disabled={isLoading}
                    >
                        Done
                    </Button>
                </>
            ) : (
                /* Select button - enter selection mode */
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={onToggleSelectionMode}
                    disabled={totalCount === 0}
                >
                    <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                    Select
                </Button>
            )}
        </div>
    )
}
