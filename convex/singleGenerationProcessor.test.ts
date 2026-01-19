import { describe, it, expect, vi, beforeEach } from "vitest";
import { processGeneration } from "./singleGenerationProcessor";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    internalAction: (config: any) => config,
}));

vi.mock("./_generated/api", () => ({
    internal: {
        singleGeneration: {
            getGenerationInternal: "getGenerationInternal",
            updateGenerationStatus: "updateGenerationStatus",
            storeGeneratedImage: "storeGeneratedImage",
        },
    },
}));

vi.mock("./lib", () => ({
    buildPollinationsUrl: vi.fn(() => "https://pollinations.ai/test"),
    classifyApiError: vi.fn(() => ({ isRetryable: true })),
    generateR2Key: vi.fn(() => "test-r2-key"),
    generateThumbnailKey: vi.fn(() => "test-thumb-key"),
    generatePreviewKey: vi.fn(() => "test-preview-key"),
    uploadMediaWithThumbnail: vi.fn().mockResolvedValue({
        media: { url: "https://r2.com/test.jpg", sizeBytes: 100 },
        thumbnail: { url: "https://r2.com/thumb.jpg", sizeBytes: 50 },
        preview: { url: "https://r2.com/preview.mp4", sizeBytes: 200 },
    }),
    fetchWithRetry: vi.fn(),
}));

describe("singleGenerationProcessor", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCtx = {
            runQuery: vi.fn(),
            runMutation: vi.fn(),
        };
    });

    it("should process generation successfully", async () => {
        const generationId = "gen123" as any;
        const apiKey = "test-api-key";
        const generation = {
            ownerId: "user1",
            status: "pending",
            generationParams: { prompt: "test" },
        };

        mockCtx.runQuery.mockImplementation(async (method: any) => {
            if (method === "getGenerationInternal") return generation;
            return null;
        });

        mockCtx.runMutation.mockImplementation(async (method: any) => {
            if (method === "storeGeneratedImage") return "img123";
            return null;
        });

        const { fetchWithRetry } = await import("./lib");
        vi.mocked(fetchWithRetry).mockResolvedValue({
            success: true,
            data: {
                arrayBuffer: async () => new ArrayBuffer(8),
                headers: { get: () => "image/jpeg" },
            },
            attemptsMade: 1,
            lastStatus: 200,
        });

        // @ts-ignore
        await processGeneration.handler(mockCtx, { generationId, apiKey });

        expect(mockCtx.runMutation).toHaveBeenCalledWith("updateGenerationStatus", expect.objectContaining({
            status: "processing",
        }));
        expect(mockCtx.runMutation).toHaveBeenCalledWith("storeGeneratedImage", expect.objectContaining({
            url: "https://r2.com/test.jpg",
        }));
        expect(mockCtx.runMutation).toHaveBeenCalledWith("updateGenerationStatus", expect.objectContaining({
            status: "completed",
            imageId: expect.any(String),
        }));
    });

    it("should handle non-pending status", async () => {
        mockCtx.runQuery.mockResolvedValue({ status: "processing" });

        // @ts-ignore
        await processGeneration.handler(mockCtx, { generationId: "id" as any, apiKey: "key" });

        expect(mockCtx.runMutation).not.toHaveBeenCalled();
    });

    it("should handle missing API key", async () => {
        mockCtx.runQuery.mockResolvedValue({ status: "pending", ownerId: "user1" });

        // @ts-ignore
        await processGeneration.handler(mockCtx, { generationId: "id" as any, apiKey: "" });

        expect(mockCtx.runMutation).toHaveBeenCalledWith("updateGenerationStatus", expect.objectContaining({
            status: "failed",
            errorMessage: expect.stringContaining("No Pollinations API key"),
        }));
    });

    it("should handle Pollinations API failure", async () => {
        mockCtx.runQuery.mockResolvedValue({ 
            status: "pending", 
            ownerId: "user1",
            generationParams: { prompt: "test" }
        });

        const { fetchWithRetry } = await import("./lib");
        vi.mocked(fetchWithRetry).mockResolvedValue({
            success: false,
            error: "API Error",
            attemptsMade: 1,
            lastStatus: 500,
        });

        // @ts-ignore
        await processGeneration.handler(mockCtx, { generationId: "id" as any, apiKey: "key" });

        expect(mockCtx.runMutation).toHaveBeenCalledWith("updateGenerationStatus", expect.objectContaining({
            status: "failed",
            errorMessage: "API Error",
        }));
    });
});
