// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useBatchMode } from "./use-batch-mode"

// Mock dependencies
vi.mock("@/hooks/queries", () => ({
    useBatchGeneration: vi.fn(() => ({
        startBatch: vi.fn().mockResolvedValue("batch-123"),
        cancelBatch: vi.fn().mockResolvedValue(undefined),
        pauseBatch: vi.fn().mockResolvedValue(undefined),
        resumeBatch: vi.fn().mockResolvedValue(undefined),
        hasActiveBatch: false,
        activeBatches: [],
    })),
    useBatchProcessor: vi.fn(() => ({
        status: undefined,
        currentIndex: 0,
        totalCount: 0,
        completedCount: 0,
        isProcessing: false,
    })),
    useBatchJob: vi.fn(() => ({
        batchJob: null,
        isLoading: false,
    })),
}))

vi.mock("convex/react", () => ({
    useMutation: vi.fn(() => vi.fn().mockResolvedValue("image-id-123")),
}))

vi.mock("@/lib/errors", () => ({
    showErrorToast: vi.fn(),
}))

describe("useBatchMode", () => {
    const mockGenerateSeed = vi.fn(() => 12345)
    const mockAddImage = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn()
    })

    it("initializes with default values", () => {
        const { result } = renderHook(() =>
            useBatchMode({
                generateSeed: mockGenerateSeed,
                addImage: mockAddImage,
            })
        )

        expect(result.current.batchSettings).toEqual({
            enabled: false,
            count: 10,
        })
        expect(result.current.activeBatchId).toBeNull()
        expect(result.current.isBatchActive).toBe(false)
        expect(result.current.isBatchPaused).toBe(false)
        expect(result.current.batchStatus).toBeUndefined()
        expect(result.current.batchProgress).toEqual({
            currentIndex: 0,
            totalCount: 0,
            completedCount: 0,
        })
    })

    it("updates batch settings", () => {
        const { result } = renderHook(() =>
            useBatchMode({
                generateSeed: mockGenerateSeed,
                addImage: mockAddImage,
            })
        )

        act(() => {
            result.current.setBatchSettings({
                enabled: true,
                count: 5,
            })
        })

        expect(result.current.batchSettings).toEqual({
            enabled: true,
            count: 5,
        })
    })

    it("toggles batch mode enabled", () => {
        const { result } = renderHook(() =>
            useBatchMode({
                generateSeed: mockGenerateSeed,
                addImage: mockAddImage,
            })
        )

        act(() => {
            result.current.setBatchSettings((prev) => ({
                ...prev,
                enabled: !prev.enabled,
            }))
        })

        expect(result.current.batchSettings.enabled).toBe(true)
    })

    it("updates batch count", () => {
        const { result } = renderHook(() =>
            useBatchMode({
                generateSeed: mockGenerateSeed,
                addImage: mockAddImage,
            })
        )

        act(() => {
            result.current.setBatchSettings((prev) => ({
                ...prev,
                count: 20,
            }))
        })

        expect(result.current.batchSettings.count).toBe(20)
    })

    it("provides startBatchGeneration function", () => {
        const { result } = renderHook(() =>
            useBatchMode({
                generateSeed: mockGenerateSeed,
                addImage: mockAddImage,
            })
        )

        expect(typeof result.current.startBatchGeneration).toBe("function")
    })

    it("provides cancelBatchGeneration function", () => {
        const { result } = renderHook(() =>
            useBatchMode({
                generateSeed: mockGenerateSeed,
                addImage: mockAddImage,
            })
        )

        expect(typeof result.current.cancelBatchGeneration).toBe("function")
    })

    it("provides pauseBatchGeneration function", () => {
        const { result } = renderHook(() =>
            useBatchMode({
                generateSeed: mockGenerateSeed,
                addImage: mockAddImage,
            })
        )

        expect(typeof result.current.pauseBatchGeneration).toBe("function")
    })

    it("provides resumeBatchGeneration function", () => {
        const { result } = renderHook(() =>
            useBatchMode({
                generateSeed: mockGenerateSeed,
                addImage: mockAddImage,
            })
        )

        expect(typeof result.current.resumeBatchGeneration).toBe("function")
    })

    it("provides handleBatchGenerateItem function", () => {
        const { result } = renderHook(() =>
            useBatchMode({
                generateSeed: mockGenerateSeed,
                addImage: mockAddImage,
            })
        )

        expect(typeof result.current.handleBatchGenerateItem).toBe("function")
    })

    it("setActiveBatchId updates state", () => {
        const { result } = renderHook(() =>
            useBatchMode({
                generateSeed: mockGenerateSeed,
                addImage: mockAddImage,
            })
        )

        // Note: This is testing the setter directly, batch ID format may vary
        act(() => {
            result.current.setActiveBatchId(null)
        })

        expect(result.current.activeBatchId).toBeNull()
    })

    // handleBatchGenerateItem is now deprecated - processing happens server-side
    describe("handleBatchGenerateItem (deprecated)", () => {
        it("handleBatchGenerateItem is deprecated and always returns failure", async () => {
            const { result } = renderHook(() =>
                useBatchMode({
                    generateSeed: mockGenerateSeed,
                    addImage: mockAddImage,
                })
            )

            let response
            await act(async () => {
                response = await result.current.handleBatchGenerateItem(
                    { prompt: "Test prompt", model: "zimage", width: 1024, height: 1024 },
                    0
                )
            })

            // Deprecated function always returns failure
            expect(response).toEqual({ success: false })
        })

        it("handleBatchGenerateItem does not call fetch (processing happens server-side)", async () => {
            const mockFetch = vi.fn()
            global.fetch = mockFetch

            const { result } = renderHook(() =>
                useBatchMode({
                    generateSeed: mockGenerateSeed,
                    addImage: mockAddImage,
                })
            )

            await act(async () => {
                await result.current.handleBatchGenerateItem(
                    { prompt: "Test prompt", model: "zimage", width: 1024, height: 1024 },
                    0
                )
            })

            // Should not call fetch since processing happens on server
            expect(mockFetch).not.toHaveBeenCalled()
        })

        it("handleBatchGenerateItem does not call addImage", async () => {
            const { result } = renderHook(() =>
                useBatchMode({
                    generateSeed: mockGenerateSeed,
                    addImage: mockAddImage,
                })
            )

            await act(async () => {
                await result.current.handleBatchGenerateItem(
                    { prompt: "Test prompt", model: "zimage", width: 1024, height: 1024 },
                    0
                )
            })

            // Should not call addImage since processing happens on server
            expect(mockAddImage).not.toHaveBeenCalled()
        })
    })

    describe("pause/resume functionality", () => {
        it("isBatchPaused is true when batchJob status is paused", async () => {
            const { useBatchJob } = await import("@/hooks/queries")
            vi.mocked(useBatchJob).mockReturnValue({
                batchJob: {
                    _id: "batch-123" as unknown as import("@/convex/_generated/dataModel").Id<"batchJobs">,
                    _creationTime: Date.now(),
                    ownerId: "user-123",
                    status: "paused",
                    currentIndex: 3,
                    totalCount: 10,
                    completedCount: 3,
                    failedCount: 0,
                    generationParams: { prompt: "Test" },
                    imageIds: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
                isLoading: false,
            })

            const { result } = renderHook(() =>
                useBatchMode({
                    generateSeed: mockGenerateSeed,
                    addImage: mockAddImage,
                })
            )

            expect(result.current.isBatchPaused).toBe(true)
            expect(result.current.batchStatus).toBe("paused")
        })

        it("isBatchPaused is false when batchJob status is processing", async () => {
            const { useBatchJob } = await import("@/hooks/queries")
            vi.mocked(useBatchJob).mockReturnValue({
                batchJob: {
                    _id: "batch-123" as unknown as import("@/convex/_generated/dataModel").Id<"batchJobs">,
                    _creationTime: Date.now(),
                    ownerId: "user-123",
                    status: "processing",
                    currentIndex: 3,
                    totalCount: 10,
                    completedCount: 3,
                    failedCount: 0,
                    generationParams: { prompt: "Test" },
                    imageIds: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
                isLoading: false,
            })

            const { result } = renderHook(() =>
                useBatchMode({
                    generateSeed: mockGenerateSeed,
                    addImage: mockAddImage,
                })
            )

            expect(result.current.isBatchPaused).toBe(false)
            expect(result.current.batchStatus).toBe("processing")
        })

        it("batchProgress reflects paused state progress", async () => {
            const { useBatchJob } = await import("@/hooks/queries")
            vi.mocked(useBatchJob).mockReturnValue({
                batchJob: {
                    _id: "batch-123" as unknown as import("@/convex/_generated/dataModel").Id<"batchJobs">,
                    _creationTime: Date.now(),
                    ownerId: "user-123",
                    status: "paused",
                    currentIndex: 5,
                    totalCount: 20,
                    completedCount: 5,
                    failedCount: 0,
                    generationParams: { prompt: "Test" },
                    imageIds: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
                isLoading: false,
            })

            const { result } = renderHook(() =>
                useBatchMode({
                    generateSeed: mockGenerateSeed,
                    addImage: mockAddImage,
                })
            )

            expect(result.current.batchProgress).toEqual({
                currentIndex: 5,
                totalCount: 20,
                completedCount: 5,
            })
        })
    })
})
