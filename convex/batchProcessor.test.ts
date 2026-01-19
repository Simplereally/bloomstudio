import { describe, it, expect, vi, beforeEach } from "vitest";
import { processBatchItem } from "./batchProcessor";
import { internal } from "./_generated/api";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    internalAction: (config: any) => config,
}));

// Mock API references
vi.mock("./_generated/api", () => ({
    internal: {
        batchGeneration: {
            scheduleNextBatchItem: "scheduleNextBatchItem",
            getBatchJobInternal: "getBatchJobInternal",
            decrementInFlightCount: "decrementInFlightCount",
            recordBatchItemResult: "recordBatchItemResult",
            storeGeneratedImage: "storeGeneratedImage",
        },
    },
}));

// Mock lib utilities
const {
    mockFetchWithRetry,
    mockUploadMediaWithThumbnail,
    mockBuildPollinationsUrl,
    mockGenerateR2Key,
    mockGenerateThumbnailKey,
    mockGeneratePreviewKey,
} = vi.hoisted(() => ({
    mockFetchWithRetry: vi.fn(),
    mockUploadMediaWithThumbnail: vi.fn(),
    mockBuildPollinationsUrl: vi.fn(() => "https://api.pollinations.ai/prompt"),
    mockGenerateR2Key: vi.fn(() => "user-id/image.jpg"),
    mockGenerateThumbnailKey: vi.fn(() => "user-id/image-thumb.jpg"),
    mockGeneratePreviewKey: vi.fn(() => "user-id/image-preview.jpg"),
}));

vi.mock("./lib", () => ({
    buildPollinationsUrl: mockBuildPollinationsUrl,
    classifyApiError: vi.fn((status) => ({ isRetryable: status >= 500 })),
    generateR2Key: mockGenerateR2Key,
    generateThumbnailKey: mockGenerateThumbnailKey,
    generatePreviewKey: mockGeneratePreviewKey,
    uploadMediaWithThumbnail: mockUploadMediaWithThumbnail,
    fetchWithRetry: mockFetchWithRetry,
}));

