/**
 * @vitest-environment jsdom
 *
 * Tests for useGenerateImage Hook
 */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import type { ReactNode } from "react"
import {
    useGenerateImage,
    ServerGenerationError,
    isServerGenerationError,
} from "./use-generate-image"

// Track the query arguments to return appropriate mock data
let mockQueryArgs: Record<string, unknown> = {}
let mockGenerationStatus: {
    status: "pending" | "processing" | "completed" | "failed"
    imageId?: string
    errorMessage?: string
} | null = null
let mockGeneratedImage: {
    _id: string
    url: string
    prompt: string
    generationParams: Record<string, unknown>
    createdAt: number
    r2Key?: string
    sizeBytes?: number
    contentType?: string
} | null = null

// Mock mutation function
const mockStartGeneration = vi.fn()

// Mock Convex react hooks
vi.mock("convex/react", () => ({
    useMutation: () => mockStartGeneration,
    useQuery: (
        _apiRef: unknown,
        args: unknown
    ) => {
        // Store the args for inspection
        mockQueryArgs = args as Record<string, unknown>

        // Return appropriate mock data based on which query is being called
        // The hook passes "skip" when it doesn't want to run the query
        if (args === "skip") {
            return undefined
        }

        // Check if this is a generation status query (has generationId)
        if (args && typeof args === "object" && "generationId" in args) {
            return mockGenerationStatus
        }

        // Check if this is a getById query (has imageId)
        if (args && typeof args === "object" && "imageId" in args) {
            return mockGeneratedImage
        }

        return undefined
    },
}))

// Mock Convex API - provide full structure that the hook expects
vi.mock("@/convex/_generated/api", () => ({
    api: {
        singleGeneration: {
            startGeneration: "singleGeneration.startGeneration",
            getGenerationStatus: "singleGeneration.getGenerationStatus",
        },
        generatedImages: {
            getById: "generatedImages.getById",
        },
    },
}))

// Simple wrapper - no need for QueryClient since we're using Convex, not React Query
function TestWrapper({ children }: { children: ReactNode }) {
    return <>{children}</>
}

