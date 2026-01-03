import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
    generateImage,
    downloadImage,
    isApiError,
    PollinationsApiError,
    ClientErrorCodeConst,
    ApiErrorCodeConst,
} from "./image-api"
import { PollinationsAPI } from "@/lib/pollinations-api"

// Mock the PollinationsAPI
vi.mock("@/lib/pollinations-api", () => ({
    PollinationsAPI: {
        buildImageUrl: vi.fn(
            () => "https://gen.pollinations.ai/image/test%20prompt"
        ),
        getHeaders: vi.fn(() => ({ "Authorization": "Bearer test-token" })),
    },
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("image-api", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2025-01-01T00:00:00Z"))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe("generateImage", () => {
        it("generates an image successfully with correct parameters", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            })

            const params = { prompt: "test prompt", width: 512, height: 512 }
            const result = await generateImage(params)

            // Verify result structure
            expect(result).toMatchObject({
                url: "https://gen.pollinations.ai/image/test%20prompt",
                prompt: "test prompt",
                timestamp: 1735689600000, // Fixed system time (Jan 1, 2025)
                id: expect.stringMatching(/^img_\d+_[a-z0-9]+$/),
                params: expect.objectContaining({
                    prompt: "test prompt",
                    width: 512,
                    height: 512,
                }),
            })

            // Verify API calls
            expect(PollinationsAPI.buildImageUrl).toHaveBeenCalledWith(
                expect.objectContaining(params)
            )
            expect(mockFetch).toHaveBeenCalledWith(
                "https://gen.pollinations.ai/image/test%20prompt",
                expect.objectContaining({
                    method: "GET",
                    headers: { "Authorization": "Bearer test-token" },
                    cache: "no-store",
                })
            )
        })

        it("applies default values for missing optional parameters", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            })

            const result = await generateImage({ prompt: "test" })

            expect(result.params).toMatchObject({
                prompt: "test",
                model: "zimage",
                width: 768,   // Updated from 1024 to 768 based on schema
                height: 768,  // Updated from 1024 to 768 based on schema
                enhance: false,
            })
        })

        it("throws PollinationsApiError on HTTP error with parsed details", async () => {
            const errorResponse = {
                status: 400,
                success: false,
                error: {
                    message: "Invalid width",
                    code: "BAD_REQUEST",
                    timestamp: new Date().toISOString(),
                    details: {
                        name: "ZodError",
                        formErrors: [],
                        fieldErrors: { width: ["Must be at least 64"] }
                    },
                },
            }

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => errorResponse,
            })

            try {
                await generateImage({ prompt: "test" })
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                const apiError = error as PollinationsApiError
                expect(apiError.message).toBe("Invalid width")
                expect(apiError.code).toBe(ApiErrorCodeConst.BAD_REQUEST)
                expect(apiError.status).toBe(400)
            }
        })

        it("handles non-JSON error responses gracefully", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
                json: async () => { throw new Error("Not JSON") },
            })

            try {
                await generateImage({ prompt: "test" })
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                const apiError = error as PollinationsApiError
                expect(apiError.message).toContain("503")
                expect(apiError.code).toBe(ApiErrorCodeConst.INTERNAL_ERROR)
            }
        })

        it("throws validation error for invalid prompt", async () => {
            // Empty prompt should fail Zod validation
            await expect(generateImage({ prompt: "" })).rejects.toThrow()
        })

        it("wraps unexpected network errors", async () => {
            mockFetch.mockRejectedValueOnce(new Error("DNS Failure"))

            try {
                await generateImage({ prompt: "test" })
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                const apiError = error as PollinationsApiError
                expect(apiError.message).toBe("DNS Failure")
                expect(apiError.code).toBe(ClientErrorCodeConst.UNKNOWN_ERROR)
            }
        })
    })

    describe("downloadImage", () => {
        it("downloads image as blob successfully", async () => {
            const mockBlob = new Blob(["data"], { type: "image/png" })
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                blob: async () => mockBlob,
            })

            const result = await downloadImage("https://example.com/img.png")

            expect(result).toBe(mockBlob)
            expect(mockFetch).toHaveBeenCalledWith(
                "https://example.com/img.png",
                expect.objectContaining({
                    headers: { "Authorization": "Bearer test-token" },
                })
            )
        })

        it("throws PollinationsApiError on download failure", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            })

            try {
                await downloadImage("https://example.com/404.png")
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                const apiError = error as PollinationsApiError
                expect(apiError.message).toBe("Failed to download image")
                expect(apiError.status).toBe(404)
                expect(apiError.code).toBe(ClientErrorCodeConst.GENERATION_FAILED)
            }
        })
    })

    describe("isApiError", () => {
        it("identifies PollinationsApiError correctly", () => {
            const apiError = new PollinationsApiError("API Error")
            const regularError = new Error("Regular Error")

            expect(isApiError(apiError)).toBe(true)
            expect(isApiError(regularError)).toBe(false)
            expect(isApiError(null)).toBe(false)
            expect(isApiError({})).toBe(false)
        })
    })
})
