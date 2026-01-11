/**
 * @vitest-environment jsdom
 *
 * Tests for useImageGalleryState Hook
 *
 * Following React Testing Library gold standards:
 * - Test behavior, not implementation
 * - Use renderHook for custom hooks
 * - Act properly for state updates
 * - Mock dependencies at boundaries
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import type { Mock } from "vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useImageGalleryState } from "./use-image-gallery-state"
import { useBulkDeleteGeneratedImages, useDeleteGeneratedImage } from "./mutations/use-delete-image"
import { useSetBulkVisibility } from "./mutations/use-set-visibility"
import type { GeneratedImage } from "@/types/pollinations"
import type { Id } from "@/convex/_generated/dataModel"

// Mock the mutation hooks
vi.mock("./mutations/use-delete-image", () => ({
    useDeleteGeneratedImage: vi.fn(),
    useBulkDeleteGeneratedImages: vi.fn(),
}))

vi.mock("./mutations/use-set-visibility", () => ({
    useSetBulkVisibility: vi.fn(),
}))

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

// Factory to create test images
function createTestImage(overrides: Partial<GeneratedImage> = {}): GeneratedImage {
    return {
        id: `img-${Math.random().toString(36).slice(2)}`,
        url: "https://example.com/image.jpg",
        prompt: "Test prompt",
        model: "flux",
        contentType: "image/jpeg",
        visibility: "public",
        ...overrides,
    }
}

describe("useImageGalleryState", () => {
    let mockDeleteMutateAsync: Mock
    let mockBulkDeleteMutateAsync: Mock
    let mockBulkVisibilityMutateAsync: Mock

    beforeEach(() => {
        vi.clearAllMocks()

        mockDeleteMutateAsync = vi.fn().mockResolvedValue({ r2Key: "test-key" })
        mockBulkDeleteMutateAsync = vi.fn().mockResolvedValue({
            success: true,
            successCount: 2,
            r2Keys: ["key1", "key2"],
        })
        mockBulkVisibilityMutateAsync = vi.fn().mockResolvedValue({
            success: true,
            successCount: 2,
        })

        vi.mocked(useDeleteGeneratedImage).mockReturnValue({
            mutateAsync: mockDeleteMutateAsync,
            isPending: false,
        } as unknown as ReturnType<typeof useDeleteGeneratedImage>)

        vi.mocked(useBulkDeleteGeneratedImages).mockReturnValue({
            mutateAsync: mockBulkDeleteMutateAsync,
            isPending: false,
        } as unknown as ReturnType<typeof useBulkDeleteGeneratedImages>)

        vi.mocked(useSetBulkVisibility).mockReturnValue({
            mutateAsync: mockBulkVisibilityMutateAsync,
            isPending: false,
        } as unknown as ReturnType<typeof useSetBulkVisibility>)
    })

    describe("initial state", () => {
        it("starts with empty images array", () => {
            const { result } = renderHook(() => useImageGalleryState())

            expect(result.current.images).toEqual([])
        })

        it("starts with no current image", () => {
            const { result } = renderHook(() => useImageGalleryState())

            expect(result.current.currentImage).toBeNull()
        })

        it("starts with empty prompt history", () => {
            const { result } = renderHook(() => useImageGalleryState())

            expect(result.current.promptHistory).toEqual([])
        })

        it("starts with selection mode disabled", () => {
            const { result } = renderHook(() => useImageGalleryState())

            expect(result.current.selectionMode).toBe(false)
            expect(result.current.selectedIds.size).toBe(0)
        })
    })

    describe("addImage", () => {
        it("adds image to the front of the array", () => {
            const { result } = renderHook(() => useImageGalleryState())
            const image = createTestImage({ id: "new-image" })

            act(() => {
                result.current.addImage(image)
            })

            expect(result.current.images).toHaveLength(1)
            expect(result.current.images[0].id).toBe("new-image")
        })

        it("sets the added image as current", () => {
            const { result } = renderHook(() => useImageGalleryState())
            const image = createTestImage()

            act(() => {
                result.current.addImage(image)
            })

            expect(result.current.currentImage).toBe(image)
        })

        it("prepends new images maintaining order", () => {
            const { result } = renderHook(() => useImageGalleryState())
            const image1 = createTestImage({ id: "first" })
            const image2 = createTestImage({ id: "second" })

            act(() => {
                result.current.addImage(image1)
            })
            act(() => {
                result.current.addImage(image2)
            })

            expect(result.current.images[0].id).toBe("second")
            expect(result.current.images[1].id).toBe("first")
        })
    })

    describe("addToPromptHistory", () => {
        it("adds prompt to history", () => {
            const { result } = renderHook(() => useImageGalleryState())

            act(() => {
                result.current.addToPromptHistory("test prompt")
            })

            expect(result.current.promptHistory).toContain("test prompt")
        })

        it("does not add duplicate prompts", () => {
            const { result } = renderHook(() => useImageGalleryState())

            act(() => {
                result.current.addToPromptHistory("test prompt")
            })
            act(() => {
                result.current.addToPromptHistory("test prompt")
            })

            expect(result.current.promptHistory).toHaveLength(1)
        })

        it("limits history to 10 items", () => {
            const { result } = renderHook(() => useImageGalleryState())

            act(() => {
                for (let i = 0; i < 15; i++) {
                    result.current.addToPromptHistory(`prompt ${i}`)
                }
            })

            expect(result.current.promptHistory).toHaveLength(10)
            // Most recent should be first
            expect(result.current.promptHistory[0]).toBe("prompt 14")
        })
    })

    describe("handleRemoveImage", () => {
        it("calls delete mutation with correct ID", async () => {
            const { result } = renderHook(() => useImageGalleryState())
            const image = createTestImage({
                id: "test-id",
                _id: "convex-id" as Id<"generatedImages">,
            })

            act(() => {
                result.current.addImage(image)
            })

            await act(async () => {
                await result.current.handleRemoveImage("test-id")
            })

            expect(mockDeleteMutateAsync).toHaveBeenCalledWith("convex-id")
        })

        it("removes image from local state after successful deletion", async () => {
            const { result } = renderHook(() => useImageGalleryState())
            const image = createTestImage({ id: "to-delete" })

            act(() => {
                result.current.addImage(image)
            })

            expect(result.current.images).toHaveLength(1)

            await act(async () => {
                await result.current.handleRemoveImage("to-delete")
            })

            expect(result.current.images).toHaveLength(0)
        })

        it("clears currentImage if it was the deleted image", async () => {
            const { result } = renderHook(() => useImageGalleryState())
            const image = createTestImage({ id: "current" })

            act(() => {
                result.current.addImage(image)
            })

            expect(result.current.currentImage?.id).toBe("current")

            await act(async () => {
                await result.current.handleRemoveImage("current")
            })

            expect(result.current.currentImage).toBeNull()
        })

        it("does not remove from local state if mutation fails", async () => {
            mockDeleteMutateAsync.mockRejectedValueOnce(new Error("Delete failed"))

            const { result } = renderHook(() => useImageGalleryState())
            const image = createTestImage({
                id: "keep-me",
                _id: "convex-id" as Id<"generatedImages">,
            })

            act(() => {
                result.current.addImage(image)
            })

            await act(async () => {
                await result.current.handleRemoveImage("keep-me")
            })

            // Image should still be in state since deletion failed
            expect(result.current.images).toHaveLength(1)
        })
    })

    describe("handleDeleteSelected - bulk delete", () => {
        it("calls bulk delete mutation with all selected persistent IDs", async () => {
            const { result } = renderHook(() => useImageGalleryState())

            const image1 = createTestImage({
                id: "img1",
                _id: "convex-1" as Id<"generatedImages">,
            })
            const image2 = createTestImage({
                id: "img2",
                _id: "convex-2" as Id<"generatedImages">,
            })

            // Add images
            act(() => {
                result.current.addImage(image1)
                result.current.addImage(image2)
            })

            // Select both
            act(() => {
                result.current.setSelectedIds(new Set(["img1", "img2"]))
            })

            // Delete selected
            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            // Should call bulk delete with both IDs
            expect(mockBulkDeleteMutateAsync).toHaveBeenCalledTimes(1)
            expect(mockBulkDeleteMutateAsync).toHaveBeenCalledWith(
                expect.arrayContaining(["convex-1", "convex-2"])
            )
        })

        it("removes selected images from local state", async () => {
            const { result } = renderHook(() => useImageGalleryState())

            const image1 = createTestImage({
                id: "img1",
                _id: "convex-1" as Id<"generatedImages">,
            })
            const image2 = createTestImage({
                id: "img2",
                _id: "convex-2" as Id<"generatedImages">,
            })

            act(() => {
                result.current.addImage(image1)
                result.current.addImage(image2)
            })

            act(() => {
                result.current.setSelectedIds(new Set(["img1"]))
            })

            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            // Only img2 should remain
            expect(result.current.images).toHaveLength(1)
            expect(result.current.images[0].id).toBe("img2")
        })

        it("clears selection and exits selection mode after delete", async () => {
            const { result } = renderHook(() => useImageGalleryState())

            const image = createTestImage({
                id: "img1",
                _id: "convex-1" as Id<"generatedImages">,
            })

            act(() => {
                result.current.addImage(image)
                result.current.setSelectionMode(true)
                result.current.setSelectedIds(new Set(["img1"]))
            })

            expect(result.current.selectionMode).toBe(true)
            expect(result.current.selectedIds.size).toBe(1)

            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            expect(result.current.selectionMode).toBe(false)
            expect(result.current.selectedIds.size).toBe(0)
        })

        it("clears currentImage if it was in selected set", async () => {
            const { result } = renderHook(() => useImageGalleryState())

            const image = createTestImage({
                id: "current-selected",
                _id: "convex-1" as Id<"generatedImages">,
            })

            act(() => {
                result.current.addImage(image)
                result.current.setSelectedIds(new Set(["current-selected"]))
            })

            expect(result.current.currentImage?.id).toBe("current-selected")

            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            expect(result.current.currentImage).toBeNull()
        })

        it("does not call mutation when no persistent images are selected", async () => {
            const { result } = renderHook(() => useImageGalleryState())

            // Add image without _id (local only)
            const localImage = createTestImage({ id: "local-only" })

            act(() => {
                result.current.addImage(localImage)
                result.current.setSelectedIds(new Set(["local-only"]))
            })

            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            // Should not call bulk delete since no persistent IDs
            expect(mockBulkDeleteMutateAsync).not.toHaveBeenCalled()
        })

        it("handles bulk delete error gracefully", async () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { })
            mockBulkDeleteMutateAsync.mockRejectedValueOnce(new Error("Bulk delete failed"))

            const { result } = renderHook(() => useImageGalleryState())

            const image = createTestImage({
                id: "img1",
                _id: "convex-1" as Id<"generatedImages">,
            })

            act(() => {
                result.current.addImage(image)
                result.current.setSelectionMode(true)
                result.current.setSelectedIds(new Set(["img1"]))
            })

            await act(async () => {
                await result.current.handleDeleteSelected()
            })

            expect(consoleSpy).toHaveBeenCalledWith("Bulk delete failed:", expect.any(Error))

            // Should NOT clean up local state on failure
            expect(result.current.selectedIds.size).toBe(1)
            expect(result.current.images).toHaveLength(1)
            // Should stay in selection mode
            expect(result.current.selectionMode).toBe(true)
            
            consoleSpy.mockRestore()
        })
    })

    describe("handleSetSelectedVisibility", () => {
        it("calls bulk visibility mutation with selected IDs", async () => {
            const { result } = renderHook(() => useImageGalleryState())

            const image = createTestImage({
                id: "img1",
                _id: "convex-1" as Id<"generatedImages">,
            })

            act(() => {
                result.current.addImage(image)
                result.current.setSelectedIds(new Set(["img1"]))
            })

            await act(async () => {
                await result.current.handleSetSelectedVisibility("unlisted")
            })

            expect(mockBulkVisibilityMutateAsync).toHaveBeenCalledWith({
                imageIds: ["convex-1"],
                visibility: "unlisted",
            })
        })

        it("updates local image visibility after success", async () => {
            const { result } = renderHook(() => useImageGalleryState())

            const image = createTestImage({
                id: "img1",
                _id: "convex-1" as Id<"generatedImages">,
                visibility: "public",
            })

            act(() => {
                result.current.addImage(image)
                result.current.setSelectedIds(new Set(["img1"]))
            })

            await act(async () => {
                await result.current.handleSetSelectedVisibility("unlisted")
            })

            expect(result.current.images[0].visibility).toBe("unlisted")
        })

        it("clears selection after visibility change", async () => {
            const { result } = renderHook(() => useImageGalleryState())

            const image = createTestImage({
                id: "img1",
                _id: "convex-1" as Id<"generatedImages">,
            })

            act(() => {
                result.current.addImage(image)
                result.current.setSelectionMode(true)
                result.current.setSelectedIds(new Set(["img1"]))
            })

            await act(async () => {
                await result.current.handleSetSelectedVisibility("public")
            })

            expect(result.current.selectedIds.size).toBe(0)
            expect(result.current.selectionMode).toBe(false)
        })
    })

    describe("selection state", () => {
        it("allows toggling selection mode", () => {
            const { result } = renderHook(() => useImageGalleryState())

            act(() => {
                result.current.setSelectionMode(true)
            })

            expect(result.current.selectionMode).toBe(true)
        })

        it("allows setting selected IDs", () => {
            const { result } = renderHook(() => useImageGalleryState())

            act(() => {
                result.current.setSelectedIds(new Set(["img1", "img2"]))
            })

            expect(result.current.selectedIds.size).toBe(2)
            expect(result.current.selectedIds.has("img1")).toBe(true)
            expect(result.current.selectedIds.has("img2")).toBe(true)
        })
    })
})
