import { beforeEach, describe, expect, it, vi } from "vitest"
import * as apiConfig from "./config/api.config"
import { API_CONSTRAINTS } from "./config/api.config"
import { PollinationsAPI } from "./pollinations-api"


describe("PollinationsAPI", () => {
    describe("buildImageUrl", () => {
        it("uses correct base URL and path", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
            expect(url).toContain("https://gen.pollinations.ai/image/")
        })

        it("encodes prompt correctly", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "a cat & dog",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
            expect(url).toContain("/image/a%20cat%20%26%20dog")
        })

        it("includes model parameter when not default", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "turbo",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
            expect(url).toContain("model=turbo")
        })

        it("includes model parameter when zimage (default)", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
            // Model is always included - upstream API requires explicit model selection
            expect(url).toContain("model=zimage")
        })

        it("always includes quality parameter as high", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "hd",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
            // API now always hardcodes quality=high
            expect(url).toContain("quality=high")
        })

        it("includes quality parameter even when medium (always high)", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
            // API now always hardcodes quality=high regardless of input
            expect(url).toContain("quality=high")
        })

        it("includes guidance_scale parameter", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
                guidance_scale: 7.5,
            })
            expect(url).toContain("guidance_scale=7.5")
        })

        it("includes transparent parameter when true", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: true,
            })
            expect(url).toContain("transparent=true")
        })

        it("excludes transparent parameter when false", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
            expect(url).not.toContain("transparent")
        })

        it("includes negative_prompt in URL when provided", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                negativePrompt: "blurry, low quality",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
            expect(url).toContain("negative_prompt=blurry%2C+low+quality")
        })

        it("includes dimensions when not default values", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 512,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
            expect(url).toContain("width=512")
            expect(url).toContain("height=1024")
        })

        it("includes seed when provided", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 1024,
                height: 1024,
                seed: 12345,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
            expect(url).toContain("seed=12345")
        })

        it("includes all boolean flags when true", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: true,
                quality: "medium",
                private: true,
                nologo: true,
                nofeed: true,
                safe: true,
                transparent: true,
            })
            expect(url).toContain("enhance=true")
            expect(url).toContain("private=true")
            expect(url).toContain("nologo=true")
            expect(url).toContain("nofeed=true")
            expect(url).toContain("safe=true")
            expect(url).toContain("transparent=true")
        })

        it("includes image reference URL when provided", () => {
            const url = PollinationsAPI.buildImageUrl({
                prompt: "test",
                model: "zimage",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
                image: "https://example.com/ref.png",
            })
            expect(url).toContain("image=https%3A%2F%2Fexample.com%2Fref.png")
        })
    })

    describe("buildVideoUrl", () => {
        it("builds video URL with duration", () => {
            const url = PollinationsAPI.buildVideoUrl({
                prompt: "test video",
                model: "veo",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
                audio: false,
                duration: 5,
            })
            expect(url).toContain("duration=5")
            expect(url).toContain("model=veo")
        })

        it("builds video URL with aspectRatio", () => {
            const url = PollinationsAPI.buildVideoUrl({
                prompt: "test video",
                model: "seedance",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
                audio: false,
                aspectRatio: "16:9",
            })
            expect(url).toContain("aspectRatio=16%3A9")
        })

        it("builds video URL with audio flag", () => {
            const url = PollinationsAPI.buildVideoUrl({
                prompt: "test video",
                model: "veo",
                width: 1024,
                height: 1024,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
                audio: true,
            })
            expect(url).toContain("audio=true")
        })
    })

    describe("validateDimension", () => {
        it("accepts valid dimensions", () => {
            expect(PollinationsAPI.validateDimension(1024)).toBe(true)
            expect(PollinationsAPI.validateDimension(512)).toBe(true)
            expect(PollinationsAPI.validateDimension(64)).toBe(true)
            expect(PollinationsAPI.validateDimension(2048)).toBe(true)
        })

        it("rejects dimensions below minimum", () => {
            expect(PollinationsAPI.validateDimension(63)).toBe(false)
            expect(PollinationsAPI.validateDimension(0)).toBe(false)
        })

        it("rejects dimensions above maximum", () => {
            expect(PollinationsAPI.validateDimension(2049)).toBe(false)
            expect(PollinationsAPI.validateDimension(3000)).toBe(false)
        })

        it("rejects dimensions not divisible by step", () => {
            expect(PollinationsAPI.validateDimension(100)).toBe(false)
            expect(PollinationsAPI.validateDimension(1000)).toBe(false)
            expect(PollinationsAPI.validateDimension(513)).toBe(false)
        })
    })

    describe("roundDimension", () => {
        it("rounds to nearest 64", () => {
            expect(PollinationsAPI.roundDimension(100)).toBe(128)
            expect(PollinationsAPI.roundDimension(1000)).toBe(1024)
            expect(PollinationsAPI.roundDimension(1050)).toBe(1024)
            expect(PollinationsAPI.roundDimension(1060)).toBe(1088)
        })

        it("clamps to minimum", () => {
            expect(PollinationsAPI.roundDimension(10)).toBe(64)
            expect(PollinationsAPI.roundDimension(-100)).toBe(64)
        })

        it("clamps to maximum", () => {
            expect(PollinationsAPI.roundDimension(3000)).toBe(2048)
            expect(PollinationsAPI.roundDimension(5000)).toBe(2048)
        })
    })

    describe("generateRandomSeed", () => {
        it("generates a positive integer", () => {
            const seed = PollinationsAPI.generateRandomSeed()
            expect(Number.isInteger(seed)).toBe(true)
            expect(seed).toBeGreaterThanOrEqual(0)
        })

        it("generates different values on successive calls", () => {
            // Get multiple seeds and check they're not all the same
            const seeds = Array.from({ length: 10 }, () =>
                PollinationsAPI.generateRandomSeed()
            )
            const uniqueSeeds = new Set(seeds)
            // Should have at least 2 unique values in 10 attempts
            expect(uniqueSeeds.size).toBeGreaterThan(1)
        })

        it("stays within valid seed range", () => {
            const seed = PollinationsAPI.generateRandomSeed()
            expect(seed).toBeGreaterThanOrEqual(API_CONSTRAINTS.seed.min)
            expect(seed).toBeLessThanOrEqual(API_CONSTRAINTS.seed.max)
        })

        it("handles edge cases for random generation", () => {
            const mathSpy = vi.spyOn(Math, "random")

            // Test minimum (Math.random() = 0)
            mathSpy.mockReturnValue(0)
            expect(PollinationsAPI.generateRandomSeed()).toBe(0)

            // Test maximum (Math.random() is close to 1.0)
            mathSpy.mockReturnValue(0.9999999999999999)
            expect(PollinationsAPI.generateRandomSeed()).toBe(API_CONSTRAINTS.seed.max)

            mathSpy.mockRestore()
        })
    })

    describe("validateGuidanceScale", () => {
        it("accepts valid guidance scale values", () => {
            expect(PollinationsAPI.validateGuidanceScale(1)).toBe(true)
            expect(PollinationsAPI.validateGuidanceScale(7.5)).toBe(true)
            expect(PollinationsAPI.validateGuidanceScale(20)).toBe(true)
        })

        it("rejects values below minimum", () => {
            expect(PollinationsAPI.validateGuidanceScale(0)).toBe(false)
            expect(PollinationsAPI.validateGuidanceScale(0.5)).toBe(false)
        })

        it("rejects values above maximum", () => {
            expect(PollinationsAPI.validateGuidanceScale(21)).toBe(false)
            expect(PollinationsAPI.validateGuidanceScale(100)).toBe(false)
        })
    })

    describe("getHeaders", () => {
        beforeEach(() => {
            vi.restoreAllMocks()
        })

        it("returns empty headers when no API key", () => {
            vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)
            const headers = PollinationsAPI.getHeaders()
            expect(headers).toEqual({})
        })

        it("returns Authorization header when API key is present", () => {
            vi.spyOn(apiConfig, "getApiKey").mockReturnValue("test-api-key")
            const headers = PollinationsAPI.getHeaders()
            expect(headers).toEqual({
                "Authorization": "Bearer test-api-key"
            })
        })
    })
})
