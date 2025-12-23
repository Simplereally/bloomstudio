// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { useGenerateImage } from "./use-generate-image"

// Mock the image API module
vi.mock("@/lib/api", () => ({
    generateImage: vi.fn(),
}))

// Import the mocked function
import { generateImage } from "@/lib/api"

const mockGenerateImage = generateImage as unknown as ReturnType<typeof vi.fn>

// Create a wrapper with QueryClientProvider for testing
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }
}

describe("useGenerateImage", () => {
    const mockImage = {
        id: "test-123",
        url: "https://example.com/image.jpg",
        prompt: "A beautiful sunset",
        params: {
            prompt: "A beautiful sunset",
            width: 1024,
            height: 1024,
        },
        timestamp: Date.now(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("initializes with default values", () => {
        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: createWrapper(),
        })

        expect(result.current.isGenerating).toBe(false)
        expect(result.current.isSuccess).toBe(false)
        expect(result.current.isError).toBe(false)
        expect(result.current.error).toBeNull()
        expect(result.current.data).toBeUndefined()
    })

    it("generates an image successfully", async () => {
        mockGenerateImage.mockResolvedValueOnce(mockImage)

        const onSuccess = vi.fn()
        const { result } = renderHook(
            () => useGenerateImage({ onSuccess }),
            { wrapper: createWrapper() }
        )

        act(() => {
            result.current.generate({ prompt: "A beautiful sunset" })
        })

        await waitFor(() => {
            expect(result.current.isGenerating).toBe(false)
        })

        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual(mockImage)
        expect(onSuccess).toHaveBeenCalledWith(mockImage, { prompt: "A beautiful sunset" })
    })

    it("handles generation error", async () => {
        const error = { message: "Generation failed", code: "GENERATION_FAILED" }
        mockGenerateImage.mockRejectedValueOnce(error)

        const onError = vi.fn()
        const { result } = renderHook(
            () => useGenerateImage({ onError }),
            { wrapper: createWrapper() }
        )

        act(() => {
            result.current.generate({ prompt: "A beautiful sunset" })
        })

        await waitFor(() => {
            expect(result.current.isGenerating).toBe(false)
        })

        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(error)
        expect(onError).toHaveBeenCalled()
    })

    it("calls onMutate callback when generation starts", async () => {
        // Create a promise that we can control
        let resolveGenerate: (value: typeof mockImage) => void
        const generatePromise = new Promise<typeof mockImage>((resolve) => {
            resolveGenerate = resolve
        })
        mockGenerateImage.mockReturnValueOnce(generatePromise)

        const onMutate = vi.fn()
        const { result } = renderHook(
            () => useGenerateImage({ onMutate }),
            { wrapper: createWrapper() }
        )

        act(() => {
            result.current.generate({ prompt: "A beautiful sunset" })
        })

        // Now we can check isGenerating because the promise is pending
        expect(result.current.isGenerating).toBe(true)
        expect(onMutate).toHaveBeenCalledWith({ prompt: "A beautiful sunset" })

        // Resolve the promise
        await act(async () => {
            resolveGenerate!(mockImage)
        })

        await waitFor(() => {
            expect(result.current.isGenerating).toBe(false)
        })
    })

    it("calls onSettled callback after mutation completes", async () => {
        mockGenerateImage.mockResolvedValueOnce(mockImage)

        const onSettled = vi.fn()
        const { result } = renderHook(
            () => useGenerateImage({ onSettled }),
            { wrapper: createWrapper() }
        )

        act(() => {
            result.current.generate({ prompt: "A beautiful sunset" })
        })

        await waitFor(() => {
            expect(result.current.isGenerating).toBe(false)
        })

        expect(onSettled).toHaveBeenCalledWith(
            mockImage,
            null,
            { prompt: "A beautiful sunset" }
        )
    })

    it("resets mutation state", async () => {
        mockGenerateImage.mockResolvedValueOnce(mockImage)

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.generate({ prompt: "A beautiful sunset" })
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        act(() => {
            result.current.reset()
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(false)
        })

        expect(result.current.data).toBeUndefined()
    })

    it("generateAsync returns a promise", async () => {
        mockGenerateImage.mockResolvedValueOnce(mockImage)

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: createWrapper(),
        })

        await act(async () => {
            const generatedImage = await result.current.generateAsync({ prompt: "A beautiful sunset" })
            expect(generatedImage).toEqual(mockImage)
        })
    })
})
