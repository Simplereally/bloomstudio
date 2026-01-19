import { describe, it, expect, vi, beforeEach } from "vitest";
import { auditOrphanedR2Objects, cleanupOrphanedR2Objects, scheduledCleanup } from "./orphanCleanup";
import { internal } from "./_generated/api";

// Mock environment variables
process.env.R2_ACCOUNT_ID = "test-account";
process.env.R2_ACCESS_KEY_ID = "test-access-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
process.env.R2_BUCKET_NAME = "test-bucket";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    internalAction: (config: any) => config,
}));

// Mock API references
vi.mock("./_generated/api", () => ({
    internal: {
        orphanCleanup: {
            auditOrphanedR2Objects: "auditOrphanedR2Objects",
            cleanupOrphanedR2Objects: "cleanupOrphanedR2Objects",
        },
        orphanCleanupQueries: {
            getAllR2Keys: "getAllR2Keys",
        },
    },
}));

// Mock S3 Client
const {
    mockS3Send,
    mockDeleteObjectsConstructor,
} = vi.hoisted(() => ({
    mockS3Send: vi.fn(),
    mockDeleteObjectsConstructor: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => ({
    S3Client: class {
        send = mockS3Send;
    },
    ListObjectsV2Command: class { constructor(public args: any) {} },
    DeleteObjectsCommand: class { 
        constructor(public args: any) {
            mockDeleteObjectsConstructor(args);
        }
    },
}));


describe("orphanCleanup actions", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCtx = {
            runQuery: vi.fn(),
            runAction: vi.fn(),
        };
    });

    describe("auditOrphanedR2Objects", () => {
        it("should correctly identify orphaned objects", async () => {
            // Mock listing R2 objects
            // We have 3 prefixes: generated/, thumbnails/, reference/
            mockS3Send.mockResolvedValueOnce({
                Contents: [
                    { Key: "generated/match1", Size: 100, LastModified: new Date() },
                    { Key: "generated/orphan1", Size: 200, LastModified: new Date() },
                ],
                NextContinuationToken: undefined,
            }).mockResolvedValueOnce({
                Contents: [
                    { Key: "thumbnails/match2", Size: 50 },
                ],
            }).mockResolvedValueOnce({
                Contents: [],
            });

            // Mock Convex keys
            mockCtx.runQuery.mockResolvedValue(["generated/match1", "thumbnails/match2"]);

            console.log("Calling auditOrphanedR2Objects.handler...");
            const result = await auditOrphanedR2Objects.handler(mockCtx, {});
            console.log("Result:", result);

            console.log("Result errors:", result.errors);
            expect(result.errors).toEqual([]);
            expect(mockS3Send).toHaveBeenCalled();
            expect(result.totalR2Objects).toBe(3);
            expect(result.matchedObjects).toBe(2);
            expect(result.orphanedCount).toBe(1);
            expect(result.orphanedSizeBytes).toBe(200);
            expect(result.sampleOrphanedKeys).toEqual(["generated/orphan1"]);
        });

        it("should handle S3 list errors gracefully", async () => {
            mockS3Send.mockRejectedValue(new Error("S3 Timeout"));
            mockCtx.runQuery.mockResolvedValue([]);

            const result = await auditOrphanedR2Objects.handler(mockCtx, {});

            expect(result.errors).toHaveLength(3); // One for each prefix
            expect(result.orphanedCount).toBe(0);
        });
    });

    describe("cleanupOrphanedR2Objects", () => {
        it("should return early if no orphans found in audit", async () => {
            mockCtx.runAction.mockResolvedValue({
                orphanedCount: 0,
                totalR2Objects: 10,
                orphanedSizeBytes: 0,
                sampleOrphanedKeys: [],
            });

            const result = await cleanupOrphanedR2Objects.handler(mockCtx, { dryRun: false });

            expect(result.deletedCount).toBe(0);
            expect(mockS3Send).not.toHaveBeenCalled();
        });

        it("should not delete if dryRun is true", async () => {
            mockCtx.runAction.mockResolvedValue({
                orphanedCount: 5,
                totalR2Objects: 10,
                orphanedSizeBytes: 5000,
                sampleOrphanedKeys: ["key1"],
            });

            const result = await cleanupOrphanedR2Objects.handler(mockCtx, { dryRun: true });

            expect(result.deletedCount).toBe(0);
            expect(mockS3Send).not.toHaveBeenCalled();
        });

        it("should delete orphaned objects if dryRun is false", async () => {
            // Audit action mock result
            mockCtx.runAction.mockResolvedValue({
                orphanedCount: 1,
                totalR2Objects: 2,
                orphanedSizeBytes: 200,
                sampleOrphanedKeys: ["orphan1"],
            });

            // Second pass re-listing in handler
            mockS3Send.mockResolvedValueOnce({
                Contents: [{ Key: "match1" }, { Key: "orphan1" }],
            }).mockResolvedValueOnce({ Contents: [] }).mockResolvedValueOnce({ Contents: [] });

            // Convex keys again
            mockCtx.runQuery.mockResolvedValue(["match1"]);

            // Delete call mock
            mockS3Send.mockResolvedValueOnce({
                Deleted: [{ Key: "orphan1" }],
                Errors: [],
            });

            const result = await cleanupOrphanedR2Objects.handler(mockCtx, { dryRun: false });

            expect(result.deletedCount).toBe(1);
            expect(mockDeleteObjectsConstructor).toHaveBeenCalledWith(expect.objectContaining({
                Delete: expect.objectContaining({
                    Objects: [{ Key: "orphan1" }],
                }),
            }));
        });
    });

    describe("scheduledCleanup", () => {
        it("should call cleanupOrphanedR2Objects with dryRun: false", async () => {
            mockCtx.runAction.mockResolvedValue({
                totalR2Objects: 100,
                orphanedCount: 5,
                deletedCount: 5,
                orphanedSizeBytes: 1024 * 1024,
                failedDeletes: [],
            });

            await scheduledCleanup.handler(mockCtx, {});

            expect(mockCtx.runAction).toHaveBeenCalledWith(
                internal.orphanCleanup.cleanupOrphanedR2Objects,
                { dryRun: false }
            );
        });

        it("should log errors", async () => {
            mockCtx.runAction.mockRejectedValue(new Error("Cleanup failed"));
            
            await expect(scheduledCleanup.handler(mockCtx, {}))
                .rejects.toThrow("Cleanup failed");
        });
    });
});
