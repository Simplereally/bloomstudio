/**
 * OpenRouter Client Tests
 *
 * Tests for the high-throughput OpenRouter client with:
 * - Singleton client pattern
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - Connection pooling
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest"

// Mock the external dependencies
vi.mock("@openrouter/ai-sdk-provider", () => ({
    createOpenRouter: vi.fn(),
}))

vi.mock("ai", () => ({
    streamText: vi.fn(),
}))

vi.mock("./openrouter-config", () => ({
    getOpenRouterApiKey: vi.fn(),
    OPENROUTER_CONFIG: {
        siteUrl: "https://test.example.com",
        siteName: "Test App",
    },
    OPENROUTER_MODELS: {
        PROMPT_ENHANCEMENT: "test-model",
        SUGGESTIONS: "test-suggestions-model",
    },
}))

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamText } from "ai"
import { getOpenRouterApiKey } from "./openrouter-config"
import {
    createOpenRouterClient,
    clearClientCache,
    generate,
    generateStream,
    OpenRouterError,
} from "./openrouter-client"

describe("OpenRouter Client", () => {
    const mockApiKey = "test-api-key-123"
    const mockOpenRouterInstance = vi.fn()
    const mockModelFn = vi.fn().mockReturnValue("model-instance")

    beforeEach(() => {
        // Reset all mocks and clear cache before each test
        vi.clearAllMocks()
        clearClientCache()

            // Setup default mocks
            ; (getOpenRouterApiKey as Mock).mockReturnValue(mockApiKey)
            ; (createOpenRouter as Mock).mockReturnValue(mockModelFn)
        mockOpenRouterInstance.mockReturnValue("model-instance")
    })

    afterEach(() => {
        clearClientCache()
    })

    describe("createOpenRouterClient", () => {
        it("should create a new client when no cached client exists", () => {
            const client = createOpenRouterClient()

            expect(createOpenRouter).toHaveBeenCalledTimes(1)
            expect(createOpenRouter).toHaveBeenCalledWith({
                apiKey: mockApiKey,
                fetch: expect.any(Function),
            })
            expect(client).toBe(mockModelFn)
        })

        it("should return cached client on subsequent calls with same API key", () => {
            const client1 = createOpenRouterClient()
            const client2 = createOpenRouterClient()

            expect(createOpenRouter).toHaveBeenCalledTimes(1)
            expect(client1).toBe(client2)
        })

        it("should create new client if API key changes", () => {
            createOpenRouterClient()
            expect(createOpenRouter).toHaveBeenCalledTimes(1)

                // Change API key
                ; (getOpenRouterApiKey as Mock).mockReturnValue("new-api-key")
            createOpenRouterClient()

            expect(createOpenRouter).toHaveBeenCalledTimes(2)
        })

        it("should throw error when API key is not set", () => {
            ; (getOpenRouterApiKey as Mock).mockReturnValue(undefined)

            expect(() => createOpenRouterClient()).toThrow(
                "OPENROUTER_API_KEY environment variable is not set"
            )
        })
    })

    describe("clearClientCache", () => {
        it("should clear the cached client", () => {
            createOpenRouterClient()
            expect(createOpenRouter).toHaveBeenCalledTimes(1)

            clearClientCache()
            createOpenRouterClient()

            expect(createOpenRouter).toHaveBeenCalledTimes(2)
        })
    })

    describe("generate", () => {
        const mockStreamResult = {
            text: Promise.resolve("Generated response text"),
        }

        beforeEach(() => {
            ; (streamText as Mock).mockReturnValue(mockStreamResult)
        })

        it("should generate text successfully", async () => {
            const result = await generate({
                prompt: "Test prompt",
                system: "System prompt",
            })

            expect(result).toBe("Generated response text")
            expect(streamText).toHaveBeenCalledTimes(1)
            expect(streamText).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt: "Test prompt",
                    system: "System prompt",
                    maxOutputTokens: 1024,
                    temperature: 0.7,
                })
            )
        })

        it("should use custom options when provided", async () => {
            await generate({
                prompt: "Test prompt",
                maxOutputTokens: 512,
                temperature: 0.5,
            })

            expect(streamText).toHaveBeenCalledWith(
                expect.objectContaining({
                    maxOutputTokens: 512,
                    temperature: 0.5,
                })
            )
        })

        it("should pass abort signal to streamText", async () => {
            const abortController = new AbortController()

            await generate({
                prompt: "Test prompt",
                abortSignal: abortController.signal,
            })

            expect(streamText).toHaveBeenCalledWith(
                expect.objectContaining({
                    abortSignal: abortController.signal,
                })
            )
        })

        it("should throw AbortError when signal is already aborted", async () => {
            const abortController = new AbortController()
            abortController.abort()

            await expect(
                generate({
                    prompt: "Test prompt",
                    abortSignal: abortController.signal,
                })
            ).rejects.toThrow("Aborted")
        })

        it("should rethrow AbortError without retrying", async () => {
            const abortError = new DOMException("Aborted", "AbortError")
                ; (streamText as Mock).mockReturnValue({
                    text: Promise.reject(abortError),
                })

            await expect(
                generate({
                    prompt: "Test prompt",
                    maxRetries: 3,
                })
            ).rejects.toThrow()

            // Should only call once - no retries for abort errors
            expect(streamText).toHaveBeenCalledTimes(1)
        })

        it("should retry on retryable errors", async () => {
            const networkError = new Error("fetch failed")

            // First two calls fail, third succeeds
            let callCount = 0
                ; (streamText as Mock).mockImplementation(() => {
                    callCount++
                    if (callCount < 3) {
                        return { text: Promise.reject(networkError) }
                    }
                    return { text: Promise.resolve("Success after retry") }
                })

            const result = await generate({
                prompt: "Test prompt",
                maxRetries: 3,
            })

            expect(result).toBe("Success after retry")
            expect(streamText).toHaveBeenCalledTimes(3)
        })

        it("should throw OpenRouterError after exhausting retries", async () => {
            const networkError = new Error("network error")
                ; (streamText as Mock).mockReturnValue({
                    text: Promise.reject(networkError),
                })

            await expect(
                generate({
                    prompt: "Test prompt",
                    maxRetries: 2,
                })
            ).rejects.toThrow(OpenRouterError)

            // Initial + 2 retries = 3 calls
            expect(streamText).toHaveBeenCalledTimes(3)
        })

        it("should disable reasoning when disableReasoning is true", async () => {
            await generate({
                prompt: "Test prompt",
                disableReasoning: true,
            })

            expect(streamText).toHaveBeenCalledWith(
                expect.objectContaining({
                    providerOptions: {
                        openrouter: {
                            reasoning: { effort: "none" },
                        },
                    },
                })
            )
        })
    })

    describe("generateStream", () => {
        const mockStreamResult = {
            text: Promise.resolve("Streamed text"),
            textStream: { [Symbol.asyncIterator]: () => ({ next: () => ({ done: true }) }) },
        }

        beforeEach(() => {
            ; (streamText as Mock).mockReturnValue(mockStreamResult)
        })

        it("should return stream result", async () => {
            const result = await generateStream({
                prompt: "Test prompt",
            })

            expect(result).toBe(mockStreamResult)
        })

        it("should include disableReasoning in stream options", async () => {
            await generateStream({
                prompt: "Test prompt",
                disableReasoning: true,
            })

            expect(streamText).toHaveBeenCalledWith(
                expect.objectContaining({
                    providerOptions: {
                        openrouter: {
                            reasoning: { effort: "none" },
                        },
                    },
                })
            )
        })
    })

    describe("OpenRouterError", () => {
        it("should create error with all properties", () => {
            const error = new OpenRouterError("Test message", "TEST_CODE", 500)

            expect(error.message).toBe("Test message")
            expect(error.code).toBe("TEST_CODE")
            expect(error.status).toBe(500)
            expect(error.name).toBe("OpenRouterError")
        })

        it("should work without status", () => {
            const error = new OpenRouterError("Test message", "TEST_CODE")

            expect(error.status).toBeUndefined()
        })
    })
})
