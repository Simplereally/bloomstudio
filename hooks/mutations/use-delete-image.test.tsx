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
import { useDeleteGeneratedImage, useDeleteReferenceImage } from "./use-delete-image"
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
})
