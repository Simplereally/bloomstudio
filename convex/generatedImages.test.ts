import { describe, it, expect, vi, beforeEach } from "vitest";
import { create, getById, setVisibility, remove, getMyImages } from "./generatedImages";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    mutation: (config: any) => config,
    query: (config: any) => config,
    internalMutation: (config: any) => config,
    internalQuery: (config: any) => config,
}));

vi.mock("./_generated/api", () => ({
    internal: {
        promptInference: {
            analyzePromptImage: "analyzePromptImage",
        },
    },
}));

vi.mock("./lib/nsfwDetection", () => ({
    analyzePromptForNSFW: vi.fn(),
}));

describe("generatedImages", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCtx = {
            auth: {
                getUserIdentity: vi.fn(),
            },
            db: {
                insert: vi.fn().mockResolvedValue("image_id_123"),
                get: vi.fn(),
                query: vi.fn().mockReturnValue({
                    withIndex: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    paginate: vi.fn().mockResolvedValue({
                        page: [],
                        isDone: true,
                        continueCursor: "",
                    }),
                    filter: vi.fn().mockReturnThis(),
                    unique: vi.fn(),
                    collect: vi.fn(),
                    take: vi.fn(),
                }),
                patch: vi.fn().mockResolvedValue(undefined),
                delete: vi.fn().mockResolvedValue(undefined),
            },
            scheduler: {
                runAfter: vi.fn().mockResolvedValue(undefined),
            },
        };
    });

    describe("create mutation", () => {
        const defaultArgs = {
            r2Key: "test-key",
            url: "https://example.com/test.jpg",
            filename: "test.jpg",
            contentType: "image/jpeg",
            sizeBytes: 1000,
            width: 1024,
            height: 512,
            prompt: "a beautiful sunset",
            model: "test-model",
            generationParams: { steps: 20 },
        };

        it("should throw error if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            // @ts-ignore
            await expect(create.handler(mockCtx, defaultArgs)).rejects.toThrow("Not authenticated");
        });

        it("should create an image with correct aspect ratio and NSFW flags", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            const { analyzePromptForNSFW } = await import("./lib/nsfwDetection");
            vi.mocked(analyzePromptForNSFW).mockReturnValue({
                isSensitive: false,
                confidence: 0.1,
                matchedTerms: [],
                detectionMethod: "keyword"
            });

            // @ts-ignore
            const result = await create.handler(mockCtx, defaultArgs);

            expect(result).toBe("image_id_123");
            expect(mockCtx.db.insert).toHaveBeenCalledWith("generatedImages", expect.objectContaining({
                ownerId: "user_123",
                aspectRatio: 2, // 1024 / 512
                isSensitive: null, // Confidence < 0.9
                sensitiveConfidence: 0.1,
            }));
            expect(mockCtx.db.insert).toHaveBeenCalledWith("generatedImageDetails", {
                imageId: "image_id_123",
                generationParams: defaultArgs.generationParams,
            });
            expect(mockCtx.scheduler.runAfter).toHaveBeenCalledWith(0, "analyzePromptImage", {
                imageId: "image_id_123",
                prompt: defaultArgs.prompt,
            });
        });

        it("should flag explicit NSFW content immediately", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            const { analyzePromptForNSFW } = await import("./lib/nsfwDetection");
            vi.mocked(analyzePromptForNSFW).mockReturnValue({
                isSensitive: true,
                confidence: 0.95,
                matchedTerms: ["nude"],
                detectionMethod: "explicit"
            });

            // @ts-ignore
            await create.handler(mockCtx, defaultArgs);

            expect(mockCtx.db.insert).toHaveBeenCalledWith("generatedImages", expect.objectContaining({
                isSensitive: true,
                sensitiveSource: "prompt_analysis",
                sensitiveConfidence: 0.95,
            }));
            expect(mockCtx.scheduler.runAfter).not.toHaveBeenCalled();
        });
    });

    describe("getById query", () => {
        it("should return null if image not found", async () => {
            mockCtx.db.get.mockResolvedValue(null);
            // @ts-ignore
            const result = await getById.handler(mockCtx, { imageId: "id" as any });
            expect(result).toBeNull();
        });

        it("should return public image for anyone", async () => {
            const mockImage = { _id: "id", visibility: "public", ownerId: "user_1" };
            mockCtx.db.get.mockResolvedValue(mockImage);
            // @ts-ignore
            const result = await getById.handler(mockCtx, { imageId: "id" as any });
            expect(result).toEqual(mockImage);
        });

        it("should return unlisted image only for owner", async () => {
            const mockImage = { _id: "id", visibility: "unlisted", ownerId: "user_123" };
            mockCtx.db.get.mockResolvedValue(mockImage);
            
            // Unauthorized
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            // @ts-ignore
            expect(await getById.handler(mockCtx, { imageId: "id" as any })).toBeNull();

            // Authorized
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            // @ts-ignore
            expect(await getById.handler(mockCtx, { imageId: "id" as any })).toEqual(mockImage);
        });
    });

    describe("getMyImages query", () => {
        it("should return empty results if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            // @ts-ignore
            const result = await getMyImages.handler(mockCtx, { paginationOpts: { numItems: 10, cursor: null } });
            expect(result.page).toHaveLength(0);
            expect(result.isDone).toBe(true);
        });

        it("should use by_owner index when no filters", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            const mockPaginate = vi.fn().mockResolvedValue({ page: [], isDone: true, continueCursor: "" });
            const mockWithIndex = vi.fn().mockReturnThis();
            const mockOrder = vi.fn().mockReturnThis();
            
            mockCtx.db.query.mockReturnValue({
                withIndex: mockWithIndex,
                order: mockOrder,
                paginate: mockPaginate,
            });

            // @ts-ignore
            await getMyImages.handler(mockCtx, { paginationOpts: { numItems: 10, cursor: null } });

            expect(mockWithIndex).toHaveBeenCalledWith("by_owner", expect.any(Function));
            // Trigger the index function to verify its logic
            const indexFn = mockWithIndex.mock.calls[0][1];
            const q = { eq: vi.fn().mockReturnThis() };
            indexFn(q);
            expect(q.eq).toHaveBeenCalledWith("ownerId", "user_123");
        });
    });

    describe("setVisibility mutation", () => {
        it("should patch visibility if owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            mockCtx.db.get.mockResolvedValue({ _id: "id", ownerId: "user_123" });

            // @ts-ignore
            await setVisibility.handler(mockCtx, { imageId: "id" as any, visibility: "unlisted" });

            expect(mockCtx.db.patch).toHaveBeenCalledWith("id", { visibility: "unlisted" });
        });

        it("should throw error if not owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_other" });
            mockCtx.db.get.mockResolvedValue({ _id: "id", ownerId: "user_123" });

            // @ts-ignore
            await expect(setVisibility.handler(mockCtx, { imageId: "id" as any, visibility: "unlisted" }))
                .rejects.toThrow("Not authorized to modify this image");
        });
    });

    describe("remove mutation", () => {
        it("should delete and return R2 keys if owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            mockCtx.db.get.mockResolvedValue({ 
                _id: "id", 
                ownerId: "user_123", 
                r2Key: "key", 
                thumbnailR2Key: "thumb" 
            });

            // @ts-ignore
            const result = await remove.handler(mockCtx, { imageId: "id" as any });

            expect(mockCtx.db.delete).toHaveBeenCalledWith("id");
            expect(result).toEqual({ r2Key: "key", thumbnailR2Key: "thumb" });
        });
    });

    describe("setBulkVisibility mutation", () => {
        it("should update multiple images and return success count", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            mockCtx.db.get.mockImplementation(async (id) => {
                if (id === "id1") return { _id: "id1", ownerId: "user_123" };
                if (id === "id2") return { _id: "id2", ownerId: "user_123" };
                return null;
            });

            const { setBulkVisibility } = await import("./generatedImages");
            // @ts-ignore
            const result = await setBulkVisibility.handler(mockCtx, { 
                imageIds: ["id1", "id2"] as any, 
                visibility: "public" 
            });

            expect(result.successCount).toBe(2);
            expect(mockCtx.db.patch).toHaveBeenCalledTimes(2);
        });

        it("should skip images not owned by user", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            mockCtx.db.get.mockImplementation(async (id) => {
                if (id === "id1") return { _id: "id1", ownerId: "user_other" };
                return null;
            });

            const { setBulkVisibility } = await import("./generatedImages");
            // @ts-ignore
            const result = await setBulkVisibility.handler(mockCtx, { 
                imageIds: ["id1"] as any, 
                visibility: "public" 
            });

            expect(result.successCount).toBe(0);
            expect(result.errors).toBeDefined();
        });
    });

    describe("getPublicFeed query", () => {
        it("should filter by isSensitive when preference is 'block'", async () => {
            const mockWithIndex = vi.fn().mockReturnThis();
            const mockFilter = vi.fn().mockReturnThis();
            const mockPaginate = vi.fn().mockResolvedValue({ page: [], isDone: true, continueCursor: "" });
            
            mockCtx.db.query.mockReturnValue({
                withIndex: mockWithIndex,
                filter: mockFilter,
                order: vi.fn().mockReturnThis(),
                paginate: mockPaginate,
            });

            const { getPublicFeed } = await import("./generatedImages");
            // @ts-ignore
            await getPublicFeed.handler(mockCtx, { 
                paginationOpts: { numItems: 10, cursor: null },
                filterPreference: "block"
            });

            expect(mockWithIndex).toHaveBeenCalledWith("by_visibility_sensitive", expect.any(Function));
            const indexFn = mockWithIndex.mock.calls[0][1];
            const q = { eq: vi.fn().mockReturnThis() };
            indexFn(q);
            expect(q.eq).toHaveBeenCalledWith("visibility", "public");
            expect(q.eq).toHaveBeenCalledWith("isSensitive", false);
        });
    });

    describe("internal mutations", () => {
        it("updateImageSensitivity should patch image and details", async () => {
            const { updateImageSensitivity } = await import("./generatedImages");
            mockCtx.db.query.mockReturnValue({
                withIndex: vi.fn().mockReturnThis(),
                unique: vi.fn().mockResolvedValue({ _id: "detail_id" }),
            });

            // @ts-ignore
            await updateImageSensitivity.handler(mockCtx, {
                imageId: "id" as any,
                isSensitive: true,
                confidence: 0.99,
                contentAnalysis: { analyzedAt: 123, nudity: "high" }
            });

            expect(mockCtx.db.patch).toHaveBeenCalledWith("id", expect.objectContaining({
                isSensitive: true,
                sensitiveSource: "vision_analysis"
            }));
            expect(mockCtx.db.patch).toHaveBeenCalledWith("detail_id", expect.objectContaining({
                contentAnalysis: expect.any(Object)
            }));
        });
    });
});
