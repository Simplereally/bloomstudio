/**
 * @vitest-environment jsdom
 *
 * @fileoverview Tests for HistoryClient component.
 * 
 * Tests cover:
 * - Core component rendering
 * - Selection handler wiring
 * - Filter change behavior (exits selection mode)
 */
import { useImageSelection } from "@/hooks/use-image-selection"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { loadMyHistoryWithDisplayPage } from "@/app/_server/actions/history"
import { useUser } from "@clerk/nextjs"
import { act, render, screen, waitFor } from "@testing-library/react"
import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HistoryClient } from "./history-client"
import type { Id } from "@/convex/_generated/dataModel"

type HistoryPageResult = Awaited<ReturnType<typeof loadMyHistoryWithDisplayPage>>
type DisplayImage = HistoryPageResult["page"][number]

interface FilterState {
    selectedVisibility: string[]
    selectedModels: string[]
}

function createGeneratedImageId(value: string): Id<"generatedImages"> {
    return value as unknown as Id<"generatedImages">
}

function makeDisplayImage(id: string): DisplayImage {
    return {
        _id: createGeneratedImageId(id),
        _creationTime: Date.now(),
        url: "https://example.com/test.jpg",
        visibility: "public",
        createdAt: Date.now(),
        model: "test-model",
        prompt: "test prompt",
        width: 1024,
        height: 1024,
        seed: 123,
        contentType: "image/jpeg",
    }
}

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

vi.mock("@/app/_server/actions/history", () => ({
    loadMyHistoryWithDisplayPage: vi.fn(() =>
        Promise.resolve({
            page: [],
            continueCursor: "",
            isDone: true,
        })
    ),
}))

vi.mock("@/hooks/use-image-selection", () => ({
    useImageSelection: vi.fn(),
}))

vi.mock("@/hooks/use-local-storage", () => ({
    useLocalStorage: vi.fn(),
}))

describe("HistoryClient", () => {
    /** Mock initial page data simulating server-side cached response */
    const mockInitialPage: HistoryPageResult = {
        page: [
            makeDisplayImage("img1"),
            makeDisplayImage("img2"),
        ],
        continueCursor: "cursor123",
        isDone: false,
    }

    /** Mock selection hook return value */
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
        vi.mocked(useImageSelection).mockReturnValue(mockSelection as any)
        vi.mocked(useLocalStorage).mockReturnValue([
            { selectedVisibility: [], selectedModels: [] },
            vi.fn(),
        ] as any)
    })

    describe("rendering", () => {
        it("renders core components", () => {
            render(<HistoryClient initialPage={mockInitialPage} />)
            
            expect(screen.getByTestId("filters-dropdown")).toBeInTheDocument()
            expect(screen.getByTestId("selection-toolbar")).toBeInTheDocument()
            expect(screen.getByTestId("image-grid")).toBeInTheDocument()
        })

        it("passes onOptimisticDelete to useImageSelection", () => {
            render(<HistoryClient initialPage={mockInitialPage} />)
            
            // Verify useImageSelection was called with options containing onOptimisticDelete
            expect(useImageSelection).toHaveBeenCalledWith(
                expect.objectContaining({
                    onOptimisticDelete: expect.any(Function),
                })
            )
        })
    })

    describe("selection handlers", () => {
        it("wires up toggle selection correctly", () => {
            render(<HistoryClient initialPage={mockInitialPage} />)

            screen.getByRole("button", { name: /toggle selection/i }).click()
            
            expect(mockSelection.toggleSelection).toHaveBeenCalledWith("img1")
        })

        it("wires up select all correctly", () => {
            render(<HistoryClient initialPage={mockInitialPage} />)

            screen.getByRole("button", { name: /select all/i }).click()
            
            expect(mockSelection.selectAll).toHaveBeenCalledWith([
                { _id: createGeneratedImageId("img1") },
                { _id: createGeneratedImageId("img2") },
            ])
        })

        it("wires up toggle mode correctly", () => {
            render(<HistoryClient initialPage={mockInitialPage} />)

            screen.getByRole("button", { name: /toggle mode/i }).click()
            
            expect(mockSelection.setSelectionMode).toHaveBeenCalled()
        })
    })

    describe("filter changes", () => {
        it("exits selection mode when filters change", async () => {
            // Track the setState function so we can trigger filter changes
            let setFilterState: React.Dispatch<React.SetStateAction<FilterState>>
            
            vi.mocked(useLocalStorage).mockImplementation((_key, initial) => {
                const [state, setState] = React.useState(initial as FilterState)
                setFilterState = setState
                return [state, setState] as any
            })

            vi.mocked(useImageSelection).mockReturnValue({
                ...mockSelection,
                selectionMode: true,
            } as any)

            // Mock the server action to resolve immediately
            vi.mocked(loadMyHistoryWithDisplayPage).mockResolvedValue({
                page: [],
                continueCursor: "",
                isDone: true,
            })

            render(<HistoryClient initialPage={mockInitialPage} />)

            // Change filters - this triggers the useEffect
            await act(async () => {
                setFilterState!({ selectedVisibility: ["public"], selectedModels: [] })
            })

            // Wait for the async effect to complete
            await waitFor(() => {
                expect(mockSelection.setSelectionMode).toHaveBeenCalledWith(false)
                expect(mockSelection.deselectAll).toHaveBeenCalled()
            })
        })

        it("fetches new data when filters change", async () => {
            let setFilterState: React.Dispatch<React.SetStateAction<FilterState>>
            
            vi.mocked(useLocalStorage).mockImplementation((_key, initial) => {
                const [state, setState] = React.useState(initial as FilterState)
                setFilterState = setState
                return [state, setState] as any
            })

            vi.mocked(loadMyHistoryWithDisplayPage).mockResolvedValue({
                page: [makeDisplayImage("filtered1")],
                continueCursor: "",
                isDone: true,
            })

            render(<HistoryClient initialPage={mockInitialPage} />)

            await act(async () => {
                setFilterState!({ selectedVisibility: ["public"], selectedModels: [] })
            })

            await waitFor(() => {
                expect(loadMyHistoryWithDisplayPage).toHaveBeenCalledWith({
                    cursor: null,
                    filters: { visibility: "public", models: undefined },
                })
            })
        })
    })

    describe("optimistic delete", () => {
        it("provides working optimistic delete callback", async () => {
            let capturedCallback: ((ids: string[]) => (() => void) | void) | undefined
            
            vi.mocked(useImageSelection).mockImplementation((options) => {
                capturedCallback = options?.onOptimisticDelete
                return mockSelection as any
            })

            render(<HistoryClient initialPage={mockInitialPage} />)

            // The callback should be defined
            expect(capturedCallback).toBeDefined()

            // Call it within act since it updates component state
            let rollback: (() => void) | void = undefined
            await act(async () => {
                rollback = capturedCallback!(["img1"])
            })
            
            expect(typeof rollback).toBe("function")
        })
    })
})
