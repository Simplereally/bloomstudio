/**
 * @vitest-environment jsdom
 * 
 * @fileoverview Tests for useImageSelection hook.
 * 
 * Tests cover:
 * - Initial state and basic selection operations
 * - Bulk delete with and without optimistic updates
 * - Rollback behavior on delete failure
 * - Bulk visibility changes
 * - Loading state reflection
 */
import { useBulkDeleteGeneratedImages } from "@/hooks/mutations/use-delete-image"
import { useSetBulkVisibility } from "@/hooks/mutations/use-set-visibility"
import { act, renderHook } from "@testing-library/react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useImageSelection, type SelectableImage } from "./use-image-selection"

// Mock mutations
vi.mock("@/hooks/mutations/use-delete-image", () => ({
    useBulkDeleteGeneratedImages: vi.fn(),
}))

vi.mock("@/hooks/mutations/use-set-visibility", () => ({
    useSetBulkVisibility: vi.fn(),
}))

// Mock toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

describe("useImageSelection", () => {
    const mockDeleteMutateAsync = vi.fn()
    const mockVisibilityMutateAsync = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        
        vi.mocked(useBulkDeleteGeneratedImages).mockReturnValue({
            mutateAsync: mockDeleteMutateAsync,
            isPending: false,
        } as unknown as ReturnType<typeof useBulkDeleteGeneratedImages>)

        vi.mocked(useSetBulkVisibility).mockReturnValue({
            mutateAsync: mockVisibilityMutateAsync,
            isPending: false,
        } as unknown as ReturnType<typeof useSetBulkVisibility>)
    })

    describe("initialization", () => {
        it("initializes with default state", () => {
            const { result } = renderHook(() => useImageSelection())
            
            expect(result.current.selectionMode).toBe(false)
            expect(result.current.selectedIds.size).toBe(0)
            expect(result.current.isDeleting).toBe(false)
            expect(result.current.isUpdatingVisibility).toBe(false)
        })

        it("accepts options parameter without error", () => {
            const onOptimisticDelete = vi.fn()
            const { result } = renderHook(() => useImageSelection({ onOptimisticDelete }))
            
            expect(result.current.selectionMode).toBe(false)
        })
    })

    describe("selection operations", () => {
        it("toggles selection on and off", () => {
            const { result } = renderHook(() => useImageSelection())
            
            // Toggle on
            act(() => {
                result.current.toggleSelection("img1")
            })
            expect(result.current.selectedIds.has("img1")).toBe(true)
            expect(result.current.selectedIds.size).toBe(1)
            expect(result.current.isSelected("img1")).toBe(true)

            // Toggle off
            act(() => {
                result.current.toggleSelection("img1")
            })
            expect(result.current.selectedIds.has("img1")).toBe(false)
            expect(result.current.selectedIds.size).toBe(0)
        })

        it("selects multiple images independently", () => {
            const { result } = renderHook(() => useImageSelection())
            
            act(() => {
                result.current.toggleSelection("img1")
                result.current.toggleSelection("img2")
            })
            
            expect(result.current.selectedIds.size).toBe(2)
            expect(result.current.isSelected("img1")).toBe(true)
            expect(result.current.isSelected("img2")).toBe(true)
        })

        it("selects all provided images", () => {
            const { result } = renderHook(() => useImageSelection())
            const images: SelectableImage[] = [
                { _id: "img1" },
                { _id: "img2" },
                { _id: "img3" },
            ]

            act(() => {
                result.current.selectAll(images)
            })

            expect(result.current.selectedIds.size).toBe(3)
            expect(result.current.isSelected("img1")).toBe(true)
            expect(result.current.isSelected("img2")).toBe(true)
            expect(result.current.isSelected("img3")).toBe(true)
        })

        it("deselects all images", () => {
            const { result } = renderHook(() => useImageSelection())
            
            act(() => {
                result.current.toggleSelection("img1")
                result.current.toggleSelection("img2")
            })
            expect(result.current.selectedIds.size).toBe(2)

            act(() => {
                result.current.deselectAll()
            })
            expect(result.current.selectedIds.size).toBe(0)
        })

        it("replaces selection when selectAll is called", () => {
            const { result } = renderHook(() => useImageSelection())
            
            // First selection
            act(() => {
                result.current.selectAll([{ _id: "img1" }, { _id: "img2" }])
            })
            expect(result.current.selectedIds.size).toBe(2)

            // Replace with new selection
            act(() => {
                result.current.selectAll([{ _id: "img3" }])
            })
            expect(result.current.selectedIds.size).toBe(1)
            expect(result.current.isSelected("img3")).toBe(true)
            expect(result.current.isSelected("img1")).toBe(false)
        })
    })

    describe("handleDeleteSelected", () => {
        it("deletes selected images and resets state", async () => {
            const { result } = renderHook(() => useImageSelection())
            
            act(() => {
                result.current.toggleSelection("img1")
                result.current.toggleSelection("img2")
                result.current.setSelectionMode(true)
            })

            mockDeleteMutateAsync.mockResolvedValue({})

            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            expect(mockDeleteMutateAsync).toHaveBeenCalledTimes(1)
            expect(mockDeleteMutateAsync).toHaveBeenCalledWith(["img1", "img2"])
            expect(result.current.selectedIds.size).toBe(0)
            expect(result.current.selectionMode).toBe(false)
        })

        it("does nothing when no images are selected", async () => {
            const { result } = renderHook(() => useImageSelection())
            
            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            expect(mockDeleteMutateAsync).not.toHaveBeenCalled()
        })

        it("clears selection before mutation completes (optimistic)", async () => {
            const { result } = renderHook(() => useImageSelection())
            
            // Create a promise we can control
            let resolveDelete: () => void
            const deletePromise = new Promise<void>((resolve) => {
                resolveDelete = resolve
            })
            mockDeleteMutateAsync.mockReturnValue(deletePromise)

            act(() => {
                result.current.toggleSelection("img1")
                result.current.setSelectionMode(true)
            })

            // Start delete but don't await
            let deletePromiseResult: Promise<void>
            act(() => {
                deletePromiseResult = result.current.handleDeleteSelected()
            })

            // Selection should be cleared immediately
            expect(result.current.selectedIds.size).toBe(0)
            expect(result.current.selectionMode).toBe(false)

            // Complete the mutation
            await act(async () => {
                resolveDelete!()
                await deletePromiseResult
            })
        })
    })

    describe("optimistic delete callback", () => {
        it("calls onOptimisticDelete before mutation", async () => {
            const onOptimisticDelete = vi.fn()
            const { result } = renderHook(() => useImageSelection({ onOptimisticDelete }))
            
            act(() => {
                result.current.toggleSelection("img1")
                result.current.toggleSelection("img2")
            })

            mockDeleteMutateAsync.mockResolvedValue({})

            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            expect(onOptimisticDelete).toHaveBeenCalledWith(["img1", "img2"])
            expect(onOptimisticDelete.mock.invocationCallOrder[0])
                .toBeLessThan(mockDeleteMutateAsync.mock.invocationCallOrder[0])
        })

        it("calls rollback function when deletion fails", async () => {
            const rollback = vi.fn()
            const onOptimisticDelete = vi.fn(() => rollback)
            const { result } = renderHook(() => useImageSelection({ onOptimisticDelete }))
            
            act(() => {
                result.current.toggleSelection("img1")
            })

            mockDeleteMutateAsync.mockRejectedValue(new Error("Delete failed"))

            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            expect(onOptimisticDelete).toHaveBeenCalledWith(["img1"])
            expect(rollback).toHaveBeenCalledTimes(1)
        })

        it("handles onOptimisticDelete returning undefined gracefully", async () => {
            const onOptimisticDelete = vi.fn(() => undefined)
            const { result } = renderHook(() => useImageSelection({ onOptimisticDelete }))
            
            act(() => {
                result.current.toggleSelection("img1")
            })

            mockDeleteMutateAsync.mockRejectedValue(new Error("Delete failed"))

            // Should not throw
            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            expect(onOptimisticDelete).toHaveBeenCalled()
        })

        it("does not call rollback on successful deletion", async () => {
            const rollback = vi.fn()
            const onOptimisticDelete = vi.fn(() => rollback)
            const { result } = renderHook(() => useImageSelection({ onOptimisticDelete }))
            
            act(() => {
                result.current.toggleSelection("img1")
            })

            mockDeleteMutateAsync.mockResolvedValue({})

            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            expect(onOptimisticDelete).toHaveBeenCalled()
            expect(rollback).not.toHaveBeenCalled()
        })

        it("uses latest onOptimisticDelete callback via ref", async () => {
            const firstCallback = vi.fn()
            const secondCallback = vi.fn()
            
            const { result, rerender } = renderHook(
                ({ callback }) => useImageSelection({ onOptimisticDelete: callback }),
                { initialProps: { callback: firstCallback } }
            )
            
            // Update the callback
            rerender({ callback: secondCallback })
            
            act(() => {
                result.current.toggleSelection("img1")
            })

            mockDeleteMutateAsync.mockResolvedValue({})

            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            // Should use the updated callback
            expect(firstCallback).not.toHaveBeenCalled()
            expect(secondCallback).toHaveBeenCalledWith(["img1"])
        })
    })

    describe("handleSetSelectedVisibility", () => {
        it("updates visibility and resets state", async () => {
            const { result } = renderHook(() => useImageSelection())
            
            act(() => {
                result.current.toggleSelection("img1")
                result.current.toggleSelection("img2")
                result.current.setSelectionMode(true)
            })

            mockVisibilityMutateAsync.mockResolvedValue({})

            await act(async () => {
                await result.current.handleSetSelectedVisibility("public")
            })

            expect(mockVisibilityMutateAsync).toHaveBeenCalledWith({
                imageIds: ["img1", "img2"],
                visibility: "public",
            })
            expect(result.current.selectedIds.size).toBe(0)
            expect(result.current.selectionMode).toBe(false)
        })

        it("shows error toast when no images are selected", async () => {
            const { result } = renderHook(() => useImageSelection())
            
            await act(async () => {
                await result.current.handleSetSelectedVisibility("unlisted")
            })

            expect(mockVisibilityMutateAsync).not.toHaveBeenCalled()
            expect(toast.error).toHaveBeenCalledWith("No images selected")
        })

        it("does not reset state on visibility update failure", async () => {
            const { result } = renderHook(() => useImageSelection())
            
            act(() => {
                result.current.toggleSelection("img1")
                result.current.setSelectionMode(true)
            })

            mockVisibilityMutateAsync.mockRejectedValue(new Error("Update failed"))

            await act(async () => {
                await result.current.handleSetSelectedVisibility("public")
            })

            // State should remain unchanged on failure
            expect(result.current.selectedIds.has("img1")).toBe(true)
            expect(result.current.selectionMode).toBe(true)
        })
    })

    describe("loading states", () => {
        it("reflects delete loading state", () => {
            vi.mocked(useBulkDeleteGeneratedImages).mockReturnValue({
                mutateAsync: mockDeleteMutateAsync,
                isPending: true,
            } as unknown as ReturnType<typeof useBulkDeleteGeneratedImages>)

            const { result } = renderHook(() => useImageSelection())
            
            expect(result.current.isDeleting).toBe(true)
            expect(result.current.isUpdatingVisibility).toBe(false)
        })

        it("reflects visibility update loading state", () => {
            vi.mocked(useSetBulkVisibility).mockReturnValue({
                mutateAsync: mockVisibilityMutateAsync,
                isPending: true,
            } as unknown as ReturnType<typeof useSetBulkVisibility>)

            const { result } = renderHook(() => useImageSelection())
            
            expect(result.current.isDeleting).toBe(false)
            expect(result.current.isUpdatingVisibility).toBe(true)
        })

        it("reflects both loading states simultaneously", () => {
            vi.mocked(useBulkDeleteGeneratedImages).mockReturnValue({
                mutateAsync: mockDeleteMutateAsync,
                isPending: true,
            } as unknown as ReturnType<typeof useBulkDeleteGeneratedImages>)

            vi.mocked(useSetBulkVisibility).mockReturnValue({
                mutateAsync: mockVisibilityMutateAsync,
                isPending: true,
            } as unknown as ReturnType<typeof useSetBulkVisibility>)

            const { result } = renderHook(() => useImageSelection())
            
            expect(result.current.isDeleting).toBe(true)
            expect(result.current.isUpdatingVisibility).toBe(true)
        })
    })

    describe("callback stability", () => {
        it("maintains stable callback references across renders", () => {
            const { result } = renderHook(() => useImageSelection())
            
            const firstToggle = result.current.toggleSelection
            const firstSelectAll = result.current.selectAll
            const firstDeselectAll = result.current.deselectAll
            const firstIsSelected = result.current.isSelected
            
            // Trigger a re-render by toggling selection
            act(() => {
                result.current.toggleSelection("img1")
            })
            
            // Callbacks should be the same reference
            expect(result.current.toggleSelection).toBe(firstToggle)
            expect(result.current.selectAll).toBe(firstSelectAll)
            expect(result.current.deselectAll).toBe(firstDeselectAll)
            expect(result.current.isSelected).toBe(firstIsSelected)
        })
    })
})
