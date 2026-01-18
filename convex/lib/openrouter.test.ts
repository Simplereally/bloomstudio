import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { OpenRouterDeps } from "./openrouter";

// Store original env
const originalEnv = { ...process.env };

/** Create mock dependencies with sensible defaults */
function createMockDeps(overrides: Partial<OpenRouterDeps> = {}): OpenRouterDeps {
    return {
        apiKey: "test-api-key",
        fetchFn: vi.fn(),
        timeoutMs: 30_000,
        ...overrides,
    };
}

describe("openrouter", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers();
        process.env.OPENROUTER_API_KEY = "test-api-key";
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
        process.env = { ...originalEnv };
    });

    describe("analyzeImageContentWithDeps", () => {
        it("returns safe defaults when API key is missing", async () => {
            const { analyzeImageContentWithDeps } = await import("./openrouter");
            const deps = createMockDeps({ apiKey: undefined });
            
            const result = await analyzeImageContentWithDeps("https://example.com/image.jpg", deps);

            expect(result).toEqual({
                nudity: "none",
                sexual_content: "none",
                violence: "none",
                confidence: 0,
                reasoning: "Missing API configuration"
            });
        });

        it("makes request to OpenRouter API with correct parameters", async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            nudity: "none",
                            sexual_content: "none",
                            violence: "none",
                            confidence: 0.95,
                            reasoning: "Safe image"
                        })
                    }
                }]
            };

            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const { analyzeImageContentWithDeps } = await import("./openrouter");
            const deps = createMockDeps({ fetchFn: mockFetch });
            
            await analyzeImageContentWithDeps("https://example.com/image.jpg", deps);

            expect(mockFetch).toHaveBeenCalledWith(
                "https://openrouter.ai/api/v1/chat/completions",
                expect.objectContaining({
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer test-api-key",
                        "Content-Type": "application/json",
                    },
                    signal: expect.any(AbortSignal),
                })
            );
        });

        it("parses successful JSON response", async () => {
            const analysisResult = {
                nudity: "none",
                sexual_content: "suggestive",
                violence: "none",
                confidence: 0.87,
                reasoning: "Contains mild content"
            };

            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: JSON.stringify(analysisResult) } }]
                })
            });

            const { analyzeImageContentWithDeps } = await import("./openrouter");
            const deps = createMockDeps({ fetchFn: mockFetch });
            
            const result = await analyzeImageContentWithDeps("https://example.com/image.jpg", deps);

            expect(result).toEqual(analysisResult);
        });

        it("handles markdown-wrapped JSON response", async () => {
            const analysisResult = {
                nudity: "none",
                sexual_content: "none",
                violence: "none",
                confidence: 0.99,
                reasoning: "Clean"
            };

            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            content: "```json\n" + JSON.stringify(analysisResult) + "\n```"
                        }
                    }]
                })
            });

            const { analyzeImageContentWithDeps } = await import("./openrouter");
            const deps = createMockDeps({ fetchFn: mockFetch });
            
            const result = await analyzeImageContentWithDeps("https://example.com/image.jpg", deps);

            expect(result).toEqual(analysisResult);
        });

        it("throws on HTTP error response", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
                text: () => Promise.resolve("Error details")
            });

            const { analyzeImageContentWithDeps } = await import("./openrouter");
            const deps = createMockDeps({ fetchFn: mockFetch });

            await expect(analyzeImageContentWithDeps("https://example.com/image.jpg", deps))
                .rejects.toThrow("OpenRouter API error: 500 Internal Server Error");
        });

        it("throws when no content in response", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ choices: [] })
            });

            const { analyzeImageContentWithDeps } = await import("./openrouter");
            const deps = createMockDeps({ fetchFn: mockFetch });

            await expect(analyzeImageContentWithDeps("https://example.com/image.jpg", deps))
                .rejects.toThrow("No content received from OpenRouter");
        });

        it("throws OpenRouterTimeoutError when AbortError occurs", async () => {
            // Simulate the AbortError that would be thrown when the controller aborts
            const abortError = new Error("Aborted");
            abortError.name = "AbortError";

            const mockFetch = vi.fn().mockRejectedValue(abortError);

            const { analyzeImageContentWithDeps, OpenRouterTimeoutError } = await import("./openrouter");
            const deps = createMockDeps({ fetchFn: mockFetch });

            // Should throw OpenRouterTimeoutError which wraps AbortError
            await expect(analyzeImageContentWithDeps("https://example.com/image.jpg", deps))
                .rejects.toThrow(OpenRouterTimeoutError);

            // Test the error message
            await expect(analyzeImageContentWithDeps("https://example.com/image.jpg", deps))
                .rejects.toThrow(/timed out after 30000ms/);
        });

        it("clears timeout on successful response", async () => {
            const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                nudity: "none",
                                sexual_content: "none",
                                violence: "none",
                                confidence: 0.9,
                                reasoning: "Safe"
                            })
                        }
                    }]
                })
            });

            const { analyzeImageContentWithDeps } = await import("./openrouter");
            const deps = createMockDeps({ fetchFn: mockFetch });
            
            await analyzeImageContentWithDeps("https://example.com/image.jpg", deps);

            // Timeout should be cleared
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });

        it("clears timeout on error", async () => {
            const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

            const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));

            const { analyzeImageContentWithDeps } = await import("./openrouter");
            const deps = createMockDeps({ fetchFn: mockFetch });

            await expect(analyzeImageContentWithDeps("https://example.com/image.jpg", deps))
                .rejects.toThrow("Network error");

            // Timeout should be cleared even on error
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });
    });

    describe("analyzeImageContent", () => {
        it("uses default dependencies and calls through to analyzeImageContentWithDeps", async () => {
            // This test verifies the public API wrapper works correctly
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            nudity: "none",
                            sexual_content: "none",
                            violence: "none",
                            confidence: 0.95,
                            reasoning: "Safe image"
                        })
                    }
                }]
            };

            // Mock global fetch for the default deps
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });
            vi.stubGlobal("fetch", mockFetch);

            const { analyzeImageContent } = await import("./openrouter");
            const result = await analyzeImageContent("https://example.com/image.jpg");

            expect(result.nudity).toBe("none");
            expect(result.confidence).toBe(0.95);
            expect(mockFetch).toHaveBeenCalled();
        });
    });

    describe("calculateSensitivityScore", () => {
        it("returns 0 for completely safe content", async () => {
            const { calculateSensitivityScore } = await import("./openrouter");

            const score = calculateSensitivityScore({
                nudity: "none",
                sexual_content: "none",
                violence: "none",
                confidence: 1.0,
                reasoning: "Safe content"
            });

            expect(score).toBe(0);
        });

        it("returns 0 for content with none nudity (treats partial as none)", async () => {
            const { calculateSensitivityScore } = await import("./openrouter");

            // Note: "partial" is no longer a valid type, only "none" or "full"
            const score = calculateSensitivityScore({
                nudity: "none",
                sexual_content: "none",
                violence: "none",
                confidence: 1.0,
                reasoning: "No explicit nudity"
            });

            expect(score).toBe(0);
        });

        it("calculates score for full nudity", async () => {
            const { calculateSensitivityScore } = await import("./openrouter");

            const score = calculateSensitivityScore({
                nudity: "full",
                sexual_content: "none",
                violence: "none",
                confidence: 1.0,
                reasoning: "Full nudity"
            });

            expect(score).toBe(0.9);
        });

        it("calculates cumulative score for multiple factors (without partial nudity)", async () => {
            const { calculateSensitivityScore } = await import("./openrouter");

            const score = calculateSensitivityScore({
                nudity: "none",           // +0 (partial no longer counts)
                sexual_content: "suggestive", // +0.3
                violence: "mild",     // +0.2
                confidence: 1.0,
                reasoning: "Mixed content without explicit nudity"
            });

            expect(score).toBeCloseTo(0.5, 10); // 0 + 0.3 + 0.2 = 0.5
        });

        it("caps score at 1.0 for extreme content", async () => {
            const { calculateSensitivityScore } = await import("./openrouter");

            const score = calculateSensitivityScore({
                nudity: "full",           // +0.9
                sexual_content: "explicit", // +0.9
                violence: "graphic",       // +0.7
                confidence: 1.0,
                reasoning: "Extreme content"
            });

            // Total would be 2.5 but should be capped at 1
            expect(score).toBe(1);
        });
    });

    describe("OpenRouterTimeoutError", () => {
        it("has correct name property", async () => {
            const { OpenRouterTimeoutError } = await import("./openrouter");
            const error = new OpenRouterTimeoutError("Test timeout");

            expect(error.name).toBe("OpenRouterTimeoutError");
            expect(error.message).toBe("Test timeout");
            expect(error).toBeInstanceOf(Error);
        });
    });
});
