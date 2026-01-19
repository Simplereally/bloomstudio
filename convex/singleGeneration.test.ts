import { describe, it, expect, vi, beforeEach } from "vitest";
import { startGeneration, getGenerationStatus, getActiveGenerations, storeGeneratedImage } from "./singleGeneration";
import { ConvexError } from "convex/values";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    mutation: (config: any) => config,
    query: (config: any) => config,
    internalMutation: (config: any) => config,
    internalQuery: (config: any) => config,
}));

vi.mock("./_generated/api", () => ({
    internal: {
        singleGenerationProcessor: {
            processGeneration: "processGeneration",
        },
        promptInference: {
            analyzePromptImage: "analyzePromptImage",
        },
    },
}));

vi.mock("./lib/nsfwDetection", () => ({
    analyzePromptForNSFW: vi.fn(),
}));

vi.mock("./lib/subscription", () => ({
    canUserGenerate: vi.fn(),
}));

describe("singleGeneration", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCtx = {
            auth: {
                getUserIdentity: vi.fn(),
            },
            db: {
                insert: vi.fn().mockResolvedValue("id_123"),
                get: vi.fn(),
                query: vi.fn().mockReturnValue({
                    withIndex: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    collect: vi.fn().mockResolvedValue([]),
                }),
                patch: vi.fn().mockResolvedValue(undefined),
            },
            scheduler: {
                runAfter: vi.fn().mockResolvedValue(undefined),
            },
        };
    });

    describe("startGeneration", () => {
        const defaultArgs = {
            generationParams: { prompt: "test prompt" },
            apiKey: "test-api-key",
        };

        it("should throw error if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            // @ts-ignore
            await expect(startGeneration.handler(mockCtx, defaultArgs)).rejects.toThrow("Not authenticated");
        });

        it("should throw ConvexError if apiKey is missing", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_1" });
            const args = { ...defaultArgs, apiKey: "" };
            // @ts-ignore
            await expect(startGeneration.handler(mockCtx, args)).rejects.toThrow(ConvexError);
        });

        it("should throw TRIAL_EXPIRED if subscription check fails", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_1" });
            const { canUserGenerate } = await import("./lib/subscription");
            vi.mocked(canUserGenerate).mockResolvedValue({ allowed: false, reason: "Trial expired" });

            // @ts-ignore
            await expect(startGeneration.handler(mockCtx, defaultArgs)).rejects.toThrow(ConvexError);
        });

        it("should create pending generation and schedule processor", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            const { canUserGenerate } = await import("./lib/subscription");
            vi.mocked(canUserGenerate).mockResolvedValue({ allowed: true });

            // @ts-ignore
            const result = await startGeneration.handler(mockCtx, defaultArgs);

            expect(result).toBe("id_123");
            expect(mockCtx.db.insert).toHaveBeenCalledWith("pendingGenerations", expect.objectContaining({
                ownerId: "user_123",
                status: "pending",
            }));
            expect(mockCtx.scheduler.runAfter).toHaveBeenCalledWith(0, "processGeneration", {
                generationId: "id_123",
                apiKey: "test-api-key",
            });
        });
    });

    describe("getGenerationStatus", () => {
        it("should return generation if owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            const mockGen = { _id: "id", ownerId: "user_123", status: "pending" };
            mockCtx.db.get.mockResolvedValue(mockGen);

            // @ts-ignore
            const result = await getGenerationStatus.handler(mockCtx, { generationId: "id" as any });
            expect(result).toEqual(mockGen);
        });

        it("should return null if not owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_other" });
            mockCtx.db.get.mockResolvedValue({ _id: "id", ownerId: "user_123" });

            // @ts-ignore
            const result = await getGenerationStatus.handler(mockCtx, { generationId: "id" as any });
            expect(result).toBeNull();
        });
    });

    describe("getActiveGenerations", () => {
        it("should return sorted pending and processing generations", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_123" });
            
            const pending = [{ _id: "p1", createdAt: 100 }];
            const processing = [{ _id: "p2", createdAt: 200 }];

            mockCtx.db.query.mockReturnValue({
                withIndex: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                collect: vi.fn()
                    .mockResolvedValueOnce(pending)
                    .mockResolvedValueOnce(processing),
            });

            // @ts-ignore
            const result = await getActiveGenerations.handler(mockCtx, {});

            expect(result).toHaveLength(2);
            expect(result[0]._id).toBe("p2"); // Higher createdAt first
            expect(result[1]._id).toBe("p1");
        });
    });

    describe("storeGeneratedImage", () => {
        const defaultArgs = {
            ownerId: "user_123",
            r2Key: "key",
            url: "url",
            prompt: "test prompt",
            width: 1024,
            height: 512,
            model: "model",
            contentType: "image/png",
            sizeBytes: 1000,
            generationParams: {},
            visibility: "public" as const,
        };

        it("should insert image and details with correct aspect ratio", async () => {
            const { analyzePromptForNSFW } = await import("./lib/nsfwDetection");
            vi.mocked(analyzePromptForNSFW).mockReturnValue({
                isSensitive: false,
                confidence: 0.1,
                matchedTerms: [],
                detectionMethod: "keyword"
            });

            // @ts-ignore
            const result = await storeGeneratedImage.handler(mockCtx, defaultArgs);

            expect(result).toBe("id_123");
            expect(mockCtx.db.insert).toHaveBeenCalledWith("generatedImages", expect.objectContaining({
                aspectRatio: 2,
                isSensitive: null,
            }));
            expect(mockCtx.db.insert).toHaveBeenCalledWith("generatedImageDetails", {
                imageId: "id_123",
                generationParams: {},
            });
            expect(mockCtx.scheduler.runAfter).toHaveBeenCalledWith(0, "analyzePromptImage", expect.any(Object));
        });
    });
});