describe("useGenerateImage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockQueryArgs = {}
        mockGenerationStatus = null
        mockGeneratedImage = null
        mockStartGeneration.mockReset()
    })

    it("starts generation via Convex mutation", async () => {
        const generationId = "gen_123"
        mockStartGeneration.mockResolvedValueOnce(generationId)

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        await act(async () => {
            result.current.generate({ prompt: "test prompt" })
        })

        expect(mockStartGeneration).toHaveBeenCalledWith({
            generationParams: {
                prompt: "test prompt",
                negativePrompt: undefined,
                model: undefined,
                width: undefined,
                height: undefined,
                seed: undefined,
                enhance: undefined,
                private: undefined,
                safe: undefined,
                image: undefined,
            },
        })
        expect(result.current.isGenerating).toBe(true)
    })

    it("handles successful generation completion", async () => {
        const generationId = "gen_123"
        const imageId = "img_456"
        mockStartGeneration.mockResolvedValueOnce(generationId)

        const onSuccess = vi.fn()
        const { result, rerender } = renderHook(
            () => useGenerateImage({ onSuccess }),
            { wrapper: TestWrapper }
        )

        // Start generation
        await act(async () => {
            result.current.generate({ prompt: "test prompt" })
        })

        expect(result.current.isGenerating).toBe(true)

        // Simulate generation completing
        mockGenerationStatus = { status: "completed", imageId }
        mockGeneratedImage = {
            _id: imageId,
            url: "https://example.com/image.png",
            prompt: "test prompt",
            generationParams: { prompt: "test prompt" },
            createdAt: Date.now(),
            r2Key: "r2/key",
            sizeBytes: 1024,
            contentType: "image/png",
        }

        // Trigger re-render to pick up the new mock values
        rerender()

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.isGenerating).toBe(false)
        expect(result.current.data?.url).toBe("https://example.com/image.png")
        expect(onSuccess).toHaveBeenCalled()
    })

    it("handles generation failure", async () => {
        const generationId = "gen_123"
        mockStartGeneration.mockResolvedValueOnce(generationId)

        const onError = vi.fn()
        const { result, rerender } = renderHook(
            () => useGenerateImage({ onError }),
            { wrapper: TestWrapper }
        )

        // Start generation
        await act(async () => {
            result.current.generate({ prompt: "test prompt" })
        })

        // Simulate generation failing
        mockGenerationStatus = {
            status: "failed",
            errorMessage: "API rate limit exceeded",
        }

        rerender()

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.isGenerating).toBe(false)
        expect(result.current.error).toBeInstanceOf(ServerGenerationError)
        expect(result.current.error?.message).toBe("API rate limit exceeded")
        expect(onError).toHaveBeenCalled()
    })

    it("handles mutation start failure", async () => {
        mockStartGeneration.mockRejectedValueOnce(new Error("Not authenticated"))

        const onError = vi.fn()
        const { result } = renderHook(
            () => useGenerateImage({ onError }),
            { wrapper: TestWrapper }
        )

        await act(async () => {
            result.current.generate({ prompt: "test prompt" })
        })

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error?.message).toBe("Not authenticated")
        expect(result.current.error?.code).toBe("START_FAILED")
        expect(onError).toHaveBeenCalled()
    })

    it("calls onMutate callback before starting", async () => {
        mockStartGeneration.mockResolvedValueOnce("gen_123")
        const onMutate = vi.fn()

        const { result } = renderHook(
            () => useGenerateImage({ onMutate }),
            { wrapper: TestWrapper }
        )

        await act(async () => {
            result.current.generate({ prompt: "test prompt" })
        })

        expect(onMutate).toHaveBeenCalledWith({ prompt: "test prompt" })
    })

    it("returns correct progress states", async () => {
        mockStartGeneration.mockResolvedValueOnce("gen_123")

        const { result, rerender } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        // Initial state
        expect(result.current.isGenerating).toBe(false)
        expect(result.current.progress).toBe(0)

        // Start generation
        await act(async () => {
            result.current.generate({ prompt: "test" })
        })

        expect(result.current.isGenerating).toBe(true)
        expect(result.current.progress).toBe(-1) // Indeterminate

        // Complete generation
        mockGenerationStatus = { status: "completed", imageId: "img_123" }
        mockGeneratedImage = {
            _id: "img_123",
            url: "https://example.com/image.png",
            prompt: "test",
            generationParams: { prompt: "test" },
            createdAt: Date.now(),
        }

        rerender()

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.progress).toBe(100)
    })

    it("resets state correctly", async () => {
        mockStartGeneration.mockResolvedValueOnce("gen_123")

        const { result, rerender } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        // Generate an image
        await act(async () => {
            result.current.generate({ prompt: "test" })
        })

        mockGenerationStatus = { status: "completed", imageId: "img_123" }
        mockGeneratedImage = {
            _id: "img_123",
            url: "https://example.com/image.png",
            prompt: "test",
            generationParams: { prompt: "test" },
            createdAt: Date.now(),
        }

        rerender()

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        // Reset
        act(() => {
            result.current.reset()
        })

        expect(result.current.isSuccess).toBe(false)
        expect(result.current.isGenerating).toBe(false)
        expect(result.current.data).toBeUndefined()
        expect(result.current.error).toBeNull()
    })

    it("passes all generation params to mutation", async () => {
        mockStartGeneration.mockResolvedValueOnce("gen_123")

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        const params = {
            prompt: "A beautiful sunset",
            negativePrompt: "blurry",
            model: "zimage",
            width: 1024,
            height: 768,
            seed: 12345,
            enhance: true,
            private: false,
            safe: true,
            image: "base64data",
        }

        await act(async () => {
            result.current.generate(params)
        })

        expect(mockStartGeneration).toHaveBeenCalledWith({
            generationParams: params,
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
