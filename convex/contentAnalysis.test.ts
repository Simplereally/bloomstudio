
import { describe, it, expect, vi } from "vitest";

// Mock internal definitions to avoid needing the full Convex server environment in unit test
vi.mock("./_generated/server", () => ({
    internalAction: (config: object) => config,
    internalMutation: (config: object) => config,
    query: (config: object) => config,
}));

vi.mock("./_generated/api", () => ({
    internal: {
        generatedImages: {
            getByIdInternal: "getByIdInternal",
            updateImageSensitivity: "updateImageSensitivity",
            getUnanalyzedImages: "getUnanalyzedImages"
        },
        contentAnalysis: {
            analyzeImage: "analyzeImage"
        },
        lib: {
            providerHealthFunctions: {
                checkProvidersAvailable: "checkProvidersAvailable",
                refreshExpiredLimits: "refreshExpiredLimits",
                recordRateLimit: "recordRateLimit"
            }
        }
    }
}));

// Mock openrouter
vi.mock("./lib/openrouter", () => ({
    analyzeImageContent: vi.fn(),
    calculateSensitivityScore: vi.fn()
}));

describe("contentAnalysis structure", () => {
    it("should export analyzeImage action", async () => {
        const { analyzeImage } = await import("./contentAnalysis");
        expect(analyzeImage).toBeDefined();
        // Since we mocked internalAction to return config, we can check it has handler
        expect((analyzeImage as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });

    it("should export analyzeRecentImages action", async () => {
        const { analyzeRecentImages } = await import("./contentAnalysis");
        expect(analyzeRecentImages).toBeDefined();
        expect((analyzeRecentImages as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });

    it("should NOT export query or mutation functions directly", async () => {
        // We verify that the file only contains actions because it uses "use node" 
        // and we moved queries to generatedImages.ts
        const moduleExports = await import("./contentAnalysis");
        
        // Check for exports that might be queries/mutations
        // In our refactor, getByIdInternal and updateImageSensitivity were removed.
        expect(moduleExports).not.toHaveProperty("getByIdInternal");
        expect(moduleExports).not.toHaveProperty("updateImageSensitivity");
    });
});
