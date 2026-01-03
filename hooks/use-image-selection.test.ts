/**
 * @vitest-environment jsdom
 * 
 * Tests for useImageSelection Hook
 */
import { useDeleteGeneratedImage } from "@/hooks/mutations/use-delete-image"
import { useSetBulkVisibility } from "@/hooks/mutations/use-set-visibility"
import { act, renderHook } from "@testing-library/react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useImageSelection, type SelectableImage } from "./use-image-selection"

// Mock mutations
vi.mock("@/hooks/mutations/use-delete-image", () => ({
    useDeleteGeneratedImage: vi.fn(),
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
        
        vi.mocked(useDeleteGeneratedImage).mockReturnValue({
            mutateAsync: mockDeleteMutateAsync,
            isPending: false,
        } as any)

        vi.mocked(useSetBulkVisibility).mockReturnValue({
            mutateAsync: mockVisibilityMutateAsync,
            isPending: false,
        } as any)
    })

    it("should initialize with default state", () => {
        const { result } = renderHook(() => useImageSelection())
        
        expect(result.current.selectionMode).toBe(false)
        expect(result.current.selectedIds.size).toBe(0)
        expect(result.current.isDeleting).toBe(false)
        expect(result.current.isUpdatingVisibility).toBe(false)
    })

    it("should toggle selection correctly", () => {
        const { result } = renderHook(() => useImageSelection())
        
        act(() => {
            result.current.toggleSelection("img1")
        })
        expect(result.current.selectedIds.has("img1")).toBe(true)
        expect(result.current.selectedIds.size).toBe(1)
        expect(result.current.isSelected("img1")).toBe(true)

        act(() => {
            result.current.toggleSelection("img1")
        })
        expect(result.current.selectedIds.has("img1")).toBe(false)
        expect(result.current.selectedIds.size).toBe(0)
    })

    it("should select all images", () => {
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

    it("should deselect all images", () => {
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

    describe("handleDeleteSelected", () => {
        it("should delete selected images and reset state", async () => {
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

            expect(mockDeleteMutateAsync).toHaveBeenCalledTimes(2)
            expect(mockDeleteMutateAsync).toHaveBeenCalledWith("img1")
            expect(mockDeleteMutateAsync).toHaveBeenCalledWith("img2")
            expect(toast.success).toHaveBeenCalledWith("Deleted 2 images")
            expect(result.current.selectedIds.size).toBe(0)
            expect(result.current.selectionMode).toBe(false)
        })

        it("should do nothing if no images are selected", async () => {
            const { result } = renderHook(() => useImageSelection())
            
            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            expect(mockDeleteMutateAsync).not.toHaveBeenCalled()
        })
    })

    describe("handleSetSelectedVisibility", () => {
        it("should update visibility and reset state", async () => {
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

        it("should show error toast if no images are selected", async () => {
            const { result } = renderHook(() => useImageSelection())
            
            await act(async () => {
                await result.current.handleSetSelectedVisibility("unlisted")
            })

            expect(mockVisibilityMutateAsync).not.toHaveBeenCalled()
            expect(toast.error).toHaveBeenCalledWith("No images selected")
        })
    })

    it("should reflect loading states", () => {
        vi.mocked(useDeleteGeneratedImage).mockReturnValue({
            mutateAsync: mockDeleteMutateAsync,
            isPending: true,
        } as any)

        vi.mocked(useSetBulkVisibility).mockReturnValue({
            mutateAsync: mockVisibilityMutateAsync,
            isPending: true,
        } as any)

        const { result } = renderHook(() => useImageSelection())
        
        expect(result.current.isDeleting).toBe(true)
        expect(result.current.isUpdatingVisibility).toBe(true)
    })
})
