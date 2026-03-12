import { describe, expect, it, vi } from "vitest"
import { analyzeImageWithGroqDeps, GROQ_MAX_RETRIES } from "./groq"

describe("analyzeImageWithGroqDeps", () => {
    it("does not sleep on backoff when default retries are disabled", async () => {
        const fetchFn = vi.fn().mockRejectedValue(new Error("network failure"))
        const sleepFn = vi.fn().mockResolvedValue(undefined)

        await expect(
            analyzeImageWithGroqDeps("https://example.com/image.png", "prompt", {
                apiKey: "test-key",
                fetchFn,
                sleepFn,
                retryConfig: {
                    maxRetries: GROQ_MAX_RETRIES,
                    baseDelayMs: 2000,
                    maxDelayMs: 30000,
                },
                maxRetries: GROQ_MAX_RETRIES,
                timeoutMs: 30_000,
            })
        ).rejects.toThrow("network failure")

        expect(fetchFn).toHaveBeenCalledTimes(1)
        expect(sleepFn).not.toHaveBeenCalled()
    })
})
