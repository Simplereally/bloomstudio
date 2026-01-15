/**
 * Cerebras Client Tests
 *
 * Tests for the Cerebras client with:
 * - Singleton client pattern
 * - Retry logic with exponential backoff
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest"

// Mock the external dependencies
vi.mock("@ai-sdk/cerebras", () => ({
    createCerebras: vi.fn(),
}))

vi.mock("ai", () => ({
    generateText: vi.fn(),
    streamText: vi.fn(),
}))

vi.mock("./cerebras-config", () => ({
    getCerebrasApiKey: vi.fn(),
    CEREBRAS_MODELS: {
        TEXT_PRIMARY: "llama-3.3-70b",
        TEXT_FAST: "llama3.1-8b",
    },
}))

import { createCerebras } from "@ai-sdk/cerebras"
import { generateText } from "ai"
import { getCerebrasApiKey } from "./cerebras-config"
import {
    createCerebrasClient,
    clearCerebrasClientCache,
    generateWithCerebras,
    CerebrasError,
} from "./cerebras-client"

describe("Cerebras Client", () => {
    const mockApiKey = "test-cerebras-api-key"
    const mockCerebrasInstance = vi.fn()
    const mockModelFn = vi.fn().mockReturnValue("model-instance")

    beforeEach(() => {
        vi.clearAllMocks()
        clearCerebrasClientCache()

        ;(getCerebrasApiKey as Mock).mockReturnValue(mockApiKey)
        ;(createCerebras as Mock).mockReturnValue(mockModelFn)
        mockCerebrasInstance.mockReturnValue("model-instance")
    })

    afterEach(() => {
        clearCerebrasClientCache()
    })


    describe("createCerebrasClient", () => {
        it("should create a new client when no cached client exists", () => {
            const client = createCerebrasClient()

            expect(createCerebras).toHaveBeenCalledTimes(1)
            expect(createCerebras).toHaveBeenCalledWith({ apiKey: mockApiKey })
            expect(client).toBe(mockModelFn)
        })

        it("should return cached client on subsequent calls with same API key", () => {
            const client1 = createCerebrasClient()
            const client2 = createCerebrasClient()

            expect(createCerebras).toHaveBeenCalledTimes(1)
            expect(client1).toBe(client2)
        })

        it("should create new client if API key changes", () => {
            createCerebrasClient()
            expect(createCerebras).toHaveBeenCalledTimes(1)

            ;(getCerebrasApiKey as Mock).mockReturnValue("new-api-key")
            createCerebrasClient()

            expect(createCerebras).toHaveBeenCalledTimes(2)
        })

        it("should throw error when API key is not set", () => {
            ;(getCerebrasApiKey as Mock).mockReturnValue(undefined)

            expect(() => createCerebrasClient()).toThrow(
                "CEREBRAS_API_KEY environment variable is not set"
            )
        })
    })

    describe("clearCerebrasClientCache", () => {
        it("should clear the cached client", () => {
            createCerebrasClient()
            expect(createCerebras).toHaveBeenCalledTimes(1)

            clearCerebrasClientCache()
            createCerebrasClient()

            expect(createCerebras).toHaveBeenCalledTimes(2)
        })
    })

    describe("generateWithCerebras", () => {
        beforeEach(() => {
            ;(generateText as Mock).mockResolvedValue({ text: "Generated response" })
        })

        it("should generate text successfully", async () => {
            const result = await generateWithCerebras({
                prompt: "Test prompt",
                system: "System prompt",
            })

            expect(result).toBe("Generated response")
            expect(generateText).toHaveBeenCalledTimes(1)
            expect(generateText).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt: "Test prompt",
                    system: "System prompt",
                    maxOutputTokens: 1024,
                    temperature: 0.7,
                })
            )
        })

        it("should use custom options when provided", async () => {
            await generateWithCerebras({
                prompt: "Test prompt",
                maxTokens: 512,
                temperature: 0.5,
            })

            expect(generateText).toHaveBeenCalledWith(
                expect.objectContaining({
                    maxOutputTokens: 512,
                    temperature: 0.5,
                })
            )
        })

        it("should extract answer from reasoning model response", async () => {
            ;(generateText as Mock).mockResolvedValue({
                text: "Let me think about this...<answer>phrase1, phrase2, phrase3</answer>"
            })

            const result = await generateWithCerebras({
                prompt: "Test prompt",
            })

            expect(result).toBe("phrase1, phrase2, phrase3")
        })

        it("should return full text when no answer tags present", async () => {
            ;(generateText as Mock).mockResolvedValue({
                text: "Simple response without tags"
            })

            const result = await generateWithCerebras({
                prompt: "Test prompt",
            })

            expect(result).toBe("Simple response without tags")
        })

        it("should throw AbortError when signal is already aborted", async () => {
            const abortController = new AbortController()
            abortController.abort()

            await expect(
                generateWithCerebras({
                    prompt: "Test prompt",
                    abortSignal: abortController.signal,
                })
            ).rejects.toThrow("Aborted")
        })


        it("should retry on retryable errors", async () => {
            const networkError = new Error("fetch failed")

            let callCount = 0
            ;(generateText as Mock).mockImplementation(() => {
                callCount++
                if (callCount < 3) {
                    return Promise.reject(networkError)
                }
                return Promise.resolve({ text: "Success after retry" })
            })

            const result = await generateWithCerebras({
                prompt: "Test prompt",
                maxRetries: 3,
            })

            expect(result).toBe("Success after retry")
            expect(generateText).toHaveBeenCalledTimes(3)
        })

        it("should throw CerebrasError after exhausting retries", async () => {
            const networkError = new Error("network error")
            ;(generateText as Mock).mockRejectedValue(networkError)

            await expect(
                generateWithCerebras({
                    prompt: "Test prompt",
                    maxRetries: 2,
                })
            ).rejects.toThrow(CerebrasError)

            expect(generateText).toHaveBeenCalledTimes(3)
        })
    })

    describe("CerebrasError", () => {
        it("should create error with all properties", () => {
            const error = new CerebrasError("Test message", "TEST_CODE", 500)

            expect(error.message).toBe("Test message")
            expect(error.code).toBe("TEST_CODE")
            expect(error.status).toBe(500)
            expect(error.name).toBe("CerebrasError")
        })

        it("should work without status", () => {
            const error = new CerebrasError("Test message", "TEST_CODE")

            expect(error.status).toBeUndefined()
        })
    })
})
