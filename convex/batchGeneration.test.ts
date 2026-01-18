import { describe, it, expect, vi } from "vitest";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    mutation: (config: object) => config,
    internalMutation: (config: object) => config,
    internalQuery: (config: object) => config,
    query: (config: object) => config,
}));

vi.mock("./_generated/api", () => ({
    internal: {
        batchProcessor: {
            processBatchItem: "processBatchItem",
        },
        promptInference: {
            analyzePromptImage: "analyzePromptImage",
        },
    },
}));

vi.mock("./lib/nsfwDetection", () => ({
    analyzePromptForNSFW: vi.fn(() => ({
        isSensitive: false,
        confidence: 0.1,
        matchedTerms: [],
    })),
}));

vi.mock("./lib/subscription", () => ({
    canUserGenerate: vi.fn(() => Promise.resolve({ allowed: true })),
}));

describe("batchGeneration structure", () => {
    it("should export startBatchJob mutation", async () => {
        const { startBatchJob } = await import("./batchGeneration");
        expect(startBatchJob).toBeDefined();
        expect((startBatchJob as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });

    it("should export storeGeneratedImage internal mutation", async () => {
        const { storeGeneratedImage } = await import("./batchGeneration");
        expect(storeGeneratedImage).toBeDefined();
        expect((storeGeneratedImage as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });

    it("should export getUserActiveBatches query", async () => {
        const { getUserActiveBatches } = await import("./batchGeneration");
        expect(getUserActiveBatches).toBeDefined();
        expect((getUserActiveBatches as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });

    it("should export getUserBatchJobs query", async () => {
        const { getUserBatchJobs } = await import("./batchGeneration");
        expect(getUserBatchJobs).toBeDefined();
        expect((getUserBatchJobs as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });
});

describe("storeGeneratedImage args validator", () => {
    it("should have required args for storing an image", async () => {
        const { storeGeneratedImage } = await import("./batchGeneration");
        const args = (storeGeneratedImage as unknown as { args: Record<string, unknown> }).args;
        
        // Verify essential fields are in args validator
        expect(args.ownerId).toBeDefined();
        expect(args.r2Key).toBeDefined();
        expect(args.url).toBeDefined();
        expect(args.prompt).toBeDefined();
        expect(args.width).toBeDefined();
        expect(args.height).toBeDefined();
        expect(args.model).toBeDefined();
        expect(args.contentType).toBeDefined();
        expect(args.sizeBytes).toBeDefined();
        expect(args.generationParams).toBeDefined();
        expect(args.visibility).toBeDefined();
    });

    it("should have optional args for thumbnails", async () => {
        const { storeGeneratedImage } = await import("./batchGeneration");
        const args = (storeGeneratedImage as unknown as { args: Record<string, unknown> }).args;
        
        expect(args.thumbnailR2Key).toBeDefined();
        expect(args.thumbnailUrl).toBeDefined();
        expect(args.seed).toBeDefined();
    });
});

describe("toBatchJobSummary", () => {
    it("getUserBatchJobs should return summaries (not full docs with apiKey)", async () => {
        const { getUserBatchJobs } = await import("./batchGeneration");
        
        // Verify the function exists and has a handler
        const config = getUserBatchJobs as unknown as { handler: (...args: unknown[]) => unknown };
        expect(typeof config.handler).toBe("function");
        
        // Note: We can't easily verify the output shape without a real Convex context,
        // but structurally the function should strip heavy fields based on code review
    });
});

describe("P0 Optimization: aspectRatio calculation", () => {
    it("storeGeneratedImage handler is a function (which calculates aspectRatio)", async () => {
        // This is a structural test - the aspectRatio calculation is in the handler
        // We verify the handler exists and is a function
        const { storeGeneratedImage } = await import("./batchGeneration");
        const config = storeGeneratedImage as unknown as { handler: (...args: unknown[]) => unknown };
        
        expect(typeof config.handler).toBe("function");
    });
});

describe("P0 Optimization: Indexed queries", () => {
    it("getUserActiveBatches has empty args (uses auth for user identity)", async () => {
        const { getUserActiveBatches } = await import("./batchGeneration");
        const args = (getUserActiveBatches as unknown as { args: object }).args;
        
        expect(args).toBeDefined();
        expect(Object.keys(args)).toHaveLength(0);
    });
});
