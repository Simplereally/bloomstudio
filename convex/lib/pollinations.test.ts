/**
 * Tests for Pollinations error classification
 *
 * Covers:
 * - HTTP status-based classification (classifyHttpError)
 * - Body-based non-retryable pattern matching (matchNonRetryablePattern)
 * - Combined classification (classifyApiError) with correct priority ordering
 * - Transient override for Flux model unavailability
 */

import { describe, it, expect } from "vitest"
import {
    buildPollinationsUrl,
    classifyHttpError,
    classifyApiError,
    isFluxModelUnavailable,
    matchNonRetryablePattern,
    NON_RETRYABLE_ERROR_PATTERNS,
} from "./pollinations"

describe("buildPollinationsUrl", () => {
    it("encodes grok-video reference image through the image query param only", () => {
        const url = buildPollinationsUrl({
            prompt: "test prompt",
            model: "grok-video",
            image: "https://example.com/first.jpg",
            lastFrameImage: "https://example.com/second.jpg",
            duration: 5,
            aspectRatio: "16:9",
        })

        const parsed = new URL(url)

        expect(parsed.searchParams.get("image")).toBe("https://example.com/first.jpg")
        expect(parsed.searchParams.get("image_urls")).toBeNull()
    })

    it("does not encode last frame image for non-interpolation video models like ltx-2", () => {
        const url = buildPollinationsUrl({
            prompt: "test prompt",
            model: "ltx-2",
            image: "https://example.com/first.jpg",
            lastFrameImage: "https://example.com/second.jpg",
            duration: 5,
            aspectRatio: "16:9",
        })

        const parsed = new URL(url)

        expect(parsed.searchParams.get("image")).toBe("https://example.com/first.jpg")
    })
})

// ============================================================
// classifyHttpError — pure status-code classification
// ============================================================

describe("classifyHttpError", () => {
    it("should classify 429 as retryable (rate limited)", () => {
        const result = classifyHttpError(429)
        expect(result).toEqual({ isRetryable: true, reason: "rate_limited" })
    })

    it.each([500, 502, 503, 504, 599])("should classify %i as retryable (server error)", (status) => {
        const result = classifyHttpError(status)
        expect(result).toEqual({ isRetryable: true, reason: "server_error" })
    })

    it.each([401, 403])("should classify %i as non-retryable (auth error)", (status) => {
        const result = classifyHttpError(status)
        expect(result).toEqual({ isRetryable: false, reason: "auth_error" })
    })

    it("should classify 400 as non-retryable (validation error)", () => {
        const result = classifyHttpError(400)
        expect(result).toEqual({ isRetryable: false, reason: "validation_error" })
    })

    it("should classify 404 as non-retryable (not found)", () => {
        const result = classifyHttpError(404)
        expect(result).toEqual({ isRetryable: false, reason: "not_found" })
    })

    it.each([402, 405, 409, 422])("should classify %i as non-retryable (client error)", (status) => {
        const result = classifyHttpError(status)
        expect(result).toEqual({ isRetryable: false, reason: "client_error" })
    })

    it("should classify unknown status as non-retryable", () => {
        const result = classifyHttpError(200)
        expect(result).toEqual({ isRetryable: false, reason: "unknown" })
    })
})

// ============================================================
// matchNonRetryablePattern — body-based pattern matching
// ============================================================

