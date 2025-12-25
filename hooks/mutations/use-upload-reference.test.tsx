/**
 * @vitest-environment jsdom
 * 
 * Tests for useUploadReference Hook
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useUploadReference } from "./use-upload-reference"
import { api } from "@/convex/_generated/api"
import type { ReactNode } from "react"
import { useMutation } from "convex/react"

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock Convex
vi.mock("convex/react", () => ({
    useMutation: vi.fn(),
}))

// Mock Convex API
vi.mock("@/convex/_generated/api", () => ({
    api: {
        referenceImages: {
            create: "referenceImages.create",
        },
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
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        )
    }
}

describe("useUploadReference", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useMutation).mockImplementation(() => {
            const fn = vi.fn() as any
            fn.withOptimisticUpdate = vi.fn().mockReturnValue(fn)
            return fn
        })
    })

    it("uploads image to R2 and creates record in Convex", async () => {
        const mockUploadResponse = {
            success: true,
            data: {
                url: "https://r2.example.com/test.jpg",
                r2Key: "test.jpg",
                contentType: "image/jpeg",
                sizeBytes: 1024,
            },
        }

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockUploadResponse,
        })

        const { result } = renderHook(() => useUploadReference(), {
            wrapper: createWrapper(),
        })

        const file = new File(["test"], "test.jpg", { type: "image/jpeg" })

        await result.current.mutateAsync(file)

        expect(mockFetch).toHaveBeenCalledWith(
            "/api/upload",
            expect.objectContaining({
                method: "POST",
                body: expect.any(FormData),
            })
        )

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })
        expect(result.current.data).toEqual(mockUploadResponse.data)
    })

    it("handles upload failure", async () => {
        const mockErrorResponse = {
            success: false,
            error: {
                message: "Upload failed",
            },
        }

        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => mockErrorResponse,
        })

        const { result } = renderHook(() => useUploadReference(), {
            wrapper: createWrapper(),
        })

        const file = new File(["test"], "test.jpg", { type: "image/jpeg" })

        await expect(result.current.mutateAsync(file)).rejects.toThrow("Upload failed")

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })
    })
})
