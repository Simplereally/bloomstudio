import { describe, it, expect, vi, beforeEach } from "vitest";
import { migrateAllImages } from "./thumbnailMigrationActions";

// Mock deps
vi.mock("./_generated/server", () => ({
    action: (config: any) => config,
}));

vi.mock("./_generated/api", () => ({
    api: {
        thumbnailMigration: {
            getMigrationStats: "getMigrationStats",
            getImagesNeedingThumbnails: "getImagesNeedingThumbnails",
            updateImageThumbnail: "updateImageThumbnail",
        },
    },
}));

// Mock fetch globally
const globalFetch = vi.fn();
// @ts-ignore
global.fetch = globalFetch;

vi.mock("./lib/r2", () => ({
    generateAndUploadThumbnail: vi.fn(),
    generateThumbnailKey: vi.fn((key) => `thumb-${key}`),
}));

describe("thumbnailMigrationActions", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCtx = {
            runQuery: vi.fn(),
            runMutation: vi.fn(),
        };
        // @ts-ignore
        globalFetch.mockReset();
    });

    it("should process images successfully", async () => {
        // Mock query results
        mockCtx.runQuery
            .mockResolvedValueOnce({ needingThumbnails: 2, total: 10 }) // getMigrationStats
            .mockResolvedValueOnce([
                { _id: "img1", r2Key: "key1", url: "url1", contentType: "image/jpeg" },
                { _id: "img2", r2Key: "key2", url: "url2", contentType: "image/jpeg" },
            ]) // getImagesNeedingThumbnails
            .mockResolvedValueOnce([]); // No more images

        // Mock fetch success
        const mockArrayBuffer = new ArrayBuffer(8);
        globalFetch.mockResolvedValue({
            ok: true,
            arrayBuffer: async () => mockArrayBuffer,
        });

        // Mock thumbnail generation success
        const { generateAndUploadThumbnail } = await import("./lib/r2");
        vi.mocked(generateAndUploadThumbnail).mockResolvedValue({
            url: "https://thumb-url",
            sizeBytes: 100,
        });

        // @ts-ignore
        const result = await migrateAllImages.handler(mockCtx, {});

        expect(result).toEqual({
            totalProcessed: 2,
            totalSuccess: 2,
            totalFailed: 0,
        });

        expect(mockCtx.runMutation).toHaveBeenCalledTimes(2);
        expect(mockCtx.runMutation).toHaveBeenCalledWith("updateImageThumbnail", expect.objectContaining({
            imageId: "img1",
            thumbnailUrl: "https://thumb-url",
        }));
    });

    it("should handle mixed success and failure", async () => {
         mockCtx.runQuery
            .mockResolvedValueOnce({ needingThumbnails: 2, total: 10 })
            .mockResolvedValueOnce([
                { _id: "img1", r2Key: "key1", url: "url1", contentType: "image/jpeg" },
                { _id: "img2", r2Key: "key2", url: "url2", contentType: "image/jpeg" },
            ])
            .mockResolvedValueOnce([]);

        // img1 succeeds
        globalFetch.mockResolvedValueOnce({
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(8),
        });

        // img2 fails fetch
        globalFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
        });

        const { generateAndUploadThumbnail } = await import("./lib/r2");
        vi.mocked(generateAndUploadThumbnail).mockResolvedValue({
            url: "https://thumb-url",
            sizeBytes: 100,
        });

        // @ts-ignore
        const result = await migrateAllImages.handler(mockCtx, {});

        expect(result).toEqual({
            totalProcessed: 2,
            totalSuccess: 1,
            totalFailed: 1,
        });

        expect(mockCtx.runMutation).toHaveBeenCalledTimes(1);
    });

    it("should stop if no images found", async () => {
        mockCtx.runQuery
            .mockResolvedValueOnce({ needingThumbnails: 0, total: 10 })
            .mockResolvedValueOnce([]);

        // @ts-ignore
        const result = await migrateAllImages.handler(mockCtx, {});

        expect(result).toEqual({
            totalProcessed: 0,
            totalSuccess: 0,
            totalFailed: 0,
        });
    });

    it("should handle thumbnail generation failure", async () => {
        mockCtx.runQuery
            .mockResolvedValueOnce({ needingThumbnails: 1, total: 10 })
            .mockResolvedValueOnce([
                { _id: "img1", r2Key: "key1", url: "url1", contentType: "image/jpeg" }
            ])
            .mockResolvedValueOnce([]);

        globalFetch.mockResolvedValue({
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(8),
        });

        const { generateAndUploadThumbnail } = await import("./lib/r2");
        vi.mocked(generateAndUploadThumbnail).mockResolvedValue(null);

        // @ts-ignore
        const result = await migrateAllImages.handler(mockCtx, {});

        expect(result).toEqual({
            totalProcessed: 1,
            totalSuccess: 0,
            totalFailed: 1,
        });

        expect(mockCtx.runMutation).not.toHaveBeenCalled();
    });
});