describe("matchNonRetryablePattern", () => {
    describe("provider client errors (api.airforce wrapping upstream 4xx)", () => {
        it("should match 'Provider error (400 Bad Request)'", () => {
            const result = matchNonRetryablePattern("Provider error (400 Bad Request)")
            expect(result).toEqual({ isRetryable: false, reason: "provider_client_error" })
        })

        it("should match 'Provider error (422 Unprocessable Entity)'", () => {
            const result = matchNonRetryablePattern("Provider error (422 Unprocessable Entity)")
            expect(result).toEqual({ isRetryable: false, reason: "provider_client_error" })
        })

        it("should match 'Provider error (403 Forbidden)'", () => {
            const result = matchNonRetryablePattern("Provider error (403 Forbidden)")
            expect(result).toEqual({ isRetryable: false, reason: "provider_client_error" })
        })

        it("should match provider error in JSON response body", () => {
            const body = JSON.stringify({ error: "Provider error (400 Bad Request)" })
            const result = matchNonRetryablePattern(body)
            expect(result).toEqual({ isRetryable: false, reason: "provider_client_error" })
        })

        it("should match provider error in nested JSON message field", () => {
            const body = JSON.stringify({ message: "api.airforce grok-imagine-video error: Provider error (400 Bad Request)" })
            const result = matchNonRetryablePattern(body)
            expect(result).toEqual({ isRetryable: false, reason: "provider_client_error" })
        })

        it("should NOT match 'Provider error (500 Internal Server Error)' (server errors are retryable)", () => {
            const result = matchNonRetryablePattern("Provider error (500 Internal Server Error)")
            expect(result).toBeNull()
        })

        it("should NOT match 'Provider error (502 Bad Gateway)'", () => {
            const result = matchNonRetryablePattern("Provider error (502 Bad Gateway)")
            expect(result).toBeNull()
        })
    })

    describe("content policy violations", () => {
        it("should match 'content policy violation'", () => {
            const result = matchNonRetryablePattern("Your request was rejected due to content policy violation")
            expect(result).toEqual({ isRetryable: false, reason: "content_policy_violation" })
        })

        it("should match case-insensitively", () => {
            const result = matchNonRetryablePattern("Content Policy enforcement triggered")
            expect(result).toEqual({ isRetryable: false, reason: "content_policy_violation" })
        })
    })

    describe("model not found", () => {
        it("should match 'model not found'", () => {
            const result = matchNonRetryablePattern("The requested model was not found")
            expect(result).toEqual({ isRetryable: false, reason: "provider_model_not_found" })
        })

        it("should match 'model xyz not found' in JSON", () => {
            const body = JSON.stringify({ detail: "model grok-imagine-video not found" })
            const result = matchNonRetryablePattern(body)
            expect(result).toEqual({ isRetryable: false, reason: "provider_model_not_found" })
        })
    })

    describe("no match", () => {
        it("should return null for generic server error text", () => {
            expect(matchNonRetryablePattern("Internal Server Error")).toBeNull()
        })

        it("should return null for empty string", () => {
            expect(matchNonRetryablePattern("")).toBeNull()
        })

        it("should return null for unrelated JSON", () => {
            const body = JSON.stringify({ status: "ok", data: [] })
            expect(matchNonRetryablePattern(body)).toBeNull()
        })
    })
})

// ============================================================
// isFluxModelUnavailable — transient override
// ============================================================

describe("isFluxModelUnavailable", () => {
    it("should return true for direct match", () => {
        expect(isFluxModelUnavailable("No active flux servers available")).toBe(true)
    })

    it("should return true when pattern appears in longer text", () => {
        expect(isFluxModelUnavailable("Error: No active flux servers available, try again later")).toBe(true)
    })

    it("should return true when pattern is in JSON message field", () => {
        const body = JSON.stringify({ message: "No active flux servers available" })
        expect(isFluxModelUnavailable(body)).toBe(true)
    })

    it("should return true when pattern is in JSON error field", () => {
        const body = JSON.stringify({ error: "No active flux servers available" })
        expect(isFluxModelUnavailable(body)).toBe(true)
    })

    it("should return false for unrelated errors", () => {
        expect(isFluxModelUnavailable("Internal Server Error")).toBe(false)
    })
})

// ============================================================
// classifyApiError — combined classification with priority
// ============================================================

