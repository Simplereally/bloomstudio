import { describe, it, expect } from "vitest";
import { VisionAnalysisError, ProviderRateLimitInfo } from "./visionAnalysis";

describe("visionAnalysis", () => {
    describe("VisionAnalysisError", () => {
        it("should create error with default empty rateLimitedProviders", () => {
            const error = new VisionAnalysisError(
                "Test error message",
                "TEST_CODE"
            );

            expect(error.message).toBe("Test error message");
            expect(error.code).toBe("TEST_CODE");
            expect(error.name).toBe("VisionAnalysisError");
            expect(error.rateLimitedProviders).toEqual([]);
        });

        it("should create error with rateLimitedProviders", () => {
            const rateLimitInfo: ProviderRateLimitInfo[] = [
                {
                    provider: "groq",
                    errorMessage: "429 Too Many Requests",
                    is429: true,
                },
                {
                    provider: "openrouter",
                    errorMessage: "Rate limit exceeded",
                    is429: true,
                },
            ];

            const error = new VisionAnalysisError(
                "All vision providers failed",
                "ALL_PROVIDERS_FAILED",
                rateLimitInfo
            );

            expect(error.message).toBe("All vision providers failed");
            expect(error.code).toBe("ALL_PROVIDERS_FAILED");
            expect(error.rateLimitedProviders).toHaveLength(2);
            expect(error.rateLimitedProviders[0].provider).toBe("groq");
            expect(error.rateLimitedProviders[1].provider).toBe("openrouter");
        });

        it("should be instanceof Error", () => {
            const error = new VisionAnalysisError("test", "CODE");
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(VisionAnalysisError);
        });

        it("should have stack trace", () => {
            const error = new VisionAnalysisError("test", "CODE");
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain("VisionAnalysisError");
        });
    });
});
