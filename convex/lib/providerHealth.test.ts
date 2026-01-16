import { describe, it, expect } from "vitest";
import {
    parseGroqRateLimitError,
    parseOpenRouterRateLimitError,
} from "./providerHealth";

describe("providerHealth", () => {
    describe("parseGroqRateLimitError", () => {
        it("should parse daily limit (RPD) error and set reset to 24h from now (rolling window)", () => {
            const errorMessage = `Rate limit reached for model \`meta-llama/llama-4-scout-17b-16e-instruct\` in organization \`org_123\` service tier \`on_demand\` on requests per day (RPD): Limit 1000, Used 1000, Requested 1. Please try again in 1m26.4s.`;

            const now = Date.now();
            const result = parseGroqRateLimitError(errorMessage);

            // Groq uses a ROLLING 24h window - should be ~24 hours from now
            const expected24h = now + 24 * 60 * 60 * 1000;

            // Allow 1 second tolerance for timing
            expect(result.resetAt).toBeGreaterThanOrEqual(expected24h - 1000);
            expect(result.resetAt).toBeLessThanOrEqual(expected24h + 1000);
            expect(result.errorMessage).toBe(errorMessage);
        });

        it("should parse x-ratelimit-reset-requests duration header", () => {
            // Groq includes reset duration in error like "x-ratelimit-reset-requests: 23h59m45s"
            const errorMessage = `Rate limit reached. x-ratelimit-reset-requests: 4h30m15s`;

            const now = Date.now();
            const result = parseGroqRateLimitError(errorMessage);

            // Should parse 4h30m15s = (4*3600 + 30*60 + 15) seconds = 16215 seconds
            const expectedDelay = (4 * 60 * 60 + 30 * 60 + 15) * 1000;

            // Allow 1 second tolerance for timing
            expect(result.resetAt).toBeGreaterThanOrEqual(now + expectedDelay - 1000);
            expect(result.resetAt).toBeLessThanOrEqual(now + expectedDelay + 1000);
        });

        it("should parse per-minute (RPM) error and use retry-after time", () => {
            const errorMessage = `Rate limit reached. Please try again in 1m30s.`;

            const result = parseGroqRateLimitError(errorMessage);

            // Should parse the 1m30s = 90 seconds = 90000ms
            const now = Date.now();
            const expectedDelay = 90 * 1000;

            // Allow 1 second tolerance for timing
            expect(result.resetAt).toBeGreaterThanOrEqual(now + expectedDelay - 1000);
            expect(result.resetAt).toBeLessThanOrEqual(now + expectedDelay + 1000);
            expect(result.errorMessage).toBe(errorMessage);
        });

        it("should fall back to 24h rolling window for unknown error patterns", () => {
            const errorMessage = "Unknown rate limit error";

            const now = Date.now();
            const result = parseGroqRateLimitError(errorMessage);

            // Groq fallback should be 24h (conservative rolling window)
            const expected24h = now + 24 * 60 * 60 * 1000;

            expect(result.resetAt).toBeGreaterThanOrEqual(expected24h - 1000);
            expect(result.resetAt).toBeLessThanOrEqual(expected24h + 1000);
            expect(result.errorMessage).toBe(errorMessage);
        });
    });

    describe("parseOpenRouterRateLimitError", () => {
        it("should parse per-minute limit with X-RateLimit-Reset header", () => {
            // Per-minute limit - uses the reset timestamp from header
            const futureReset = Date.now() + 60000; // 1 minute from now
            const errorBody = JSON.stringify({
                error: {
                    message: "Rate limit exceeded: free-models-per-min.",
                    code: 429,
                    metadata: {
                        headers: {
                            "X-RateLimit-Limit": "20",
                            "X-RateLimit-Remaining": "0",
                            "X-RateLimit-Reset": futureReset.toString()
                        }
                    }
                }
            });

            const result = parseOpenRouterRateLimitError(errorBody);

            expect(result.resetAt).toBe(futureReset);
            expect(result.remaining).toBe(0);
            expect(result.limit).toBe(20);
            expect(result.errorMessage).toBe("Rate limit exceeded: free-models-per-min.");
        });

        it("should parse per-day limit with future X-RateLimit-Reset header", () => {
            // Per-day limit with future reset time
            const futureReset = Date.now() + 12 * 60 * 60 * 1000; // 12 hours from now
            const errorBody = JSON.stringify({
                error: {
                    message: "Rate limit exceeded: free-models-per-day",
                    code: 429,
                    metadata: {
                        headers: {
                            "X-RateLimit-Limit": "50",
                            "X-RateLimit-Remaining": "0",
                            "X-RateLimit-Reset": futureReset.toString()
                        }
                    }
                }
            });

            const result = parseOpenRouterRateLimitError(errorBody);

            expect(result.resetAt).toBe(futureReset);
            expect(result.remaining).toBe(0);
            expect(result.limit).toBe(50);
        });

        it("should use next midnight for per-day limit with past reset time", () => {
            // Per-day limit with reset time in the past - should calculate next midnight
            const pastReset = Date.now() - 60000; // 1 minute ago
            const errorBody = JSON.stringify({
                error: {
                    message: "Rate limit exceeded: free-models-per-day",
                    code: 429,
                    metadata: {
                        headers: {
                            "X-RateLimit-Limit": "50",
                            "X-RateLimit-Remaining": "0",
                            "X-RateLimit-Reset": pastReset.toString()
                        }
                    }
                }
            });

            const result = parseOpenRouterRateLimitError(errorBody);

            const expectedMidnight = new Date();
            expectedMidnight.setUTCHours(24, 0, 0, 0);

            expect(result.resetAt).toBe(expectedMidnight.getTime());
            expect(result.remaining).toBe(0);
        });

        it("should fall back to midnight UTC when JSON parsing fails", () => {
            const errorBody = "Not valid JSON";

            const result = parseOpenRouterRateLimitError(errorBody);

            const expectedMidnight = new Date();
            expectedMidnight.setUTCHours(24, 0, 0, 0);

            expect(result.resetAt).toBe(expectedMidnight.getTime());
            expect(result.errorMessage).toBe(errorBody);
        });

        it("should fall back to midnight UTC when headers are missing", () => {
            const errorBody = JSON.stringify({
                error: {
                    message: "Some error",
                    code: 429
                }
            });

            const result = parseOpenRouterRateLimitError(errorBody);

            const expectedMidnight = new Date();
            expectedMidnight.setUTCHours(24, 0, 0, 0);

            expect(result.resetAt).toBe(expectedMidnight.getTime());
        });

        it("should use header value for unknown limit type if in future", () => {
            const futureReset = Date.now() + 300000; // 5 minutes from now
            const errorBody = JSON.stringify({
                error: {
                    message: "Rate limit exceeded",
                    metadata: {
                        headers: {
                            "X-RateLimit-Reset": futureReset.toString()
                        }
                    }
                }
            });

            const result = parseOpenRouterRateLimitError(errorBody);

            expect(result.resetAt).toBe(futureReset);
            expect(result.remaining).toBe(0);
            expect(result.limit).toBeUndefined();
        });
    });
});
