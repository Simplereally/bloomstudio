import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
    generateImage,
    downloadImage,
    isApiError,
    PollinationsApiError,
} from "./image-api"
import { PollinationsAPI } from "@/lib/pollinations-api"

// Mock the PollinationsAPI
vi.mock("@/lib/pollinations-api", () => ({
    PollinationsAPI: {
        buildImageUrl: vi.fn(
            () => "https://gen.pollinations.ai/image/test%20prompt"
        ),
        getHeaders: vi.fn(() => ({})),
    },
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("image-api", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("generateImage", () => {
        it("generates an image successfully", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            })

            const result = await generateImage({ prompt: "test prompt" })

            expect(result).toMatchObject({
                url: expect.stringContaining("gen.pollinations.ai"),
                prompt: "test prompt",
                timestamp: expect.any(Number),
                id: expect.stringMatching(/^img_\d+_[a-z0-9]+$/),
            })
        })

        it("uses validated params with defaults applied", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            })

            const result = await generateImage({ prompt: "test" })

            expect(result.params).toMatchObject({
                prompt: "test",
                model: "flux",
                width: 1024,
                height: 1024,
                enhance: false,
            })
        })

        it("throws PollinationsApiError on HTTP error", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({}),
            })

            await expect(generateImage({ prompt: "test" })).rejects.toThrow(
                PollinationsApiError
            )
        })

        it("throws PollinationsApiError with parsed error details", async () => {
            const errorResponse = {
                error: {
                    message: "Rate limit exceeded",
                    code: "RATE_LIMITED",
                    details: { retryAfter: 60 },
                },
            }

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: async () => errorResponse,
            })

            try {
                await generateImage({ prompt: "test" })
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                const apiError = error as PollinationsApiError
                expect(apiError.message).toBe("Rate limit exceeded")
                expect(apiError.code).toBe("RATE_LIMITED")
                expect(apiError.status).toBe(429)
                expect(apiError.details).toEqual({ retryAfter: 60 })
            }
        })

        it("handles non-JSON error responses", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
                json: async () => {
                    throw new Error("Not JSON")
                },
            })

            try {
                await generateImage({ prompt: "test" })
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                const apiError = error as PollinationsApiError
                expect(apiError.message).toBe(
                    "Image generation failed with status 503"
                )
                expect(apiError.code).toBe("GENERATION_FAILED")
                expect(apiError.status).toBe(503)
            }
        })

        it("throws validation error for empty prompt", async () => {
            await expect(generateImage({ prompt: "" })).rejects.toThrow()
        })

        it("wraps network errors", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network failure"))

            try {
                await generateImage({ prompt: "test" })
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                const apiError = error as PollinationsApiError
                expect(apiError.message).toBe("Network failure")
                expect(apiError.code).toBe("UNKNOWN_ERROR")
            }
        })

        it("includes authentication headers in request", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            })

            await generateImage({ prompt: "test" })

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: "GET",
                    headers: expect.any(Object),
                    cache: "no-store",
                })
            )
        })
    })

    describe("downloadImage", () => {
        it("downloads image as blob", async () => {
            const mockBlob = new Blob(["test image data"], { type: "image/png" })
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                blob: async () => mockBlob,
            })

            const result = await downloadImage("https://example.com/image.png")

            expect(result).toBe(mockBlob)
        })

        it("throws PollinationsApiError on download failure", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            })

            try {
                await downloadImage("https://example.com/missing.png")
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                const apiError = error as PollinationsApiError
                expect(apiError.message).toBe("Failed to download image")
                expect(apiError.code).toBe("DOWNLOAD_FAILED")
                expect(apiError.status).toBe(404)
            }
        })

        it("includes authentication headers in download request", async () => {
            const mockBlob = new Blob(["test"], { type: "image/png" })
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                blob: async () => mockBlob,
            })

            await downloadImage("https://example.com/image.png")

            expect(mockFetch).toHaveBeenCalledWith(
                "https://example.com/image.png",
                expect.objectContaining({
                    headers: expect.any(Object),
                })
            )
        })
    })

    describe("isApiError", () => {
        it("returns true for PollinationsApiError", () => {
            const error = new PollinationsApiError("Test error")
            expect(isApiError(error)).toBe(true)
        })

        it("returns false for regular Error", () => {
            const error = new Error("Test error")
            expect(isApiError(error)).toBe(false)
        })

        it("returns false for plain objects", () => {
            const error = { message: "Test error" }
            expect(isApiError(error)).toBe(false)
        })

        it("returns false for null/undefined", () => {
            expect(isApiError(null)).toBe(false)
            expect(isApiError(undefined)).toBe(false)
        })
    })

    describe("PollinationsApiError", () => {
        it("creates error with all properties", () => {
            const error = new PollinationsApiError(
                "Test message",
                "TEST_CODE",
                500,
                { extra: "data" }
            )

            expect(error.message).toBe("Test message")
            expect(error.code).toBe("TEST_CODE")
            expect(error.status).toBe(500)
            expect(error.details).toEqual({ extra: "data" })
            expect(error.name).toBe("PollinationsApiError")
        })

        it("creates error with only message", () => {
            const error = new PollinationsApiError("Test message")

            expect(error.message).toBe("Test message")
            expect(error.code).toBeUndefined()
            expect(error.status).toBeUndefined()
            expect(error.details).toBeUndefined()
        })

        it("is instanceof Error", () => {
            const error = new PollinationsApiError("Test")
            expect(error instanceof Error).toBe(true)
            expect(error instanceof PollinationsApiError).toBe(true)
        })
    })
})
