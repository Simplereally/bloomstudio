/**
 * @vitest-environment jsdom
 *
 * Tests for useGenerateImage Hook
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import type { ReactNode } from "react"
import {
    useGenerateImage,
    ServerGenerationError,
    isServerGenerationError,
} from "./use-generate-image"

let mockGenerationStatus: {
    status: "pending" | "processing" | "completed" | "failed" | "cancelled"
    imageId?: string
    errorMessage?: string
    errorCode?: number
} | null = null
const mockGeneratedImagesById = new Map<string, {
    _id: string
    url: string
    prompt: string
    generationParams: Record<string, unknown>
    createdAt: number
    r2Key?: string
    sizeBytes?: number
    contentType?: string
}>()

// Mock mutation functions
const mockStartGeneration = vi.fn()
const mockCancelGeneration = vi.fn()
const mockDispatchGeneration = vi.fn()

// Map mutation references to their mock implementations
const mutationMocks: Record<string, ReturnType<typeof vi.fn>> = {
    "singleGeneration.startGeneration": mockStartGeneration,
    "singleGeneration.cancelGeneration": mockCancelGeneration,
}

vi.mock("convex/react", () => ({
    useMutation: (mutationRef: string) => {
        return mutationMocks[mutationRef] ?? vi.fn()
    },
    useQuery: (
        _apiRef: unknown,
        args: unknown
    ) => {
        if (args === "skip") {
            return undefined
        }
        if (args && typeof args === "object" && "generationIds" in args) {
            const ids = (args as { generationIds: string[] }).generationIds
            if (!mockGenerationStatus) return []
            return ids.map((id) => ({
                _id: id,
                ownerId: "user_1",
                generationParams: { prompt: "test" },
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...mockGenerationStatus,
            }))
        }
        return undefined
    },
    useConvex: () => ({
        query: vi.fn(async (_apiRef: unknown, args: unknown) => {
            if (args && typeof args === "object" && "imageId" in args) {
                return mockGeneratedImagesById.get((args as { imageId: string }).imageId) ?? null
            }
            return null
        }),
    }),
    useAction: (actionRef: string) => {
        if (actionRef === "singleGeneration.dispatchGeneration") {
            return mockDispatchGeneration
        }
        return vi.fn()
    },
}))

// Mock BYOP pollen-auth hooks
const mockApiKey = "test-pollinations-api-key"
const mockAuthorize = vi.fn()
vi.mock("@/lib/pollen-auth", () => ({
    usePollenApiKey: () => mockApiKey,
    usePollenAuthActions: () => ({ authorize: mockAuthorize }),
    useNeedsReconnect: () => ({
        needsReconnect: false,
        setNeedsReconnect: vi.fn(),
    }),
    usePollenAuth: () => ({
        apiKey: mockApiKey,
        isAuthorized: true,
        isLoading: false,
    }),
}))

// Mock usePollenBalance hook
const mockInvalidateBalance = vi.fn()
vi.mock("@/hooks/use-pollen-balance", () => ({
    usePollenBalance: () => ({
        balance: 100,
        formattedBalance: "100.00",
        isLoading: false,
        isError: false,
        error: null,
        isLowBalance: false,
        refetch: vi.fn(),
        invalidateBalance: mockInvalidateBalance,
        isRefreshing: false,
    }),
}))

// Mock Convex API - provide full structure that the hook expects
vi.mock("@/convex/_generated/api", () => ({
    api: {
        singleGeneration: {
            startGeneration: "singleGeneration.startGeneration",
            dispatchGeneration: "singleGeneration.dispatchGeneration",
            getGenerationStatus: "singleGeneration.getGenerationStatus",
            getGenerationsStatus: "singleGeneration.getGenerationsStatus",
            cancelGeneration: "singleGeneration.cancelGeneration",
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
        mockGenerationStatus = null
        mockGeneratedImagesById.clear()
        mockStartGeneration.mockReset()
        mockCancelGeneration.mockReset()
        mockDispatchGeneration.mockReset()
        mockDispatchGeneration.mockResolvedValue(undefined)
        mockAuthorize.mockReset()
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
                duration: undefined,
                audio: undefined,
                aspectRatio: undefined,
                lastFrameImage: undefined,
            },
            apiKey: mockApiKey,
        })
        expect(mockDispatchGeneration).toHaveBeenCalledWith({
            generationId,
            apiKey: mockApiKey,
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
        mockGeneratedImagesById.set(imageId, {
            _id: imageId,
            url: "https://example.com/image.png",
            prompt: "test prompt",
            generationParams: { prompt: "test prompt" },
            createdAt: Date.now(),
            r2Key: "r2/key",
            sizeBytes: 1024,
            contentType: "image/png",
        })

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
        mockGeneratedImagesById.set("img_123", {
            _id: "img_123",
            url: "https://example.com/image.png",
            prompt: "test",
            generationParams: { prompt: "test" },
            createdAt: Date.now(),
        })

        rerender()

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.progress).toBe(100)
    })

    it("resets state correctly", async () => {
        mockStartGeneration.mockResolvedValueOnce("gen_123")
        mockCancelGeneration.mockResolvedValue({ success: true })

        const { result, rerender } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        // Generate an image
        await act(async () => {
            result.current.generate({ prompt: "test" })
        })

        mockGenerationStatus = { status: "completed", imageId: "img_123" }
        mockGeneratedImagesById.set("img_123", {
            _id: "img_123",
            url: "https://example.com/image.png",
            prompt: "test",
            generationParams: { prompt: "test" },
            createdAt: Date.now(),
        })

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
            generationParams: {
                ...params,
                // Video params are not in this call since it's not a video
                duration: undefined,
                audio: undefined,
                aspectRatio: undefined,
                lastFrameImage: undefined,
            },
            apiKey: mockApiKey,
        })
    })

    // ======================================================================
    // Cancel / queue behavior for multi-single
    // ======================================================================

    it("handles cancelled generation status", async () => {
        const generationId = "gen_cancel"
        mockStartGeneration.mockResolvedValueOnce(generationId)

        const onSettled = vi.fn()
        const { result, rerender } = renderHook(
            () => useGenerateImage({ onSettled }),
            { wrapper: TestWrapper }
        )

        await act(async () => {
            result.current.generate({ prompt: "test cancel" })
        })

        expect(result.current.isGenerating).toBe(true)

        // Simulate backend marking it cancelled
        mockGenerationStatus = { status: "cancelled" }

        rerender()

        await waitFor(() => {
            expect(result.current.isGenerating).toBe(false)
        })

        // Should not be error or success — just settled with no image
        expect(result.current.isError).toBe(false)
        expect(result.current.isSuccess).toBe(false)
        expect(result.current.currentGenerationId).toBeNull()
        expect(onSettled).toHaveBeenCalledWith(undefined, null, { prompt: "test cancel" })
    })

    it("cancelGenerationById calls cancel mutation and resets matching id", async () => {
        const generationId = "gen_to_cancel"
        mockStartGeneration.mockResolvedValueOnce(generationId)
        mockCancelGeneration.mockResolvedValueOnce({ success: true })

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        await act(async () => {
            result.current.generate({ prompt: "test" })
        })

        expect(result.current.isGenerating).toBe(true)

        await act(async () => {
            await result.current.cancelGenerationById(generationId as never)
        })

        // After cancel of current ID, should reset generating state
        expect(result.current.isGenerating).toBe(false)
        expect(result.current.currentGenerationId).toBeNull()
    })

    it("cancelGenerationById does not reset state for a different id", async () => {
        const generationId = "gen_current"
        mockStartGeneration.mockResolvedValueOnce(generationId)
        mockCancelGeneration.mockResolvedValueOnce({ success: true })

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        await act(async () => {
            result.current.generate({ prompt: "test" })
        })

        expect(result.current.isGenerating).toBe(true)

        // Cancel a *different* generation id
        await act(async () => {
            await result.current.cancelGenerationById("gen_other" as never)
        })

        // Current generation should still be tracked
        expect(result.current.isGenerating).toBe(true)
        expect(result.current.currentGenerationId).toBe(generationId)
    })

    // ======================================================================
    // Overlapping generations: second generate() supersedes the first
    // ======================================================================

    it("tracks multiple generations without blocking", async () => {
        mockStartGeneration
            .mockResolvedValueOnce("gen_first")
            .mockResolvedValueOnce("gen_second")

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        await act(async () => {
            result.current.generate({ prompt: "first" })
        })
        expect(result.current.currentGenerationId).toBe("gen_first")
        expect(result.current.isGenerating).toBe(true)

        await act(async () => {
            result.current.generate({ prompt: "second" })
        })
        expect(result.current.currentGenerationId).toBe("gen_second")
        expect(result.current.isGenerating).toBe(true)
    })

    // ======================================================================
    // Callback stability: callbacks updated between renders are picked up
    // ======================================================================

    it("picks up updated callbacks via ref without re-fire", async () => {
        const generationId = "gen_cb"
        const imageId = "img_cb"
        mockStartGeneration.mockResolvedValueOnce(generationId)

        const onSuccessFirst = vi.fn()
        const onSuccessSecond = vi.fn()

        const { result, rerender } = renderHook(
            ({ cb }: { cb: typeof onSuccessFirst }) => useGenerateImage({ onSuccess: cb }),
            { wrapper: TestWrapper, initialProps: { cb: onSuccessFirst } }
        )

        await act(async () => {
            result.current.generate({ prompt: "test" })
        })

        // Swap callback before completion
        rerender({ cb: onSuccessSecond })

        // Complete generation
        mockGenerationStatus = { status: "completed", imageId }
        mockGeneratedImagesById.set(imageId, {
            _id: imageId,
            url: "https://example.com/img.png",
            prompt: "test",
            generationParams: { prompt: "test" },
            createdAt: Date.now(),
        })

        rerender({ cb: onSuccessSecond })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        // Only the *latest* callback should have been called
        expect(onSuccessFirst).not.toHaveBeenCalled()
        expect(onSuccessSecond).toHaveBeenCalledTimes(1)
    })

    // ======================================================================
    // onMutate error handling
    // ======================================================================

    it("handles synchronous onMutate throw by setting error state and rejecting deferred", async () => {
        const onMutate = vi.fn(() => {
            throw new Error("onMutate exploded")
        })
        const onError = vi.fn()
        const onSettled = vi.fn()

        const { result } = renderHook(
            () => useGenerateImage({ onMutate, onError, onSettled }),
            { wrapper: TestWrapper }
        )

        let rejectedError: unknown
        await act(async () => {
            result.current.generateAsync({ prompt: "test" }).catch((e) => {
                rejectedError = e
            })
        })

        // Should not have called startGeneration
        expect(mockStartGeneration).not.toHaveBeenCalled()

        // Should set hook error state
        expect(result.current.isError).toBe(true)
        expect(result.current.error?.code).toBe("MUTATE_CALLBACK_FAILED")
        expect(result.current.error?.message).toBe("onMutate exploded")

        // Should call onError and onSettled
        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({ code: "MUTATE_CALLBACK_FAILED" }),
            { prompt: "test" }
        )
        expect(onSettled).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({ code: "MUTATE_CALLBACK_FAILED" }),
            { prompt: "test" }
        )

        // Deferred should have been rejected
        expect(rejectedError).toBeInstanceOf(ServerGenerationError)
    })

    it("handles async onMutate rejection by setting error state", async () => {
        const onMutate = vi.fn(async () => {
            throw new Error("async onMutate failed")
        })
        const onError = vi.fn()

        const { result } = renderHook(
            () => useGenerateImage({ onMutate, onError }),
            { wrapper: TestWrapper }
        )

        await act(async () => {
            result.current.generate({ prompt: "test" })
        })

        expect(mockStartGeneration).not.toHaveBeenCalled()
        expect(result.current.isError).toBe(true)
        expect(result.current.error?.code).toBe("MUTATE_CALLBACK_FAILED")
        expect(onError).toHaveBeenCalled()
    })

    // ======================================================================
    // cancelGenerationById error handling
    // ======================================================================

    it("cancelGenerationById does not remove local state when server returns success: false", async () => {
        const generationId = "gen_already_done"
        mockStartGeneration.mockResolvedValueOnce(generationId)
        mockCancelGeneration.mockResolvedValueOnce({ success: false })

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        await act(async () => {
            result.current.generate({ prompt: "test" })
        })

        expect(result.current.isGenerating).toBe(true)

        await act(async () => {
            await result.current.cancelGenerationById(generationId as never)
        })

        // Local state should NOT be torn down since cancel was not successful
        expect(result.current.isGenerating).toBe(true)
        expect(result.current.currentGenerationId).toBe(generationId)
    })

    it("cancelGenerationById throws ServerGenerationError when server call fails", async () => {
        const generationId = "gen_fail_cancel"
        mockStartGeneration.mockResolvedValueOnce(generationId)
        mockCancelGeneration.mockRejectedValueOnce(new Error("Network error"))

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        await act(async () => {
            result.current.generate({ prompt: "test" })
        })

        expect(result.current.isGenerating).toBe(true)

        let thrownError: unknown
        await act(async () => {
            try {
                await result.current.cancelGenerationById(generationId as never)
            } catch (e) {
                thrownError = e
            }
        })

        // Should throw a ServerGenerationError with CANCEL_FAILED code
        expect(thrownError).toBeInstanceOf(ServerGenerationError)
        expect((thrownError as ServerGenerationError).code).toBe("CANCEL_FAILED")

        // Local state should NOT be removed
        expect(result.current.isGenerating).toBe(true)
        expect(result.current.currentGenerationId).toBe(generationId)
    })

    // ======================================================================
    // reset() calls server cancellation
    // ======================================================================

    it("reset() calls server cancellation for each active generation", async () => {
        mockStartGeneration
            .mockResolvedValueOnce("gen_r1")
            .mockResolvedValueOnce("gen_r2")
        mockCancelGeneration.mockResolvedValue({ success: true })

        const { result } = renderHook(() => useGenerateImage(), {
            wrapper: TestWrapper,
        })

        await act(async () => {
            result.current.generate({ prompt: "first" })
        })
        await act(async () => {
            result.current.generate({ prompt: "second" })
        })

        expect(result.current.isGenerating).toBe(true)

        act(() => {
            result.current.reset()
        })

        // Should have called cancelGeneration for each active generation
        expect(mockCancelGeneration).toHaveBeenCalledTimes(2)
        expect(mockCancelGeneration).toHaveBeenCalledWith({ generationId: "gen_r1" })
        expect(mockCancelGeneration).toHaveBeenCalledWith({ generationId: "gen_r2" })

        // State should be fully reset
        expect(result.current.isGenerating).toBe(false)
        expect(result.current.isSuccess).toBe(false)
        expect(result.current.data).toBeUndefined()
        expect(result.current.error).toBeNull()
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
