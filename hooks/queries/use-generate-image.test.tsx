/**
 * @vitest-environment jsdom
 *
 * Tests for useGenerateImage Hook
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
    useGenerateImage,
    ServerGenerationError,
    isServerGenerationError,
} from "./use-generate-image"

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Create a wrapper with QueryClientProvider
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
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

describe("useGenerateImage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("generates image via server endpoint", async () => {
        const mockResponse = {
            success: true,
            data: {
                id: "img_123",
                url: "https://gen.pollinations.ai/image/test",
                prompt: "test prompt",
                params: { prompt: "test prompt", model: "flux" },
                timestamp: Date.now(),
            },
        }

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        })

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: createWrapper(),
        })

        result.current.generate({ prompt: "test prompt" })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toEqual(mockResponse.data)
        expect(mockFetch).toHaveBeenCalledWith(
            "/api/generate",
            expect.objectContaining({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: "test prompt" }),
            })
        )
    })

    it("handles server error responses", async () => {
        const mockError = {
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid parameters",
                details: { issues: [] },
            },
        }

        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => mockError,
        })

        const onError = vi.fn()
        const { result } = renderHook(
            () => useGenerateImage({ onError }),
            { wrapper: createWrapper() }
        )

        result.current.generate({ prompt: "test" })

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error).toBeInstanceOf(ServerGenerationError)
        expect(result.current.error?.message).toBe("Invalid parameters")
        expect(result.current.error?.code).toBe("VALIDATION_ERROR")
        expect(onError).toHaveBeenCalled()
    })

    it("calls onSuccess callback", async () => {
        const mockResponse = {
            success: true,
            data: {
                id: "img_123",
                url: "https://gen.pollinations.ai/image/test",
                prompt: "test prompt",
                params: { prompt: "test prompt" },
                timestamp: Date.now(),
            },
        }

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        })

        const onSuccess = vi.fn()
        const { result } = renderHook(
            () => useGenerateImage({ onSuccess }),
            { wrapper: createWrapper() }
        )

        result.current.generate({ prompt: "test prompt" })

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledWith(
                mockResponse.data,
                { prompt: "test prompt" }
            )
        })
    })

    it("returns progress states correctly", async () => {
        mockFetch.mockImplementation(
            () =>
                new Promise((resolve) =>
                    setTimeout(() =>
                        resolve({
                            ok: true,
                            json: async () => ({
                                success: true,
                                data: {
                                    id: "img_123",
                                    url: "https://example.com/image.png",
                                    prompt: "test",
                                    params: { prompt: "test" },
                                    timestamp: Date.now(),
                                },
                            }),
                        }), 50
                    )
                )
        )

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: createWrapper(),
        })

        expect(result.current.isGenerating).toBe(false)
        expect(result.current.progress).toBe(0)

        result.current.generate({ prompt: "test" })

        await waitFor(() => {
            expect(result.current.isGenerating).toBe(true)
        })

        expect(result.current.progress).toBe(-1)

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.progress).toBe(100)
    })

    it("resets state correctly", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    id: "img_123",
                    url: "https://example.com/image.png",
                    prompt: "test",
                    params: { prompt: "test" },
                    timestamp: Date.now(),
                },
            }),
        })

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: createWrapper(),
        })

        result.current.generate({ prompt: "test" })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        result.current.reset()

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(false)
            expect(result.current.data).toBeUndefined()
        })
    })
})

describe("ServerGenerationError", () => {
    it("creates error with all properties", () => {
        const error = new ServerGenerationError(
            "Test error",
            "TEST_CODE",
            500,
            { detail: "info" }
        )

        expect(error.message).toBe("Test error")
        expect(error.code).toBe("TEST_CODE")
        expect(error.status).toBe(500)
        expect(error.details).toEqual({ detail: "info" })
        expect(error.name).toBe("ServerGenerationError")
    })

    it("is instanceof Error", () => {
        const error = new ServerGenerationError("Test", "CODE")
        expect(error instanceof Error).toBe(true)
        expect(error instanceof ServerGenerationError).toBe(true)
    })
})

describe("isServerGenerationError", () => {
    it("returns true for ServerGenerationError", () => {
        const error = new ServerGenerationError("Test", "CODE")
        expect(isServerGenerationError(error)).toBe(true)
    })

    it("returns false for other errors", () => {
        expect(isServerGenerationError(new Error("Test"))).toBe(false)
        expect(isServerGenerationError(null)).toBe(false)
        expect(isServerGenerationError({ message: "Test" })).toBe(false)
    })
})
