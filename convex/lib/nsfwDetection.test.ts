
import { describe, it, expect } from "vitest";
import { analyzePromptForNSFW } from "./nsfwDetection";

describe("nsfwDetection", () => {
    describe("analyzePromptForNSFW", () => {
        it("should return clean result for safe prompts", () => {
            const result = analyzePromptForNSFW("a cute puppy running in the park");
            expect(result.isSensitive).toBe(false);
            expect(result.confidence).toBe(0);
            expect(result.matchedTerms).toHaveLength(0);
        });

        it("should detect explicit keywords", () => {
            const result = analyzePromptForNSFW("a photo of a nude person");
            expect(result.isSensitive).toBe(true);
            expect(result.confidence).toBeGreaterThanOrEqual(0.9);
            expect(result.matchedTerms).toContain("nude");
            expect(result.detectionMethod).toBe("explicit");
        });

        it("should detect multiple explicit keywords", () => {
            const result = analyzePromptForNSFW("explicit content with xxx");
            expect(result.isSensitive).toBe(true);
            expect(result.matchedTerms).toContain("explicit");
            expect(result.matchedTerms).toContain("xxx");
        });

        it("should detect suggestive terms with lower confidence", () => {
            // "bikini" is suggestive (0.4)
            const result = analyzePromptForNSFW("girl in a bikini");
            // 0.4 < 0.6 threshold -> Not marked as sensitive by default logic? 
            // My implementation: isSensitive = confidence >= 0.6
            expect(result.isSensitive).toBe(false);
            expect(result.confidence).toBeCloseTo(0.4);
            expect(result.matchedTerms).toContain("bikini");
        });

        it("should detect contextual combinations (body part + modifier)", () => {
            // "breast" is body part, "exposed" is modifier -> +0.7
            const result = analyzePromptForNSFW("exposed breast");
            expect(result.isSensitive).toBe(true);
            expect(result.confidence).toBe(0.7);
        });
        
        it("should accumulate scores", () => {
            // "bikini" (0.4) + "seductive" (0.4) = 0.8
            const result = analyzePromptForNSFW("seductive girl in bikini");
            expect(result.isSensitive).toBe(true);
            expect(result.confidence).toBe(0.8);
        });
    });
});
