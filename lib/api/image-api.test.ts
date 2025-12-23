import { describe, it, expect, vi, beforeEach } from "vitest"
import {
    generateImage,
    downloadImage,
    isApiError,
    PollinationsApiError,
    ClientErrorCodeConst,
    ApiErrorCodeConst,
} from "./image-api"

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
            // Use status 500 which matches InternalErrorSchema
            const errorResponse = {
                status: 500,
                success: false,
                error: {
                    message: "Rate limit exceeded",
                    code: "INTERNAL_ERROR",
                    timestamp: new Date().toISOString(),
                    details: { 
                        name: "RateLimitError",
                    },
                },
            }

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => errorResponse,
            })

            try {
                await generateImage({ prompt: "test" })
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                const apiError = error as PollinationsApiError
                expect(apiError.message).toBe("Rate limit exceeded")
                expect(apiError.code).toBe(ApiErrorCodeConst.INTERNAL_ERROR)
                expect(apiError.status).toBe(500)
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
                    "Request failed with status 503"
                )
                expect(apiError.code).toBe(ApiErrorCodeConst.INTERNAL_ERROR)
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
                expect(apiError.code).toBe(ClientErrorCodeConst.UNKNOWN_ERROR)
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
                expect(apiError.code).toBe(ClientErrorCodeConst.GENERATION_FAILED)
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
                ApiErrorCodeConst.INTERNAL_ERROR,
                500,
                { extra: "data" }
            )

            expect(error.message).toBe("Test message")
            expect(error.code).toBe(ApiErrorCodeConst.INTERNAL_ERROR)
            expect(error.status).toBe(500)
            expect(error.details).toMatchObject({ extra: "data" })
            expect(error.name).toBe("PollinationsApiError")
        })

        it("creates error with only message", () => {
            const error = new PollinationsApiError("Test message")

            expect(error.message).toBe("Test message")
            expect(error.code).toBe(ClientErrorCodeConst.UNKNOWN_ERROR)
            expect(error.status).toBe(500)
        })

        it("is instanceof Error", () => {
            const error = new PollinationsApiError("Test")
            expect(error instanceof Error).toBe(true)
            expect(error instanceof PollinationsApiError).toBe(true)
        })

        it("provides user-friendly message", () => {
            const error = new PollinationsApiError(
                "Technical error",
                ApiErrorCodeConst.UNAUTHORIZED,
                401
            )
            expect(error.userMessage).toBe("Authentication required")
        })

        it("identifies retryable errors", () => {
            const serverError = new PollinationsApiError(
                "Server error",
                ApiErrorCodeConst.INTERNAL_ERROR,
                500
            )
            const validationError = new PollinationsApiError(
                "Invalid params",
                ApiErrorCodeConst.BAD_REQUEST,
                400
            )

            expect(serverError.isRetryable).toBe(true)
            expect(validationError.isRetryable).toBe(false)
        })

        it("identifies auth errors", () => {
            const authError = new PollinationsApiError(
                "Unauthorized",
                ApiErrorCodeConst.UNAUTHORIZED,
                401
            )
            const otherError = new PollinationsApiError(
                "Other",
                ApiErrorCodeConst.INTERNAL_ERROR,
                500
            )

            expect(authError.isAuthError).toBe(true)
            expect(otherError.isAuthError).toBe(false)
        })

        it("identifies validation errors", () => {
            const validationError = new PollinationsApiError(
                "Bad request",
                ApiErrorCodeConst.BAD_REQUEST,
                400
            )
            const otherError = new PollinationsApiError(
                "Other",
                ApiErrorCodeConst.INTERNAL_ERROR,
                500
            )

            expect(validationError.isValidationError).toBe(true)
            expect(otherError.isValidationError).toBe(false)
        })

        it("provides flat field errors", () => {
            const error = new PollinationsApiError(
                "Validation failed",
                ApiErrorCodeConst.BAD_REQUEST,
                400,
                {
                    fieldErrors: {
                        prompt: ["Prompt is required"],
                        width: ["Width must be at least 64"],
                    },
                }
            )

            expect(error.hasFieldErrors).toBe(true)
            expect(error.flatFieldErrors).toContain("prompt: Prompt is required")
            expect(error.flatFieldErrors).toContain("width: Width must be at least 64")
        })

        it("serializes to JSON", () => {
            const error = new PollinationsApiError(
                "Test",
                ApiErrorCodeConst.INTERNAL_ERROR,
                500,
                { requestId: "req_123" }
            )

            const json = error.toJSON()
            expect(json.name).toBe("PollinationsApiError")
            expect(json.message).toBe("Test")
            expect(json.code).toBe(ApiErrorCodeConst.INTERNAL_ERROR)
            expect(json.status).toBe(500)
            expect(json.requestId).toBe("req_123")
        })
    })
})
