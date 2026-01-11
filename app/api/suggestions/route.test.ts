/**
 * Tests for the Suggestions API Route
 *
 * Tests authentication, rate limiting, and suggestion generation functionality.
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

// Mock prompt enhancement (suggestions)
vi.mock("@/lib/prompt-enhancement", () => ({
    generateSuggestions: vi.fn(),
}))

import { auth } from "@clerk/nextjs/server"
import { fetchMutation } from "convex/nextjs"
import { generateSuggestions } from "@/lib/prompt-enhancement"

function createMockRequest(body: Record<string, unknown>): NextRequest {
    const request = new NextRequest("http://localhost:3000/api/suggestions", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    })
    return request
}

describe("/api/suggestions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe("Authentication", () => {
        it("should return 401 when user is not authenticated", async () => {
            ; vi.mocked(auth).mockResolvedValue({ userId: null } as any)

            const request = createMockRequest({ prompt: "test" })
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
            ; vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any)
                ; (fetchMutation as Mock).mockResolvedValue({
                    allowed: true,
                    remaining: 19,
                    resetAt: Date.now() + 60000,
                })
                ; (generateSuggestions as Mock).mockResolvedValue({ suggestions: ["suggestion 1"] })

            const request = createMockRequest({ prompt: "test" })
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

            const request = createMockRequest({ prompt: "test" })
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
                    remaining: 19,
                    resetAt,
                })
                ; (generateSuggestions as Mock).mockResolvedValue({ suggestions: [] })

            const request = createMockRequest({ prompt: "" })
            const response = await POST(request)

            expect(response.headers.get("X-RateLimit-Remaining")).toBe("19")
            expect(response.headers.get("X-RateLimit-Reset")).toBe(String(resetAt))
        })

        it("should use suggestions endpoint for rate limiting", async () => {
            ; vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any)
                ; (fetchMutation as Mock).mockResolvedValue({
                    allowed: true,
                    remaining: 19,
                    resetAt: Date.now() + 60000,
                })
                ; (generateSuggestions as Mock).mockResolvedValue({ suggestions: [] })

            const request = createMockRequest({ prompt: "test" })
            await POST(request)

            expect(fetchMutation).toHaveBeenCalledWith(
                "rateLimits:checkRateLimit",
                { userId: "user_123", endpoint: "suggestions" }
            )
        })
    })

    describe("Suggestion Generation", () => {
        beforeEach(() => {
            ; vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any)
                ; (fetchMutation as Mock).mockResolvedValue({
                    allowed: true,
                    remaining: 19,
                    resetAt: Date.now() + 60000,
                })
        })

        it("should generate suggestions successfully", async () => {
            const suggestions = ["add lighting", "add colors", "add style"]
                ; (generateSuggestions as Mock).mockResolvedValue({ suggestions })

            const request = createMockRequest({ prompt: "a beautiful landscape" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toEqual({
                success: true,
                data: { suggestions },
            })
        })

        it("should handle empty prompt", async () => {
            ; (generateSuggestions as Mock).mockResolvedValue({ suggestions: [] })

            const request = createMockRequest({ prompt: "" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data.suggestions).toEqual([])
        })

        it("should handle missing prompt", async () => {
            ; (generateSuggestions as Mock).mockResolvedValue({ suggestions: [] })

            const request = createMockRequest({})
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            // Should not error, just return empty suggestions
            expect(data.success).toBe(true)
        })
    })

    describe("Error Handling", () => {
        beforeEach(() => {
            ; vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any)
                ; (fetchMutation as Mock).mockResolvedValue({
                    allowed: true,
                    remaining: 19,
                    resetAt: Date.now() + 60000,
                })
        })

        it("should return empty suggestions on error (graceful degradation)", async () => {
            ; (generateSuggestions as Mock).mockRejectedValue(new Error("API Error"))

            const request = createMockRequest({ prompt: "test" })
            const response = await POST(request)
            const data = await response.json()

            // Should return success with empty suggestions to not break UI
            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data.suggestions).toEqual([])
        })

        it("should handle AbortError with 499 status", async () => {
            const abortError = new Error("Aborted")
            abortError.name = "AbortError"
                ; (generateSuggestions as Mock).mockRejectedValue(abortError)

            const request = createMockRequest({ prompt: "test" })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(499)
            expect(data.error.code).toBe("CANCELLED")
        })
    })
})
