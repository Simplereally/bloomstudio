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
        it("deletes from Convex and then R2", async () => {
            const mockRemove = vi.fn().mockResolvedValue({ r2Key: "test-r2-key" })
            vi.mocked(useConvexMutation).mockReturnValue(mockRemove as unknown as ReturnType<typeof useConvexMutation>)

            const { result } = renderHook(() => useDeleteGeneratedImage(), {
                wrapper: createWrapper(),
            })

            await result.current.mutateAsync("id123" as unknown as Id<"generatedImages">)

            expect(mockRemove).toHaveBeenCalledWith({ imageId: "id123" })
            expect(global.fetch).toHaveBeenCalledWith("/api/images/delete", expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ r2Key: "test-r2-key" }),
            }))
            expect(toast.success).toHaveBeenCalledWith("Image deleted")
        })

        it("handles R2 deletion failure gracefully", async () => {
            const mockRemove = vi.fn().mockResolvedValue({ r2Key: "test-r2-key" })
            vi.mocked(useConvexMutation).mockReturnValue(mockRemove as unknown as ReturnType<typeof useConvexMutation>)

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
            expect(toast.success).toHaveBeenCalledWith("Image deleted")
        })

        it("handles Convex deletion failure", async () => {
            const mockRemove = vi.fn().mockRejectedValue(new Error("Convex error"))
            vi.mocked(useConvexMutation).mockReturnValue(mockRemove as unknown as ReturnType<typeof useConvexMutation>)

            const { result } = renderHook(() => useDeleteGeneratedImage(), {
                wrapper: createWrapper(),
            })

            await expect(result.current.mutateAsync("id123" as unknown as Id<"generatedImages">)).rejects.toThrow("Convex error")
            expect(toast.error).toHaveBeenCalledWith("Failed to delete image", expect.any(Object))
        })
    })

    describe("useDeleteReferenceImage", () => {
        it("deletes reference image from Convex and R2", async () => {
            const mockRemove = vi.fn().mockResolvedValue({ r2Key: "ref-r2-key" })
            vi.mocked(useConvexMutation).mockReturnValue(mockRemove as unknown as ReturnType<typeof useConvexMutation>)

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
    })

    describe("useBulkDeleteGeneratedImages", () => {
        it("deletes multiple images with single Convex call", async () => {
            const mockRemoveMany = vi.fn().mockResolvedValue({
                success: true,
                successCount: 3,
                totalRequested: 3,
                r2Keys: ["key1", "key2", "key3"],
            })
            vi.mocked(useConvexMutation).mockReturnValue(mockRemoveMany as unknown as ReturnType<typeof useConvexMutation>)

            const { result } = renderHook(() => useBulkDeleteGeneratedImages(), {
                wrapper: createWrapper(),
            })

            const imageIds = ["id1", "id2", "id3"] as unknown as Id<"generatedImages">[]
            await result.current.mutateAsync(imageIds)

            // Should call Convex once with all image IDs
            expect(mockRemoveMany).toHaveBeenCalledTimes(1)
            expect(mockRemoveMany).toHaveBeenCalledWith({ imageIds })

            // Should delete all R2 files
            expect(global.fetch).toHaveBeenCalledTimes(3)

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
            })
            vi.mocked(useConvexMutation).mockReturnValue(mockRemoveMany as unknown as ReturnType<typeof useConvexMutation>)

            const { result } = renderHook(() => useBulkDeleteGeneratedImages(), {
                wrapper: createWrapper(),
            })

            await result.current.mutateAsync(["id1"] as unknown as Id<"generatedImages">[])

            expect(toast.success).toHaveBeenCalledWith("Deleted 1 image")
        })

        it("handles bulk Convex deletion failure", async () => {
            const mockRemoveMany = vi.fn().mockRejectedValue(new Error("Bulk delete failed"))
            vi.mocked(useConvexMutation).mockReturnValue(mockRemoveMany as unknown as ReturnType<typeof useConvexMutation>)

            const { result } = renderHook(() => useBulkDeleteGeneratedImages(), {
                wrapper: createWrapper(),
            })

            await expect(
                result.current.mutateAsync(["id1", "id2"] as unknown as Id<"generatedImages">[])
            ).rejects.toThrow("Bulk delete failed")

            expect(toast.error).toHaveBeenCalledWith("Failed to delete images", expect.any(Object))
        })

        it("handles partial R2 deletion failures gracefully", async () => {
            const mockRemoveMany = vi.fn().mockResolvedValue({
                success: true,
                successCount: 2,
                totalRequested: 2,
                r2Keys: ["key1", "key2"],
            })
            vi.mocked(useConvexMutation).mockReturnValue(mockRemoveMany as unknown as ReturnType<typeof useConvexMutation>)

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
