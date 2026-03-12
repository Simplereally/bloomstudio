import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { mockFetchWithRetry } = vi.hoisted(() => ({
    mockFetchWithRetry: vi.fn(),
}))

vi.mock("./retry", async () => {
    const actual = await vi.importActual<typeof import("./retry")>("./retry")
    return {
        ...actual,
        fetchWithRetry: mockFetchWithRetry,
    }
})

import { analyzePromptWithCerebras } from "./promptInference"

describe("analyzePromptWithCerebras", () => {
    const originalApiKey = process.env.CEREBRAS_API_KEY

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.CEREBRAS_API_KEY = "test-key"
        mockFetchWithRetry.mockResolvedValue({
            success: true,
            data: {
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify({
                                    isSensitive: false,
                                    category: "safe",
                                    confidence: 0.91,
                                    reasoning: "safe prompt",
                                }),
                            },
                        },
                    ],
                }),
            },
        })
    })

    it("uses zero retry attempts so the action does not sleep on backoff", async () => {
        await analyzePromptWithCerebras("a test prompt")

        expect(mockFetchWithRetry).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.any(Function),
            expect.objectContaining({ maxRetries: 0 }),
            "[CerebrasPromptInference]"
        )
    })

    it("throws when the API key is missing", async () => {
        process.env.CEREBRAS_API_KEY = ""

        await expect(analyzePromptWithCerebras("a test prompt")).rejects.toThrow(
            "CEREBRAS_API_KEY is not configured"
        )
    })

    it("throws when provider JSON is missing completion content", async () => {
        mockFetchWithRetry.mockResolvedValueOnce({
            success: true,
            data: {
                json: async () => ({}),
            },
        })

        await expect(analyzePromptWithCerebras("a test prompt")).rejects.toThrow("Empty response from Cerebras")
    })

    afterEach(() => {
        process.env.CEREBRAS_API_KEY = originalApiKey
    })
})
