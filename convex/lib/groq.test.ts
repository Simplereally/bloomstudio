import { describe, it, expect, vi, beforeEach } from "vitest"
import {
    analyzeImageWithGroqDeps,
    GroqApiError,
    GroqTimeoutError,
    GROQ_VISION_MODEL,
    type GroqVisionDeps,
} from "./groq"
import { DEFAULT_RETRY_CONFIG } from "./retry"

/** Create mock dependencies with sensible defaults */
function createMockDeps(overrides: Partial<GroqVisionDeps> = {}): GroqVisionDeps {
    return {
        apiKey: "test-groq-api-key",
        fetchFn: vi.fn(),
        sleepFn: vi.fn().mockResolvedValue(undefined),
        retryConfig: DEFAULT_RETRY_CONFIG,
        maxRetries: 1,
        timeoutMs: 30_000,
        ...overrides,
    }
}

/** Create a successful API response */
function createSuccessResponse(content: string) {
    return {
        ok: true,
        json: () => Promise.resolve({
            choices: [{ message: { content } }]
        }),
    }
}

/** Create an error API response */
function createErrorResponse(status: number, statusText: string, body = "Error") {
    return {
        ok: false,
        status,
        statusText,
        text: () => Promise.resolve(body),
    }
}

describe("Groq Vision (Convex)", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("analyzeImageWithGroqDeps", () => {
        describe("missing API key", () => {
            it("throws GroqApiError when API key is missing", async () => {
                const deps = createMockDeps({ apiKey: undefined })

                await expect(
                    analyzeImageWithGroqDeps("https://example.com/image.jpg", "Analyze", deps)
                ).rejects.toThrow(GroqApiError)

                await expect(
                    analyzeImageWithGroqDeps("https://example.com/image.jpg", "Analyze", deps)
                ).rejects.toThrow("GROQ_API_KEY is not set")
            })
        })

        describe("successful requests", () => {
            it("makes request to Groq API with correct parameters", async () => {
                const mockFetch = vi.fn().mockResolvedValue(
                    createSuccessResponse("Analysis result")
                )
                const deps = createMockDeps({ fetchFn: mockFetch })

                await analyzeImageWithGroqDeps(
                    "https://example.com/image.jpg",
                    "Analyze this image",
                    deps
                )

                expect(mockFetch).toHaveBeenCalledWith(
                    "https://api.groq.com/openai/v1/chat/completions",
                    expect.objectContaining({
                        method: "POST",
                        headers: {
                            "Authorization": "Bearer test-groq-api-key",
                            "Content-Type": "application/json",
                        },
                        signal: expect.any(AbortSignal),
                    })
                )

                // Verify request body
                const callArgs = mockFetch.mock.calls[0]
                const body = JSON.parse(callArgs[1].body)
                expect(body.model).toBe(GROQ_VISION_MODEL)
                expect(body.messages[0].content).toHaveLength(2)
                expect(body.messages[0].content[0]).toEqual({
                    type: "text",
                    text: "Analyze this image"
                })
                expect(body.messages[0].content[1]).toEqual({
                    type: "image_url",
                    image_url: { url: "https://example.com/image.jpg" }
                })
            })

            it("returns the analysis text", async () => {
                const mockFetch = vi.fn().mockResolvedValue(
                    createSuccessResponse("The image shows a cat")
                )
                const deps = createMockDeps({ fetchFn: mockFetch })

                const result = await analyzeImageWithGroqDeps(
                    "https://example.com/image.jpg",
                    "Analyze",
                    deps
                )

                expect(result.text).toBe("The image shows a cat")
            })
        })

        describe("retry behavior", () => {
            it("retries on HTTP error", async () => {
                const mockFetch = vi.fn()
                    .mockResolvedValueOnce(createErrorResponse(500, "Internal Server Error"))
                    .mockResolvedValueOnce(createSuccessResponse("Success"))
                const mockSleep = vi.fn().mockResolvedValue(undefined)
                const deps = createMockDeps({ fetchFn: mockFetch, sleepFn: mockSleep })

                const result = await analyzeImageWithGroqDeps(
                    "https://example.com/image.jpg",
                    "Analyze",
                    deps
                )

                expect(result.text).toBe("Success")
                expect(mockFetch).toHaveBeenCalledTimes(2)
                expect(mockSleep).toHaveBeenCalledTimes(1)
            })

            it("throws after exhausting retries", async () => {
                const mockFetch = vi.fn().mockResolvedValue(
                    createErrorResponse(500, "Error")
                )
                const deps = createMockDeps({ fetchFn: mockFetch })

                await expect(
                    analyzeImageWithGroqDeps("https://example.com/image.jpg", "Analyze", deps)
                ).rejects.toThrow(GroqApiError)

                // 1 initial + 1 retry = 2 calls
                expect(mockFetch).toHaveBeenCalledTimes(2)
            })
        })

        describe("error handling", () => {
            it("throws GroqApiError on HTTP error", async () => {
                const mockFetch = vi.fn().mockResolvedValue(
                    createErrorResponse(400, "Bad Request", "Invalid image URL")
                )
                const deps = createMockDeps({ fetchFn: mockFetch, maxRetries: 0 })

                await expect(
                    analyzeImageWithGroqDeps("https://example.com/image.jpg", "Analyze", deps)
                ).rejects.toThrow(GroqApiError)
            })

            it("throws GroqApiError when no content in response", async () => {
                const mockFetch = vi.fn().mockResolvedValue({
                    ok: true,
                    json: () => Promise.resolve({ choices: [] }),
                })
                const deps = createMockDeps({ fetchFn: mockFetch, maxRetries: 0 })

                await expect(
                    analyzeImageWithGroqDeps("https://example.com/image.jpg", "Analyze", deps)
                ).rejects.toThrow("No content received from Groq")
            })

            it("converts AbortError to GroqTimeoutError", async () => {
                const abortError = new Error("Aborted")
                abortError.name = "AbortError"
                const mockFetch = vi.fn().mockRejectedValue(abortError)
                const deps = createMockDeps({ fetchFn: mockFetch, maxRetries: 0 })

                await expect(
                    analyzeImageWithGroqDeps("https://example.com/image.jpg", "Analyze", deps)
                ).rejects.toThrow(GroqTimeoutError)
            })
        })
    })

    describe("error classes", () => {
        it("GroqApiError has correct properties", () => {
            const error = new GroqApiError("Test error", 500)

            expect(error.name).toBe("GroqApiError")
            expect(error.message).toBe("Test error")
            expect(error.status).toBe(500)
        })

        it("GroqTimeoutError has correct name", () => {
            const error = new GroqTimeoutError("Timeout")

            expect(error.name).toBe("GroqTimeoutError")
            expect(error.message).toBe("Timeout")
        })
    })
})
