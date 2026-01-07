/**
 * Tests for the Enhance Prompt API Route
 *
 * Tests authentication, rate limiting, and prompt enhancement functionality.
 */
import { describe, expect, it, vi, beforeEach, afterEach, Mock } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
    auth: vi.fn(),
}))

// Mock Convex fetchMutation
vi.mock("convex/nextjs", () => ({
    fetchMutation: vi.fn(),
}))

// Mock the Convex API import
vi.mock("@/convex/_generated/api", () => ({
    api: {
        rateLimits: {
            checkRateLimit: "rateLimits:checkRateLimit",
        },
    },
}))

// Mock prompt enhancement
vi.mock("@/lib/prompt-enhancement", () => ({
    enhancePrompt: vi.fn(),
    enhanceNegativePrompt: vi.fn(),
    PromptEnhancementError: class PromptEnhancementError extends Error {
        code: string
        status?: number
        constructor(message: string, code: string, status?: number) {
            super(message)
            this.code = code
            this.status = status
        }
    },
}))

import { auth } from "@clerk/nextjs/server"
import { fetchMutation } from "convex/nextjs"
import { enhancePrompt, enhanceNegativePrompt, PromptEnhancementError } from "@/lib/prompt-enhancement"

function createMockRequest(body: Record<string, unknown>): NextRequest {
    const request = new NextRequest("http://localhost:3000/api/enhance-prompt", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    })
    return request
}

describe("/api/enhance-prompt", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe("Authentication", () => {
        it("should return 401 when user is not authenticated", async () => {
            vi.mocked(auth).mockResolvedValue({ userId: null } as any)

            const request = createMockRequest({ prompt: "test", type: "prompt" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data).toEqual({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication required",
                },
            })
        })

        it("should proceed when user is authenticated", async () => {
            vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any)
                ; (fetchMutation as Mock).mockResolvedValue({
                    allowed: true,
                    remaining: 9,
                    resetAt: Date.now() + 60000,
                })
                ; (enhancePrompt as Mock).mockResolvedValue({ enhancedText: "enhanced prompt" })

            const request = createMockRequest({ prompt: "test", type: "prompt" })
            const response = await POST(request)

            expect(response.status).toBe(200)
        })
    })

    describe("Rate Limiting", () => {
        it("should return 429 when rate limit is exceeded", async () => {
            const resetAt = Date.now() + 30000
                ; vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any)
                ; (fetchMutation as Mock).mockResolvedValue({
                    allowed: false,
                    remaining: 0,
                    resetAt,
                })

            const request = createMockRequest({ prompt: "test", type: "prompt" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(429)
            expect(data).toEqual({
                success: false,
                error: {
                    code: "RATE_LIMIT_EXCEEDED",
                    message: "Too many requests. Please try again later.",
                },
            })
            expect(response.headers.get("Retry-After")).toBeDefined()
            expect(response.headers.get("X-RateLimit-Remaining")).toBe("0")
        })

        it("should include rate limit headers on successful response", async () => {
            const resetAt = Date.now() + 60000
                ; vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any)
                ; (fetchMutation as Mock).mockResolvedValue({
                    allowed: true,
                    remaining: 9,
                    resetAt,
                })
                ; (enhancePrompt as Mock).mockResolvedValue({ enhancedText: "enhanced" })

            const request = createMockRequest({ prompt: "test", type: "prompt" })
            const response = await POST(request)

            expect(response.headers.get("X-RateLimit-Remaining")).toBe("9")
            expect(response.headers.get("X-RateLimit-Reset")).toBe(String(resetAt))
        })
    })

    describe("Validation", () => {
        beforeEach(() => {
            ; vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any)
                ; (fetchMutation as Mock).mockResolvedValue({
                    allowed: true,
                    remaining: 9,
                    resetAt: Date.now() + 60000,
                })
        })

        it("should return 400 when prompt is missing", async () => {
            const request = createMockRequest({ type: "prompt" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error.code).toBe("VALIDATION_ERROR")
            expect(data.error.message).toBe("Prompt is required")
        })

        it("should return 400 when prompt is empty", async () => {
            const request = createMockRequest({ prompt: "   ", type: "prompt" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error.code).toBe("VALIDATION_ERROR")
        })

        it("should return 400 when type is invalid", async () => {
            const request = createMockRequest({ prompt: "test", type: "invalid" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error.code).toBe("VALIDATION_ERROR")
            expect(data.error.message).toBe("Type must be 'prompt' or 'negative'")
        })
    })

    describe("Prompt Enhancement", () => {
        beforeEach(() => {
            ; vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any)
                ; (fetchMutation as Mock).mockResolvedValue({
                    allowed: true,
                    remaining: 9,
                    resetAt: Date.now() + 60000,
                })
        })

        it("should enhance positive prompt successfully", async () => {
            ; (enhancePrompt as Mock).mockResolvedValue({ enhancedText: "enhanced positive prompt" })

            const request = createMockRequest({ prompt: "a cat", type: "prompt" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toEqual({
                success: true,
                data: { enhancedText: "enhanced positive prompt" },
            })
            expect(enhancePrompt).toHaveBeenCalledWith("a cat", expect.any(Object))
        })

        it("should enhance negative prompt successfully", async () => {
            ; (enhanceNegativePrompt as Mock).mockResolvedValue({ enhancedText: "enhanced negative prompt" })

            const request = createMockRequest({ prompt: "a cat", negativePrompt: "blurry", type: "negative" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.data.enhancedText).toBe("enhanced negative prompt")
            expect(enhanceNegativePrompt).toHaveBeenCalledWith("a cat", "blurry", expect.any(Object))
        })
    })

    describe("Error Handling", () => {
        beforeEach(() => {
            ; vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any)
                ; (fetchMutation as Mock).mockResolvedValue({
                    allowed: true,
                    remaining: 9,
                    resetAt: Date.now() + 60000,
                })
        })

        it("should handle PromptEnhancementError with custom status", async () => {
            const error = new (PromptEnhancementError as unknown as new (message: string, code: string, status?: number) => Error & { code: string; status?: number })("API Error", "API_ERROR", 503)
                ; (enhancePrompt as Mock).mockRejectedValue(error)

            const request = createMockRequest({ prompt: "test", type: "prompt" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(503)
            expect(data.error.code).toBe("API_ERROR")
        })

        it("should handle unknown errors with 500 status", async () => {
            ; (enhancePrompt as Mock).mockRejectedValue(new Error("Unknown error"))

            const request = createMockRequest({ prompt: "test", type: "prompt" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data.error.code).toBe("INTERNAL_ERROR")
        })
    })
})
