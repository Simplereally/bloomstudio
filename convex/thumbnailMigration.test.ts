import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Convex server functions
vi.mock("./_generated/server", () => ({
  query: (config: any) => config,
  mutation: (config: any) => config,
}));

import {
  getImagesNeedingThumbnails,
  getAllImagesBatch,
  getMigrationStats,
  updateImageThumbnail,
  getVideoThumbnailStats,
  MIGRATION_BATCH_SIZE,
} from "./thumbnailMigration";

describe("thumbnailMigration", () => {
  let mockCtx: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      db: {
        query: vi.fn(),
        patch: vi.fn(),
      },
    };
  });

  describe("getImagesNeedingThumbnails", () => {
    it("should query for images without thumbnails", async () => {
      const mockQuery = {
        filter: vi.fn().mockReturnThis(),
        take: vi.fn().mockResolvedValue(["img1", "img2"]),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      const result = await getImagesNeedingThumbnails.handler(mockCtx, {});

      expect(mockCtx.db.query).toHaveBeenCalledWith("generatedImages");
      expect(mockQuery.filter).toHaveBeenCalled();
      expect(mockQuery.take).toHaveBeenCalledWith(MIGRATION_BATCH_SIZE);
      expect(result).toEqual(["img1", "img2"]);
    });

    it("should respect custom limit", async () => {
      const mockQuery = {
        filter: vi.fn().mockReturnThis(),
        take: vi.fn().mockResolvedValue([]),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      await getImagesNeedingThumbnails.handler(mockCtx, { limit: 50 });

      expect(mockQuery.take).toHaveBeenCalledWith(50);
    });
  });

  describe("getAllImagesBatch", () => {
    it("should return paginated images", async () => {
      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        paginate: vi.fn().mockResolvedValue({ page: [], isDone: true }),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      const paginationOpts = { cursor: null, numItems: 10 };
      await getAllImagesBatch.handler(mockCtx, { paginationOpts });

      expect(mockCtx.db.query).toHaveBeenCalledWith("generatedImages");
      expect(mockQuery.order).toHaveBeenCalledWith("desc");
      expect(mockQuery.paginate).toHaveBeenCalledWith(paginationOpts);
    });
  });

  describe("getMigrationStats", () => {
    it("should calculate stats correctly", async () => {
      const mockImages = [
        { thumbnailUrl: "url1" },
        { thumbnailUrl: undefined }, 
        { thumbnailUrl: "url2" },
        { thumbnailUrl: null },
      ];
      const mockQuery = {
        collect: vi.fn().mockResolvedValue(mockImages),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      const result = await getMigrationStats.handler(mockCtx, {});

      expect(result).toEqual({
        total: 4,
        withThumbnails: 2,
        needingThumbnails: 2,
        percentComplete: 50,
      });
    });

    it("should handle empty database", async () => {
      const mockQuery = {
        collect: vi.fn().mockResolvedValue([]),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      const result = await getMigrationStats.handler(mockCtx, {});

      expect(result).toEqual({
        total: 0,
        withThumbnails: 0,
        needingThumbnails: 0,
        percentComplete: 100,
      });
    });
  });

  describe("updateImageThumbnail", () => {
    it("should patch the image with thumbnail info", async () => {
      const args = {
        imageId: "img123",
        thumbnailR2Key: "key/123",
        thumbnailUrl: "https://example.com/thumb.jpg",
      };

      await updateImageThumbnail.handler(mockCtx, args);

      expect(mockCtx.db.patch).toHaveBeenCalledWith(args.imageId, {
        thumbnailR2Key: args.thumbnailR2Key,
        thumbnailUrl: args.thumbnailUrl,
      });
    });
  });

  describe("getVideoThumbnailStats", () => {
    it("should calculate video stats correctly", async () => {
        // Mock data: 2 videos (1 with thumb, 1 without), 1 image (should be ignored)
        const mockData = [
            { contentType: "video/mp4", thumbnailUrl: "url1" },
            { contentType: "video/webm", thumbnailUrl: undefined },
            { contentType: "image/png", thumbnailUrl: undefined }, // Should be filtered out by JS
        ];

        // The query filter for contentType != undefined happens first
        // We simulate the collect() returning potentially all items that match that filter
        // For this test, we assume the initial DB filter passes everything that has a contentType
        const mockQuery = {
            filter: vi.fn().mockReturnThis(),
            collect: vi.fn().mockResolvedValue(mockData), 
        };
        mockCtx.db.query.mockReturnValue(mockQuery);

        const result = await getVideoThumbnailStats.handler(mockCtx, {});

        expect(result).toEqual({
            totalVideos: 2,
            withThumbnails: 1,
            missingThumbnails: 1,
            percentComplete: 50,
        });
    });

    it("should handle no videos", async () => {
        const mockQuery = {
            filter: vi.fn().mockReturnThis(),
            collect: vi.fn().mockResolvedValue([
                { contentType: "image/png" }
            ]), 
        };
        mockCtx.db.query.mockReturnValue(mockQuery);

        const result = await getVideoThumbnailStats.handler(mockCtx, {});

        expect(result).toEqual({
            totalVideos: 0,
            withThumbnails: 0,
            missingThumbnails: 0,
            percentComplete: 100,
        });
    });
  });
});
