/**
 * @vitest-environment jsdom
 * 
 * Tests for useDeleteImage Hook
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import { useMutation as useConvexMutation } from "convex/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useBulkDeleteGeneratedImages, useDeleteGeneratedImage, useDeleteReferenceImage } from "./use-delete-image"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"

// Mock Convex
vi.mock("convex/react", () => ({
    useMutation: vi.fn(),
}))

// Mock Convex API
vi.mock("@/convex/_generated/api", () => ({
    api: {
        generatedImages: {
            remove: "generatedImages.remove",
            removeMany: "generatedImages.removeMany",
        },
        referenceImages: {
            remove: "referenceImages.remove",
        },
    },
}))

// Mock toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })

    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient} >
                {children}
            </QueryClientProvider>
        )
    }
}

describe("useDeleteImage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            })
        ) as unknown as typeof fetch
    })

    describe("useDeleteGeneratedImage", () => {
        it("deletes from Convex and then R2 (including thumbnail)", async () => {
            const mockRemove = vi.fn().mockResolvedValue({ r2Key: "test-r2-key", thumbnailR2Key: "test-thumbnail-key" })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemove)

            const { result } = renderHook(() => useDeleteGeneratedImage(), {
                wrapper: createWrapper(),
            })

            await result.current.mutateAsync("id123" as unknown as Id<"generatedImages">)

            expect(mockRemove).toHaveBeenCalledWith({ imageId: "id123" })
            // Should delete both the original image and thumbnail
            expect(global.fetch).toHaveBeenCalledTimes(2)
            expect(global.fetch).toHaveBeenCalledWith("/api/images/delete", expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ r2Key: "test-r2-key" }),
            }))
            expect(global.fetch).toHaveBeenCalledWith("/api/images/delete", expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ r2Key: "test-thumbnail-key" }),
            }))
            expect(toast.success).toHaveBeenCalledWith("Image deleted")
        })

        it("handles image without thumbnail", async () => {
            const mockRemove = vi.fn().mockResolvedValue({ r2Key: "test-r2-key", thumbnailR2Key: undefined })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemove)

            const { result } = renderHook(() => useDeleteGeneratedImage(), {
                wrapper: createWrapper(),
            })

            await result.current.mutateAsync("id123" as unknown as Id<"generatedImages">)

            // Should only delete the original image (no thumbnail)
            expect(global.fetch).toHaveBeenCalledTimes(1)
            expect(global.fetch).toHaveBeenCalledWith("/api/images/delete", expect.objectContaining({
                body: JSON.stringify({ r2Key: "test-r2-key" }),
            }))
            expect(toast.success).toHaveBeenCalledWith("Image deleted")
        })

        it("handles R2 deletion failure gracefully", async () => {
            const mockRemove = vi.fn().mockResolvedValue({ r2Key: "test-r2-key", thumbnailR2Key: "test-thumbnail-key" })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemove)

            global.fetch = vi.fn().mockImplementation(() =>
                Promise.resolve({
                    ok: false,
                    json: () => Promise.resolve({ error: "R2 deletion failed" }),
                })
            ) as unknown as typeof fetch

            const { result } = renderHook(() => useDeleteGeneratedImage(), {
                wrapper: createWrapper(),
            })

            await result.current.mutateAsync("id123" as unknown as Id<"generatedImages">)

            // Should still be successful because Convex deletion succeeded
            expect(mockRemove).toHaveBeenCalled()
            // Should attempt to delete both original and thumbnail (even if both fail)
            expect(global.fetch).toHaveBeenCalledTimes(2)
            expect(toast.success).toHaveBeenCalledWith("Image deleted")
        })

        it("handles Convex deletion failure", async () => {
            const mockRemove = vi.fn().mockRejectedValue(new Error("Convex error"))
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemove)

            const { result } = renderHook(() => useDeleteGeneratedImage(), {
                wrapper: createWrapper(),
            })

            await expect(result.current.mutateAsync("id123" as unknown as Id<"generatedImages">)).rejects.toThrow("Convex error")
            expect(toast.error).toHaveBeenCalledWith("Failed to delete image", expect.any(Object))
        })

        it("throws error when Convex returns success: false", async () => {
            const mockRemove = vi.fn().mockResolvedValue({
                success: false,
                error: "Image not found",
            })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemove)

            const { result } = renderHook(() => useDeleteGeneratedImage(), {
                wrapper: createWrapper(),
            })

            await expect(
                result.current.mutateAsync("id123" as unknown as Id<"generatedImages">)
            ).rejects.toThrow("Image not found")

            expect(toast.error).toHaveBeenCalledWith("Failed to delete image", expect.any(Object))
        })
    })

    describe("useDeleteReferenceImage", () => {
        it("deletes reference image from Convex and R2", async () => {
            const mockRemove = vi.fn().mockResolvedValue({ r2Key: "ref-r2-key" })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemove)

            const { result } = renderHook(() => useDeleteReferenceImage(), {
                wrapper: createWrapper(),
            })

            await result.current.mutateAsync("ref123" as unknown as Id<"referenceImages">)

            expect(mockRemove).toHaveBeenCalledWith({ imageId: "ref123" })
            expect(global.fetch).toHaveBeenCalledWith("/api/images/delete", expect.objectContaining({
                body: JSON.stringify({ r2Key: "ref-r2-key" }),
            }))
            expect(toast.success).toHaveBeenCalledWith("Reference image deleted")
        })

        it("throws error when Convex returns success: false", async () => {
            const mockRemove = vi.fn().mockResolvedValue({
                success: false,
                error: "Reference image not found",
            })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemove)

            const { result } = renderHook(() => useDeleteReferenceImage(), {
                wrapper: createWrapper(),
            })

            await expect(
                result.current.mutateAsync("ref123" as unknown as Id<"referenceImages">)
            ).rejects.toThrow("Reference image not found")

            expect(toast.error).toHaveBeenCalledWith("Failed to delete reference image", expect.any(Object))
        })
    })

    describe("useBulkDeleteGeneratedImages", () => {
        it("deletes multiple images with single Convex call (including thumbnails)", async () => {
            const mockRemoveMany = vi.fn().mockResolvedValue({
                success: true,
                successCount: 3,
                totalRequested: 3,
                r2Keys: ["key1", "key2", "key3"],
                thumbnailR2Keys: ["thumb1", "thumb2", "thumb3"],
            })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemoveMany)

            const { result } = renderHook(() => useBulkDeleteGeneratedImages(), {
                wrapper: createWrapper(),
            })

            const imageIds = ["id1", "id2", "id3"] as unknown as Id<"generatedImages">[]
            await result.current.mutateAsync(imageIds)

            // Should call Convex once with all image IDs
            expect(mockRemoveMany).toHaveBeenCalledTimes(1)
            expect(mockRemoveMany).toHaveBeenCalledWith({ imageIds })

            // Should delete all R2 files (3 images + 3 thumbnails = 6)
            expect(global.fetch).toHaveBeenCalledTimes(6)

            // Should show single success toast
            expect(toast.success).toHaveBeenCalledTimes(1)
            expect(toast.success).toHaveBeenCalledWith("Deleted 3 images")
        })

        it("shows singular 'image' for single deletion", async () => {
            const mockRemoveMany = vi.fn().mockResolvedValue({
                success: true,
                successCount: 1,
                totalRequested: 1,
                r2Keys: ["key1"],
                thumbnailR2Keys: ["thumb1"],
            })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemoveMany)

            const { result } = renderHook(() => useBulkDeleteGeneratedImages(), {
                wrapper: createWrapper(),
            })

            await result.current.mutateAsync(["id1"] as unknown as Id<"generatedImages">[])

            // Should delete 1 image + 1 thumbnail = 2 R2 files
            expect(global.fetch).toHaveBeenCalledTimes(2)
            expect(toast.success).toHaveBeenCalledWith("Deleted 1 image")
        })

        it("handles images without thumbnails", async () => {
            const mockRemoveMany = vi.fn().mockResolvedValue({
                success: true,
                successCount: 2,
                totalRequested: 2,
                r2Keys: ["key1", "key2"],
                thumbnailR2Keys: [], // No thumbnails (legacy images)
            })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemoveMany)

            const { result } = renderHook(() => useBulkDeleteGeneratedImages(), {
                wrapper: createWrapper(),
            })

            await result.current.mutateAsync(["id1", "id2"] as unknown as Id<"generatedImages">[])

            // Should only delete 2 images (no thumbnails)
            expect(global.fetch).toHaveBeenCalledTimes(2)
            expect(toast.success).toHaveBeenCalledWith("Deleted 2 images")
        })

        it("handles bulk Convex deletion failure", async () => {
            const mockRemoveMany = vi.fn().mockRejectedValue(new Error("Bulk delete failed"))
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemoveMany)

            const { result } = renderHook(() => useBulkDeleteGeneratedImages(), {
                wrapper: createWrapper(),
            })

            await expect(
                result.current.mutateAsync(["id1", "id2"] as unknown as Id<"generatedImages">[])
            ).rejects.toThrow("Bulk delete failed")

            expect(toast.error).toHaveBeenCalledWith("Failed to delete images", expect.any(Object))
        })

        it("throws error when removeMany returns success: false", async () => {
            const mockRemoveMany = vi.fn().mockResolvedValue({
                success: false,
                successCount: 0,
                totalRequested: 2,
                error: "Some error occurred",
                r2Keys: [],
                thumbnailR2Keys: [],
            })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemoveMany)

            const { result } = renderHook(() => useBulkDeleteGeneratedImages(), {
                wrapper: createWrapper(),
            })

            await expect(
                result.current.mutateAsync(["id1", "id2"] as unknown as Id<"generatedImages">[])
            ).rejects.toThrow("Some error occurred")

            expect(toast.error).toHaveBeenCalledWith("Failed to delete images", expect.any(Object))
        })

        it("handles partial R2 deletion failures gracefully", async () => {
            const mockRemoveMany = vi.fn().mockResolvedValue({
                success: true,
                successCount: 2,
                totalRequested: 2,
                r2Keys: ["key1", "key2"],
                thumbnailR2Keys: ["thumb1", "thumb2"],
            })
            ;(useConvexMutation as unknown as import("vitest").Mock).mockReturnValue(mockRemoveMany)

            // Make second R2 delete fail
            let callCount = 0
            global.fetch = vi.fn().mockImplementation(() => {
                callCount++
                if (callCount === 2) {
                    return Promise.reject(new Error("Network error"))
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                })
            }) as unknown as typeof fetch

            const { result } = renderHook(() => useBulkDeleteGeneratedImages(), {
                wrapper: createWrapper(),
            })

            // Should succeed despite R2 failure (Convex records already deleted)
            await result.current.mutateAsync(["id1", "id2"] as unknown as Id<"generatedImages">[])

            expect(toast.success).toHaveBeenCalledWith("Deleted 2 images")
        })
    })
})
