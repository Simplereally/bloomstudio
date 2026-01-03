/**
 * @vitest-environment jsdom
 * 
 * Tests for HistoryClient Component
 */
import { useImageHistoryWithDisplayData } from "@/hooks/queries/use-image-history"
import { useImageSelection } from "@/hooks/use-image-selection"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useUser } from "@clerk/nextjs"
import { act, render, screen } from "@testing-library/react"
import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HistoryClient } from "./history-client"

// Mock dependencies
vi.mock("@/components/gallery/history-filters", () => ({
    HistoryFiltersDropdown: vi.fn(() => <div data-testid="filters-dropdown" />),
    ActiveFilterBadges: vi.fn(() => <div data-testid="filter-badges" />),
}))

vi.mock("@/components/gallery/paginated-image-grid", () => ({
    PaginatedImageGrid: vi.fn(({ onSelectionChange }) => (
        <div data-testid="image-grid">
            <button onClick={() => onSelectionChange?.("img1", true)}>Toggle Selection</button>
        </div>
    )),
}))

vi.mock("@/components/gallery/selection-toolbar", () => ({
    SelectionToolbar: vi.fn(({ onSelectAll, onToggleSelectionMode }) => (
        <div data-testid="selection-toolbar">
            <button onClick={onSelectAll}>Select All</button>
            <button onClick={onToggleSelectionMode}>Toggle Mode</button>
        </div>
    )),
}))

vi.mock("@clerk/nextjs", () => ({
    useUser: vi.fn(),
}))

vi.mock("@/hooks/queries/use-image-history", () => ({
    useImageHistoryWithDisplayData: vi.fn(),
}))

vi.mock("@/hooks/use-image-selection", () => ({
    useImageSelection: vi.fn(),
}))

vi.mock("@/hooks/use-local-storage", () => ({
    useLocalStorage: vi.fn(),
}))

describe("HistoryClient", () => {
    const mockResults = [
        { _id: "img1" },
        { _id: "img2" },
    ]

    const mockSelection = {
        selectionMode: false,
        setSelectionMode: vi.fn(),
        selectedIds: new Set<string>(),
        toggleSelection: vi.fn(),
        selectAll: vi.fn(),
        deselectAll: vi.fn(),
        handleDeleteSelected: vi.fn(),
        handleSetSelectedVisibility: vi.fn(),
        isDeleting: false,
        isUpdatingVisibility: false,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useUser).mockReturnValue({ user: { id: "user1" } } as any)
        vi.mocked(useImageHistoryWithDisplayData).mockReturnValue({
            results: mockResults,
            status: "CanLoadMore",
            loadMore: vi.fn(),
        } as any)
        vi.mocked(useImageSelection).mockReturnValue(mockSelection as any)
        vi.mocked(useLocalStorage).mockReturnValue([{ selectedVisibility: [], selectedModels: [] }, vi.fn()] as any)
    })

    it("renders core components", () => {
        render(<HistoryClient />)
        expect(screen.getByTestId("filters-dropdown")).toBeInTheDocument()
        expect(screen.getByTestId("selection-toolbar")).toBeInTheDocument()
        expect(screen.getByTestId("image-grid")).toBeInTheDocument()
    })

    it("wires up selection handlers correctly", () => {
        render(<HistoryClient />)
        
        // Test toggle selection
        screen.getByRole("button", { name: /toggle selection/i }).click()
        expect(mockSelection.toggleSelection).toHaveBeenCalledWith("img1")

        // Test select all
        screen.getByRole("button", { name: /select all/i }).click()
        expect(mockSelection.selectAll).toHaveBeenCalledWith([
            { _id: "img1" },
            { _id: "img2" },
        ])

        // Test toggle mode
        screen.getByRole("button", { name: /toggle mode/i }).click()
        expect(mockSelection.setSelectionMode).toHaveBeenCalled()
    })

    it("exits selection mode when filters change", () => {
        let setFilterState: any
        vi.mocked(useLocalStorage).mockImplementation((_key, _initial) => {
            const [state, setState] = React.useState({ selectedVisibility: [], selectedModels: [] })
            setFilterState = setState
            return [state, setState] as any
        })

        vi.mocked(useImageSelection).mockReturnValue({
            ...mockSelection,
            selectionMode: true,
        } as any)

        render(<HistoryClient />)

        act(() => {
            setFilterState({ selectedVisibility: ["public"], selectedModels: [] })
        })

        expect(mockSelection.setSelectionMode).toHaveBeenCalledWith(false)
        expect(mockSelection.deselectAll).toHaveBeenCalled()
    })
})
