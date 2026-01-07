/**
 * @vitest-environment jsdom
 * 
 * Tests for useUploadReference Hook
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { useMutation } from "convex/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useUploadReference } from "./use-upload-reference"

// Mock XMLHttpRequest
const mockXHR = {
    open: vi.fn(),
    send: vi.fn(),
    upload: {
        addEventListener: vi.fn(),
    },
    addEventListener: vi.fn(),
    status: 200,
    responseText: "",
}

global.XMLHttpRequest = vi.fn(function () {
    return mockXHR
}) as unknown as typeof XMLHttpRequest

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
    let xhrHandlers: Record<string, ((...args: unknown[]) => void)[]> = {}

    beforeEach(() => {
        vi.clearAllMocks()
        xhrHandlers = {}

        vi.mocked(useMutation).mockImplementation(() => {
            const fn = vi.fn().mockImplementation(() => Promise.resolve()) as unknown as ReturnType<typeof useMutation>
            fn.withOptimisticUpdate = vi.fn().mockReturnValue(fn)
            return fn
        })

        vi.mocked(mockXHR.addEventListener).mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
            if (!xhrHandlers[event]) xhrHandlers[event] = []
            xhrHandlers[event].push(handler)
        })

        vi.mocked(mockXHR.send).mockImplementation(() => {
            // Default behavior: trigger load event
            if (xhrHandlers["load"]) {
                xhrHandlers["load"].forEach(h => h())
            }
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

        mockXHR.status = 200
        mockXHR.responseText = JSON.stringify(mockUploadResponse)

        const { result } = renderHook(() => useUploadReference(), {
            wrapper: createWrapper(),
        })

        const file = new File(["test"], "test.jpg", { type: "image/jpeg" })

        await result.current.mutateAsync(file)

        expect(mockXHR.open).toHaveBeenCalledWith("POST", "/api/upload")
        expect(mockXHR.send).toHaveBeenCalled()

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

        mockXHR.status = 400 // or 500, etc.
        mockXHR.responseText = JSON.stringify(mockErrorResponse)

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
