/**
 * Tests for Pollinations API utilities
 */

import { describe, it, expect } from "vitest"
import {
    buildPollinationsUrl,
    classifyHttpError,
    classifyApiError,
    isFluxModelUnavailable,
    POLLINATIONS_BASE_URL,
} from "./pollinations"

describe("pollinations utilities", () => {
    describe("buildPollinationsUrl", () => {
        it("builds basic URL with just prompt", () => {
            const url = buildPollinationsUrl({ prompt: "a cat" })
            expect(url).toBe(`${POLLINATIONS_BASE_URL}/image/a%20cat?quality=high`)
        })

        it("encodes special characters in prompt", () => {
            const url = buildPollinationsUrl({ prompt: "a cat & dog + bird" })
            expect(url).toContain("a%20cat%20%26%20dog%20%2B%20bird")
        })

        it("includes all generation parameters", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                negativePrompt: "blur",
                model: "zimage",
                width: 1024,
                height: 768,
                seed: 42,
                enhance: true,
                private: true,
                safe: true,
            })

            expect(url).toContain("negative_prompt=blur")
            expect(url).toContain("model=zimage")
            expect(url).toContain("width=1024")
            expect(url).toContain("height=768")
            expect(url).toContain("seed=42")
            expect(url).toContain("quality=high")
            expect(url).toContain("enhance=true")
            expect(url).toContain("private=true")
            expect(url).toContain("safe=true")
        })

        it("omits undefined optional parameters", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                model: "zimage",
            })

            expect(url).not.toContain("negative_prompt")
            expect(url).not.toContain("width")
            expect(url).not.toContain("height")
            expect(url).not.toContain("seed")
            expect(url).not.toContain("enhance")
            expect(url).not.toContain("private")
            expect(url).not.toContain("safe")
            expect(url).toContain("model=zimage")
        })

        it("includes image parameter when provided", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                image: "https://example.com/image.jpg",
            })

            expect(url).toContain("image=https%3A%2F%2Fexample.com%2Fimage.jpg")
        })

        it("handles empty negative prompt", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                negativePrompt: "   ",
            })

            expect(url).not.toContain("negative_prompt")
        })

        it("handles seed of 0", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                seed: 0,
            })

            expect(url).toContain("seed=0")
        })

        it("excludes negative seed values", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                seed: -1,
            })

            expect(url).not.toContain("seed")
        })

        // Video-specific parameter tests
        it("includes duration parameter for video models", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                model: "veo",
                duration: 6,
            })

            expect(url).toContain("duration=6")
        })

        it("includes aspectRatio parameter for video models", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                model: "seedance",
                aspectRatio: "16:9",
            })

            expect(url).toContain("aspectRatio=16%3A9")
        })

        it("includes audio parameter when true", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                model: "veo",
                audio: true,
            })

            expect(url).toContain("audio=true")
        })

        it("excludes audio parameter when false", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                model: "veo",
                audio: false,
            })

            expect(url).not.toContain("audio")
        })

        it("includes lastFrameImage as second image parameter for interpolation", () => {
            const url = buildPollinationsUrl({
                prompt: "test",
                model: "veo",
                image: "https://example.com/first.jpg",
                lastFrameImage: "https://example.com/last.jpg",
            })

            // Both images should be in the URL
            expect(url).toContain("image=https%3A%2F%2Fexample.com%2Ffirst.jpg")
            expect(url).toContain("image=https%3A%2F%2Fexample.com%2Flast.jpg")
        })

        it("includes all video parameters together", () => {
            const url = buildPollinationsUrl({
                prompt: "video test",
                model: "veo",
                duration: 8,
                aspectRatio: "9:16",
                audio: true,
                image: "https://example.com/first.jpg",
                lastFrameImage: "https://example.com/last.jpg",
            })

            expect(url).toContain("model=veo")
            expect(url).toContain("duration=8")
            expect(url).toContain("aspectRatio=9%3A16")
            expect(url).toContain("audio=true")
            // Both image params
            const imageMatches = url.match(/image=/g)
            expect(imageMatches?.length).toBe(2)
        })

        it("excludes duration when zero or negative", () => {
            const urlZero = buildPollinationsUrl({
                prompt: "test",
                duration: 0,
            })
            const urlNegative = buildPollinationsUrl({
                prompt: "test",
                duration: -1,
            })

            expect(urlZero).not.toContain("duration")
            expect(urlNegative).not.toContain("duration")
        })
    })

    describe("classifyHttpError", () => {
        it("classifies 429 as retryable rate limit", () => {
            const result = classifyHttpError(429)
            expect(result.isRetryable).toBe(true)
            expect(result.reason).toBe("rate_limited")
        })

        it("classifies 5xx errors as retryable server errors", () => {
            expect(classifyHttpError(500)).toEqual({ isRetryable: true, reason: "server_error" })
            expect(classifyHttpError(502)).toEqual({ isRetryable: true, reason: "server_error" })
            expect(classifyHttpError(503)).toEqual({ isRetryable: true, reason: "server_error" })
            expect(classifyHttpError(504)).toEqual({ isRetryable: true, reason: "server_error" })
        })

        it("classifies 401/403 as non-retryable auth errors", () => {
            expect(classifyHttpError(401)).toEqual({ isRetryable: false, reason: "auth_error" })
            expect(classifyHttpError(403)).toEqual({ isRetryable: false, reason: "auth_error" })
        })

        it("classifies 400 as non-retryable validation error", () => {
            const result = classifyHttpError(400)
            expect(result.isRetryable).toBe(false)
            expect(result.reason).toBe("validation_error")
        })

        it("classifies 404 as non-retryable not found", () => {
            const result = classifyHttpError(404)
            expect(result.isRetryable).toBe(false)
            expect(result.reason).toBe("not_found")
        })

        it("classifies other 4xx as non-retryable client errors", () => {
            expect(classifyHttpError(405)).toEqual({ isRetryable: false, reason: "client_error" })
            expect(classifyHttpError(409)).toEqual({ isRetryable: false, reason: "client_error" })
            expect(classifyHttpError(422)).toEqual({ isRetryable: false, reason: "client_error" })
        })

        it("classifies unknown status as non-retryable", () => {
            expect(classifyHttpError(0)).toEqual({ isRetryable: false, reason: "unknown" })
            expect(classifyHttpError(200)).toEqual({ isRetryable: false, reason: "unknown" })
        })
    })

    describe("isFluxModelUnavailable", () => {
        it("returns true for direct match", () => {
            expect(isFluxModelUnavailable("No active flux servers available")).toBe(true)
        })

        it("returns true when message contains the pattern", () => {
            expect(isFluxModelUnavailable("Error: No active flux servers available, try again")).toBe(true)
        })

        it("returns true for nested JSON with message field", () => {
            const json = JSON.stringify({
                error: "Internal Server Error",
                message: "No active flux servers available",
            })
            expect(isFluxModelUnavailable(json)).toBe(true)
        })

        it("returns true for nested JSON with error field", () => {
            const json = JSON.stringify({
                error: "No active flux servers available",
                message: "Something else",
            })
            expect(isFluxModelUnavailable(json)).toBe(true)
        })

        it("returns false for unrelated errors", () => {
            expect(isFluxModelUnavailable("Bad request")).toBe(false)
            expect(isFluxModelUnavailable("Timeout")).toBe(false)
            expect(isFluxModelUnavailable("")).toBe(false)
        })

        it("returns false for valid JSON without pattern", () => {
            const json = JSON.stringify({
                error: "Other error",
                message: "Different message",
            })
            expect(isFluxModelUnavailable(json)).toBe(false)
        })

        it("handles malformed JSON gracefully", () => {
            expect(isFluxModelUnavailable("{invalid}")).toBe(false)
            expect(isFluxModelUnavailable("{ message: 'test' }")).toBe(false)
        })
    })

    describe("classifyApiError", () => {
        it("prioritizes flux unavailable detection over status code", () => {
            const result = classifyApiError(500, "No active flux servers available")
            expect(result.isRetryable).toBe(true)
            expect(result.reason).toBe("model_unavailable")
        })

        it("falls back to HTTP status classification", () => {
            const result = classifyApiError(400, "Invalid prompt")
            expect(result.isRetryable).toBe(false)
            expect(result.reason).toBe("validation_error")
        })

        it("handles JSON error bodies", () => {
            const errorJson = JSON.stringify({
                message: "No active flux servers available",
            })
            const result = classifyApiError(500, errorJson)
            expect(result.isRetryable).toBe(true)
            expect(result.reason).toBe("model_unavailable")
        })
    })
})