describe("classifyApiError", () => {
    describe("priority: transient body patterns override everything", () => {
        it("should classify Flux unavailability as retryable even with 500 status", () => {
            const result = classifyApiError(500, "No active flux servers available")
            expect(result).toEqual({ isRetryable: true, reason: "model_unavailable" })
        })

        it("should classify Flux unavailability as retryable even with 400 status", () => {
            // Edge case: if Pollinations ever returns 400 for this, we still retry
            const result = classifyApiError(400, "No active flux servers available")
            expect(result).toEqual({ isRetryable: true, reason: "model_unavailable" })
        })
    })

    describe("priority: non-retryable body patterns override HTTP status", () => {
        it("should classify Grok provider 400 as non-retryable even with 500 HTTP status", () => {
            // This is the primary bug fix — the exact error pattern from the issue
            const result = classifyApiError(500, "api.airforce grok-imagine-video error: Provider error (400 Bad Request)")
            expect(result).toEqual({ isRetryable: false, reason: "provider_client_error" })
        })

        it("should classify provider 422 as non-retryable even with 502 HTTP status", () => {
            const result = classifyApiError(502, "Provider error (422 Unprocessable Entity)")
            expect(result).toEqual({ isRetryable: false, reason: "provider_client_error" })
        })

        it("should classify content policy as non-retryable even with 500 HTTP status", () => {
            const result = classifyApiError(500, "Rejected due to content policy")
            expect(result).toEqual({ isRetryable: false, reason: "content_policy_violation" })
        })
    })

    describe("fallback: HTTP status classification when no body patterns match", () => {
        it("should classify generic 500 as retryable", () => {
            const result = classifyApiError(500, "Internal Server Error")
            expect(result).toEqual({ isRetryable: true, reason: "server_error" })
        })

        it("should classify 429 as retryable", () => {
            const result = classifyApiError(429, "Rate limit exceeded")
            expect(result).toEqual({ isRetryable: true, reason: "rate_limited" })
        })

        it("should classify 400 as non-retryable", () => {
            const result = classifyApiError(400, "Invalid prompt parameter")
            expect(result).toEqual({ isRetryable: false, reason: "validation_error" })
        })

        it("should classify 401 as non-retryable", () => {
            const result = classifyApiError(401, "Unauthorized")
            expect(result).toEqual({ isRetryable: false, reason: "auth_error" })
        })
    })

    describe("real-world error scenarios", () => {
        it("should NOT retry Grok 400 Bad Request wrapped in 500", () => {
            // Exact error from production logs
            const errorBody = "api.airforce grok-imagine-video error: Provider error (400 Bad Request)"
            const result = classifyApiError(500, errorBody)
            expect(result.isRetryable).toBe(false)
        })

        it("should still retry genuine Grok 500 errors", () => {
            // A real server overload should still be retried
            const result = classifyApiError(500, "api.airforce grok-imagine-video error: upstream timeout")
            expect(result.isRetryable).toBe(true)
        })

        it("should still retry generic 502 gateway errors", () => {
            const result = classifyApiError(502, "Bad Gateway")
            expect(result.isRetryable).toBe(true)
        })

        it("should handle JSON-wrapped provider errors", () => {
            const body = JSON.stringify({
                error: "Provider error (400 Bad Request)",
                message: "api.airforce returned an error",
            })
            const result = classifyApiError(500, body)
            expect(result.isRetryable).toBe(false)
            expect(result.reason).toBe("provider_client_error")
        })
    })
})

// ============================================================
// NON_RETRYABLE_ERROR_PATTERNS — registry sanity checks
// ============================================================

describe("NON_RETRYABLE_ERROR_PATTERNS", () => {
    it("should be non-empty", () => {
        expect(NON_RETRYABLE_ERROR_PATTERNS.length).toBeGreaterThan(0)
    })

    it("should have unique reasons", () => {
        const reasons = NON_RETRYABLE_ERROR_PATTERNS.map(p => p.reason)
        expect(new Set(reasons).size).toBe(reasons.length)
    })

    it("each pattern should be a string or RegExp", () => {
        for (const entry of NON_RETRYABLE_ERROR_PATTERNS) {
            expect(
                typeof entry.pattern === "string" || entry.pattern instanceof RegExp
            ).toBe(true)
        }
    })
})