describe("processBatchItem action", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCtx = {
            runMutation: vi.fn(),
            runQuery: vi.fn(),
        };
    });

    const defaultBatchJob = {
        _id: "batch_id" as any,
        ownerId: "user_123",
        status: "processing",
        totalCount: 10,
        apiKey: "test-api-key",
        generationParams: {
            prompt: "a beautiful sunset",
            model: "flux",
            width: 1024,
            height: 1024,
            private: false,
        },
    };

    it("should process a batch item successfully (happy path)", async () => {
        // Arrange
        mockCtx.runQuery.mockResolvedValue(defaultBatchJob);
        mockFetchWithRetry.mockResolvedValue({
            success: true,
            data: {
                arrayBuffer: async () => new ArrayBuffer(8),
                headers: { get: () => "image/jpeg" },
            },
            attemptsMade: 1,
        });
        mockUploadMediaWithThumbnail.mockResolvedValue({
            media: { url: "https://r2.com/image.jpg", sizeBytes: 1234 },
            thumbnail: { url: "https://r2.com/thumb.jpg", sizeBytes: 567 },
            preview: { url: "https://r2.com/preview.jpg", sizeBytes: 890 },
        });
        mockCtx.runMutation.mockResolvedValue("image_id");

        // Act
        await (processBatchItem as any).handler(mockCtx, {
            batchJobId: "batch_id" as any,
            itemIndex: 0,
        });

        // Assert
        // 1. Scheduled next item
        expect(mockCtx.runMutation).toHaveBeenCalledWith(
            internal.batchGeneration.scheduleNextBatchItem,
            { batchJobId: "batch_id", currentItemIndex: 0 }
        );

        // 2. Fetched batch job
        expect(mockCtx.runQuery).toHaveBeenCalledWith(
            internal.batchGeneration.getBatchJobInternal,
            { batchJobId: "batch_id" }
        );

        // 3. Called Pollinations API
        expect(mockFetchWithRetry).toHaveBeenCalled();
        
        // 4. Uploaded to R2
        expect(mockUploadMediaWithThumbnail).toHaveBeenCalled();

        // 5. Stored generated image
        expect(mockCtx.runMutation).toHaveBeenCalledWith(
            internal.batchGeneration.storeGeneratedImage,
            expect.objectContaining({
                ownerId: "user_123",
                url: "https://r2.com/image.jpg",
                thumbnailUrl: "https://r2.com/thumb.jpg",
                prompt: "a beautiful sunset",
            })
        );

        // 6. Recorded result
        expect(mockCtx.runMutation).toHaveBeenCalledWith(
            internal.batchGeneration.recordBatchItemResult,
            {
                batchJobId: "batch_id",
                itemIndex: 0,
                success: true,
                imageId: "image_id",
                retryCount: undefined,
            }
        );
    });

    it("should stop if batch job is not found", async () => {
        mockCtx.runQuery.mockResolvedValue(null);

        await (processBatchItem as any).handler(mockCtx, {
            batchJobId: "invalid_id" as any,
            itemIndex: 0,
        });

        expect(mockFetchWithRetry).not.toHaveBeenCalled();
        expect(mockCtx.runMutation).not.toHaveBeenCalledWith(
            internal.batchGeneration.recordBatchItemResult,
            expect.any(Object)
        );
    });

    it("should stop and decrement in-flight if status is not pending/processing", async () => {
        mockCtx.runQuery.mockResolvedValue({
            ...defaultBatchJob,
            status: "cancelled",
        });

        await (processBatchItem as any).handler(mockCtx, {
            batchJobId: "batch_id" as any,
            itemIndex: 0,
        });

        expect(mockCtx.runMutation).toHaveBeenCalledWith(
            internal.batchGeneration.decrementInFlightCount,
            { batchJobId: "batch_id" }
        );
        expect(mockFetchWithRetry).not.toHaveBeenCalled();
    });

    it("should record error if API key is missing", async () => {
        mockCtx.runQuery.mockResolvedValue({
            ...defaultBatchJob,
            apiKey: "",
        });

        await (processBatchItem as any).handler(mockCtx, {
            batchJobId: "batch_id" as any,
            itemIndex: 0,
        });

        expect(mockCtx.runMutation).toHaveBeenCalledWith(
            internal.batchGeneration.recordBatchItemResult,
            expect.objectContaining({
                success: false,
                errorMessage: expect.stringContaining("No Pollinations API key"),
            })
        );
        expect(mockFetchWithRetry).not.toHaveBeenCalled();
    });

    it("should record error if Pollinations API fails", async () => {
        mockCtx.runQuery.mockResolvedValue(defaultBatchJob);
        mockFetchWithRetry.mockResolvedValue({
            success: false,
            error: "Rate limited",
            lastStatus: 429,
            attemptsMade: 3,
        });

        await (processBatchItem as any).handler(mockCtx, {
            batchJobId: "batch_id" as any,
            itemIndex: 0,
        });

        expect(mockCtx.runMutation).toHaveBeenCalledWith(
            internal.batchGeneration.recordBatchItemResult,
            expect.objectContaining({
                success: false,
                errorMessage: "Rate limited",
                errorCode: 429,
                retryCount: 2,
            })
        );
        expect(mockUploadMediaWithThumbnail).not.toHaveBeenCalled();
    });

    it("should handle exceptions during processing", async () => {
        mockCtx.runQuery.mockResolvedValue(defaultBatchJob);
        mockFetchWithRetry.mockRejectedValue(new Error("Network failure"));

        await (processBatchItem as any).handler(mockCtx, {
            batchJobId: "batch_id" as any,
            itemIndex: 0,
        });

        expect(mockCtx.runMutation).toHaveBeenCalledWith(
            internal.batchGeneration.recordBatchItemResult,
            expect.objectContaining({
                success: false,
                errorMessage: "Network failure",
            })
        );
    });

    it("should continue if scheduling next item fails", async () => {
        // Mock scheduling to fail
        mockCtx.runMutation.mockImplementation((name: any) => {
            if (name === internal.batchGeneration.scheduleNextBatchItem) {
                throw new Error("Scheduling failed");
            }
            if (name === internal.batchGeneration.recordBatchItemResult) {
                return Promise.resolve();
            }
            if (name === internal.batchGeneration.storeGeneratedImage) {
                return Promise.resolve("image_id");
            }
        });
        
        mockCtx.runQuery.mockResolvedValue(defaultBatchJob);
        mockFetchWithRetry.mockResolvedValue({
            success: true,
            data: {
                arrayBuffer: async () => new ArrayBuffer(8),
                headers: { get: () => "image/jpeg" },
            },
            attemptsMade: 1,
        });
        mockUploadMediaWithThumbnail.mockResolvedValue({
            media: { url: "https://r2.com/image.jpg", sizeBytes: 1234 },
        });

        await (processBatchItem as any).handler(mockCtx, {
            batchJobId: "batch_id" as any,
            itemIndex: 0,
        });

        // Should still have called fetch and upload
        expect(mockFetchWithRetry).toHaveBeenCalled();
        expect(mockUploadMediaWithThumbnail).toHaveBeenCalled();
        expect(mockCtx.runMutation).toHaveBeenCalledWith(
            internal.batchGeneration.recordBatchItemResult,
            expect.objectContaining({ success: true })
        );
    });
});
