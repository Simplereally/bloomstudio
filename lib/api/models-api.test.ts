// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fetchImageModels, fetchImageModel } from "./models-api"
import { PollinationsApiError, ClientErrorCode } from "./image-api"

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("models-api", () => {
    const mockModels = [
        {
            name: "flux",
            aliases: ["default"],
            pricing: { currency: "pollen" },
            description: "Default model",
        },
        {
            name: "turbo",
            aliases: ["fast", "quick"],
            pricing: { currency: "pollen" },
            description: "Fast model",
        },
    ]

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("fetchImageModels", () => {
        it("fetches models from the correct endpoint", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockModels,
            })

            await fetchImageModels()

            expect(mockFetch).toHaveBeenCalledWith(
                "https://gen.pollinations.ai/image/models",
                expect.objectContaining({
                    method: "GET",
                    headers: expect.objectContaining({
                        Accept: "application/json",
                    }),
                })
            )
        })

        it("returns validated models on success", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockModels,
            })

            const result = await fetchImageModels()

            expect(result).toEqual(mockModels)
        })

        it("throws PollinationsApiError on non-ok response", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            })

            await expect(fetchImageModels()).rejects.toThrow(PollinationsApiError)
        })

        it("throws PollinationsApiError with correct code on non-ok response", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            })

            try {
                await fetchImageModels()
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                expect((error as PollinationsApiError).code).toBe(ClientErrorCode.GENERATION_FAILED)
                expect((error as PollinationsApiError).status).toBe(500)
            }
        })

        it("throws PollinationsApiError on network error", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"))

            await expect(fetchImageModels()).rejects.toThrow(PollinationsApiError)
        })

        it("throws PollinationsApiError with UNKNOWN_ERROR code on network error", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"))

            try {
                await fetchImageModels()
                expect.fail("Should have thrown")
            } catch (error) {
                expect(error).toBeInstanceOf(PollinationsApiError)
                expect((error as PollinationsApiError).code).toBe(ClientErrorCode.UNKNOWN_ERROR)
            }
        })

        it("throws PollinationsApiError on invalid JSON", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error("Invalid JSON")
                },
            })

            await expect(fetchImageModels()).rejects.toThrow(PollinationsApiError)
        })

        it("throws PollinationsApiError on invalid schema", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ invalid: "data" }], // Missing required fields
            })

            await expect(fetchImageModels()).rejects.toThrow(PollinationsApiError)
        })
    })

    describe("fetchImageModel", () => {
        it("finds model by name", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockModels,
            })

            const result = await fetchImageModel("flux")

            expect(result).toEqual(mockModels[0])
        })

        it("finds model by alias", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockModels,
            })

            const result = await fetchImageModel("fast")

            expect(result).toEqual(mockModels[1])
        })

        it("returns undefined for unknown model", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockModels,
            })

            const result = await fetchImageModel("unknown-model")

            expect(result).toBeUndefined()
        })

        it("propagates errors from fetchImageModels", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"))

            await expect(fetchImageModel("flux")).rejects.toThrow(PollinationsApiError)
        })
    })
})
