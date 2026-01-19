import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server functions
vi.mock("./_generated/server", () => ({
  internalQuery: (args: any) => args,
  internalMutation: (args: any) => args,
}));

import { findImagesToMigrate, migrateToNewThreshold, previewMigration } from "./sensitivityMigration";

describe("sensitivityMigration", () => {
    let mockCtx: any;
    let mockDb: any;
    let mockQuery: any;

    beforeEach(() => {
        mockQuery = {
            filter: vi.fn().mockReturnThis(),
            take: vi.fn().mockReturnThis(),
            collect: vi.fn().mockResolvedValue([]),
            first: vi.fn().mockResolvedValue(null),
        };
        mockDb = {
            query: vi.fn().mockReturnValue(mockQuery),
            patch: vi.fn(),
        };
        mockCtx = {
            db: mockDb,
        };

        // Mock query builder helper for filter
        // q.and, q.eq, q.field, q.lt
        const qHelper = {
            and: vi.fn(),
            eq: vi.fn(),
            field: vi.fn(),
            lt: vi.fn(),
        };
        mockQuery.filter.mockImplementation((cb: any) => {
            cb(qHelper);
            return mockQuery;
        });
    });

    describe("findImagesToMigrate", () => {
        it("should return mapped images", async () => {
             const mockImages = [
                 { _id: "id1", sensitiveConfidence: 0.6 },
                 { _id: "id2", sensitiveConfidence: 0.7 }
             ];
             mockQuery.collect.mockResolvedValue(mockImages);
             
             // Since 'take' returns a Promise (or rather the chain executes), we mock take behavior.
             // Wait, in findImagesToMigrate: .take(args.limit) returns Promise<Doc[]>.
             // So take should resolve.
             mockQuery.take.mockResolvedValue(mockImages);

             const result = await (findImagesToMigrate as any).handler(mockCtx, { limit: 10 });
             
             expect(result).toEqual([
                 { _id: "id1", sensitiveConfidence: 0.6 },
                 { _id: "id2", sensitiveConfidence: 0.7 }
             ]);
             expect(mockDb.query).toHaveBeenCalledWith("generatedImages");
        });
    });

    describe("migrateToNewThreshold", () => {
        it("should migrate images and return stats", async () => {
            const mockImages = [
                { _id: "id1", sensitiveConfidence: 0.6 },
                { _id: "id2", sensitiveConfidence: 0.7 }
            ];
            // Mock taking batch
            mockQuery.take.mockResolvedValue(mockImages);
            // Mock check remaining - return null (no more)
            mockQuery.first.mockResolvedValue(null);

            const result = await (migrateToNewThreshold as any).handler(mockCtx);

            expect(mockDb.patch).toHaveBeenCalledTimes(2);
            expect(mockDb.patch).toHaveBeenCalledWith("id1", { isSensitive: false });
            expect(mockDb.patch).toHaveBeenCalledWith("id2", { isSensitive: false });
            
            expect(result).toEqual({ migrated: 2, remaining: false });
        });

        it("should handle empty batch", async () => {
            mockQuery.take.mockResolvedValue([]);
            
            const result = await (migrateToNewThreshold as any).handler(mockCtx);
            
            expect(mockDb.patch).not.toHaveBeenCalled();
            expect(result).toEqual({ migrated: 0, remaining: false });
        });
        
        it("should indicate remaining if more exist", async () => {
             const mockImages = [{ _id: "id1", sensitiveConfidence: 0.6 }];
             mockQuery.take.mockResolvedValue(mockImages);
             mockQuery.first.mockResolvedValue({ _id: "id2" }); // Has more

             const result = await (migrateToNewThreshold as any).handler(mockCtx);
             
             expect(result).toEqual({ migrated: 1, remaining: true });
        });
    });
    
    describe("previewMigration", () => {
        it("should calculate stats correctly", async () => {
            const mockImages = [
                { _id: "id1", sensitiveConfidence: 0.55 }, // 0.5-0.6
                { _id: "id2", sensitiveConfidence: 0.65 }, // 0.6-0.7
                { _id: "id3", sensitiveConfidence: 0.75 }, // 0.7-0.8
                { _id: "id4", sensitiveConfidence: 0.95 }, // Should theoretically not be picked by filter, but logic assumes filter did its job.
                                                           // The test mocks 'collect' result directly.
            ];
            mockQuery.collect.mockResolvedValue(mockImages);
            
            const result = await (previewMigration as any).handler(mockCtx);
            
            expect(result.totalAffected).toBe(4);
            expect(result.byConfidenceRange["0.5-0.6"]).toBe(1);
            expect(result.byConfidenceRange["0.6-0.7"]).toBe(1);
            expect(result.byConfidenceRange["0.7-0.8"]).toBe(1);
            expect(result.sampleIds).toEqual(["id1", "id2", "id3", "id4"]);
        });
    });
});
