/**
 * Model Registry Tests
 *
 * Tests for the unified model registry.
 */

import { describe, expect, it } from "vitest";
import {
    ALL_MODEL_IDS,
    IMAGE_MODEL_IDS,
    MODEL_REGISTRY,
    VIDEO_MODEL_IDS,
    getModel,
    getModelAspectRatios,
    getModelConstraints,
    getModelDisplayName,
} from "./models";

describe("Model Registry", () => {
    describe("MODEL_REGISTRY", () => {
        it("should contain all expected image models", () => {
            const expectedImageModels = [
                "zimage",
                "turbo",
                "gptimage",
                "gptimage-large",
                "seedream",
                "kontext",
                "flux",
                "nanobanana",
                "seedream-pro",
                "nanobanana-pro",
            ]

            for (const modelId of expectedImageModels) {
                expect(MODEL_REGISTRY[modelId]).toBeDefined()
                expect(MODEL_REGISTRY[modelId].type).toBe("image")
            }
        })

        it("should contain all expected video models", () => {
            const expectedVideoModels = ["seedance-pro", "seedance", "veo"]

            for (const modelId of expectedVideoModels) {
                expect(MODEL_REGISTRY[modelId]).toBeDefined()
                expect(MODEL_REGISTRY[modelId].type).toBe("video")
            }
        })

        it("should have correct display names", () => {
            expect(MODEL_REGISTRY["zimage"].displayName).toBe("Z-Image-Turbo")
            expect(MODEL_REGISTRY["turbo"].displayName).toBe("SDXL Turbo")
            expect(MODEL_REGISTRY["gptimage"].displayName).toBe("GPT 1.0")
            expect(MODEL_REGISTRY["gptimage-large"].displayName).toBe("GPT 1.5")
            expect(MODEL_REGISTRY["seedream"].displayName).toBe("Seedream 4.0")
            expect(MODEL_REGISTRY["kontext"].displayName).toBe("Flux Kontext")
            expect(MODEL_REGISTRY["flux"].displayName).toBe("Flux Schnell")
            expect(MODEL_REGISTRY["nanobanana"].displayName).toBe("NanoBanana")
            expect(MODEL_REGISTRY["seedream-pro"].displayName).toBe("Seedream 4.5 Pro")
            expect(MODEL_REGISTRY["nanobanana-pro"].displayName).toBe("NanoBanana Pro")
            expect(MODEL_REGISTRY["seedance-pro"].displayName).toBe("Seedance Pro")
            expect(MODEL_REGISTRY["seedance"].displayName).toBe("Seedance")
            expect(MODEL_REGISTRY["veo"].displayName).toBe("Veo 3.1")
        })

        it("should have valid constraints for all models", () => {
            for (const model of Object.values(MODEL_REGISTRY)) {
                expect(model.constraints).toBeDefined()
                expect(model.constraints.maxPixels).toBeDefined()
                expect(model.constraints.minPixels).toBeDefined()
                expect(model.constraints.minDimension).toBeGreaterThan(0)
                expect(model.constraints.maxDimension).toBeGreaterThan(0)
                expect(model.constraints.step).toBeGreaterThan(0)
                expect(model.constraints.defaultDimensions.width).toBeGreaterThan(0)
                expect(model.constraints.defaultDimensions.height).toBeGreaterThan(0)
                expect(typeof model.constraints.dimensionsEnabled).toBe("boolean")
            }
        })

        it("should have aspect ratios for all models", () => {
            for (const model of Object.values(MODEL_REGISTRY)) {
                expect(model.aspectRatios).toBeDefined()
                expect(model.aspectRatios.length).toBeGreaterThan(0)
            }
        })
    })

    describe("getModel", () => {
        it("should return model definition for known models", () => {
            const zimage = getModel("zimage")
            expect(zimage).toBeDefined()
            expect(zimage?.id).toBe("zimage")
            expect(zimage?.displayName).toBe("Z-Image-Turbo")
        })

        it("should be case-insensitive", () => {
            expect(getModel("ZIMAGE")).toBeDefined()
            expect(getModel("Zimage")).toBeDefined()
            expect(getModel("gptimage-large")).toBeDefined()
            expect(getModel("GPTIMAGE-LARGE")).toBeDefined()
        })

        it("should return undefined for unknown models", () => {
            expect(getModel("unknown-model")).toBeUndefined()
        })
    })

    describe("getModelConstraints", () => {
        it("should return constraints for known models", () => {
            const zimageConstraints = getModelConstraints("zimage")
            expect(zimageConstraints).toBeDefined()
            // Updated for SPAN upscaler limit (768×768 base × 2 = 1536×1536 max)
            expect(zimageConstraints!.maxPixels).toBe(2_359_296)
            expect(zimageConstraints!.step).toBe(8)
        })

        it("should return undefined for unknown models", () => {
            const constraints = getModelConstraints("unknown")
            expect(constraints).toBeUndefined()
        })
    })

    describe("getModelAspectRatios", () => {
        it("should return aspect ratios for known models", () => {
            const kontextRatios = getModelAspectRatios("kontext")
            expect(kontextRatios).toBeDefined()
            expect(kontextRatios!.length).toBeGreaterThan(0)
            expect(kontextRatios!.some(r => r.value === "1:1")).toBe(true)
        })

        it("should return limited ratios for fixed-size models", () => {
            const gptRatios = getModelAspectRatios("gptimage")
            expect(gptRatios).toBeDefined()
            expect(gptRatios!.length).toBe(3)
            expect(gptRatios!.every(r => r.value !== "custom")).toBe(true)
        })
    })

    describe("getModelDisplayName", () => {
        it("should return display name for known models", () => {
            expect(getModelDisplayName("zimage")).toBe("Z-Image-Turbo")
            expect(getModelDisplayName("gptimage")).toBe("GPT 1.0")
            expect(getModelDisplayName("gptimage-large")).toBe("GPT 1.5")
        })

        it("should return undefined for unknown models", () => {
            expect(getModelDisplayName("unknown")).toBeUndefined()
        })
    })

    describe("Model Lists", () => {
        it("should have all model IDs", () => {
            expect(ALL_MODEL_IDS.length).toBe(13)
        })

        it("should have correct image model IDs", () => {
            expect(IMAGE_MODEL_IDS.length).toBe(10)
            expect(IMAGE_MODEL_IDS).toContain("zimage")
            expect(IMAGE_MODEL_IDS).toContain("gptimage")
            expect(IMAGE_MODEL_IDS).toContain("flux")
            expect(IMAGE_MODEL_IDS).not.toContain("veo")
        })

        it("should have correct video model IDs", () => {
            expect(VIDEO_MODEL_IDS.length).toBe(3)
            expect(VIDEO_MODEL_IDS).toContain("veo")
            expect(VIDEO_MODEL_IDS).toContain("seedance")
            expect(VIDEO_MODEL_IDS).not.toContain("zimage")
        })
    })
})

describe("Model Constraints", () => {
    describe("Kontext", () => {
        it("should have correct 1MP limit", () => {
            const model = getModel("kontext")!
            expect(model.constraints.maxPixels).toBe(1_048_576)
            expect(model.constraints.step).toBe(32)
            expect(model.constraints.dimensionsEnabled).toBe(true)
        })
    })

    describe("Turbo", () => {
        it("should have 768px max dimension", () => {
            const model = getModel("turbo")!
            expect(model.constraints.maxDimension).toBe(768)
            expect(model.constraints.defaultDimensions.width).toBe(768)
            expect(model.constraints.defaultDimensions.height).toBe(768)
        })
    })

    describe("GPT Image", () => {
        it("should have dimensions disabled", () => {
            expect(getModel("gptimage")!.constraints.dimensionsEnabled).toBe(false)
            expect(getModel("gptimage-large")!.constraints.dimensionsEnabled).toBe(false)
        })
    })

    describe("Seedream", () => {
        it("should have high pixel limits", () => {
            const model = getModel("seedream")!
            expect(model.constraints.maxPixels).toBe(16_777_216)
            expect(model.constraints.minPixels).toBe(262_144) // 512x512
        })
    })

    describe("ZImage", () => {
        it("should have 2.36MP limit (SPAN upscaler restriction)", () => {
            const model = getModel("zimage")!
            // SPAN upscaler limit: 768×768 base × 2 = max 1536×1536 square (2,359,296 pixels)
            expect(model.constraints.maxPixels).toBe(2_359_296)
            expect(model.constraints.maxDimension).toBe(2048) // Max single dimension (e.g., 2048×1152)
        })

        it("should have correct dimensions for common aspect ratios (1920x1080 for 16:9, 1536x1536 for 1:1)", () => {
            const ratios = getModelAspectRatios("zimage")!

            const ratio169 = ratios.find((r) => r.value === "16:9")
            expect(ratio169).toBeDefined()
            expect(ratio169?.width).toBe(1920)
            expect(ratio169?.height).toBe(1080)

            const ratio916 = ratios.find((r) => r.value === "9:16")
            expect(ratio916).toBeDefined()
            expect(ratio916?.width).toBe(1080)
            expect(ratio916?.height).toBe(1920)

            const ratio11 = ratios.find((r) => r.value === "1:1")
            expect(ratio11).toBeDefined()
            expect(ratio11?.width).toBe(1536)
            expect(ratio11?.height).toBe(1536)
        })

        it("should have all presets under 2.36MP limit and step-aligned", () => {
            const ratios = getModelAspectRatios("zimage")!
            const step = 8
            const maxPixels = 2_359_296

            for (const ratio of ratios) {
                const pixels = ratio.width * ratio.height
                // All presets should be at or under the limit
                expect(pixels).toBeLessThanOrEqual(maxPixels)
                // All dimensions should be aligned to step 8
                expect(ratio.width % step).toBe(0)
                expect(ratio.height % step).toBe(0)
            }
        })

        it("should only support SD and HD tiers (not 2K)", () => {
            const model = getModel("zimage")!
            expect(model.constraints.supportedTiers).toEqual(["sd", "hd"])
        })
    })

    describe("NanoBanana Pro", () => {
        it("should have 4k pixel budget (approx 10MP) and 1k min dimension", () => {
            const model = getModel("nanobanana-pro")!
            expect(model.constraints.maxPixels).toBe(10_000_000)
            expect(model.constraints.maxDimension).toBe(4096)
            expect(model.constraints.minDimension).toBe(1024)
        })
    })

    describe("Flux Schnell", () => {
        it("should have 589,824 pixel limit (768x768 cap)", () => {
            const model = getModel("flux")!
            expect(model.constraints.maxPixels).toBe(589_824)
            expect(model.constraints.maxDimension).toBe(768)
        })

        it("should have step 8 for dimension alignment", () => {
            const model = getModel("flux")!
            expect(model.constraints.step).toBe(8)
        })

        it("should support negative prompts", () => {
            const model = getModel("flux")!
            expect(model.supportsNegativePrompt).toBe(true)
        })

        it("should only support SD and HD tiers", () => {
            const model = getModel("flux")!
            expect(model.constraints.supportedTiers).toEqual(["sd"])
        })

        it("should have all presets under 589,824 pixel limit and step-aligned to 8", () => {
            const ratios = getModelAspectRatios("flux")!
            const step = 8
            const maxPixels = 589_824

            for (const ratio of ratios) {
                const pixels = ratio.width * ratio.height
                // All presets should be at or under the limit
                expect(pixels).toBeLessThanOrEqual(maxPixels)
                // All dimensions should be aligned to step 8
                expect(ratio.width % step).toBe(0)
                expect(ratio.height % step).toBe(0)
            }
        })
    })
})

describe("Aspect Ratio Presets", () => {
    it("should have all Kontext presets under 1MP", () => {
        const ratios = getModelAspectRatios("kontext")!
        for (const ratio of ratios) {
            if (ratio.value !== "custom") {
                const pixels = ratio.width * ratio.height
                expect(pixels).toBeLessThan(1_048_577)
            }
        }
    })

    it("should have GPT Image limited to 3 presets (no custom)", () => {
        const ratios = getModelAspectRatios("gptimage")!
        expect(ratios.length).toBe(3)
        expect(ratios.every(r => r.value !== "custom")).toBe(true)
    })

    it("should have turbo presets within 768px limit", () => {
        const ratios = getModelAspectRatios("turbo")!
        expect(ratios).not.toBeNull()
        expect(ratios.length).toBeGreaterThan(0)
        for (const ratio of ratios) {
            expect(ratio.width).toBeLessThanOrEqual(768)
            expect(ratio.height).toBeLessThanOrEqual(768)
        }
    })

    it("should have NanoBanana Pro presets reflecting 4k resolution and min 1k", () => {
        const ratios = getModelAspectRatios("nanobanana-pro")!
        expect(ratios).not.toBeNull()
        for (const ratio of ratios) {
            expect(ratio.width).toBeGreaterThanOrEqual(1024)
            expect(ratio.height).toBeGreaterThanOrEqual(1024)
            // Check for 4k dim in 16:9
            if (ratio.value === "16:9") {
                expect(ratio.width).toBe(3840)
            }
        }
    })

    it("should have Flux Schnell presets within 768px limit", () => {
        const ratios = getModelAspectRatios("flux")!
        expect(ratios).not.toBeNull()
        expect(ratios.length).toBeGreaterThan(0)
        for (const ratio of ratios) {
            expect(ratio.width).toBeLessThanOrEqual(768)
            expect(ratio.height).toBeLessThanOrEqual(768)
        }
    })
})

describe("Video Model Properties", () => {
    describe("Veo", () => {
        it("should have duration constraints with fixed options", () => {
            const model = getModel("veo")!
            expect(model.durationConstraints).toBeDefined()
            expect(model.durationConstraints!.min).toBe(4)
            expect(model.durationConstraints!.max).toBe(8)
            expect(model.durationConstraints!.fixedOptions).toEqual([4, 6, 8])
            expect(model.durationConstraints!.defaultDuration).toBe(4)
        })

        it("should support audio", () => {
            const model = getModel("veo")!
            expect(model.supportsAudio).toBe(true)
        })

        it("should support interpolation", () => {
            const model = getModel("veo")!
            expect(model.supportsInterpolation).toBe(true)
        })
    })

    describe("Seedance", () => {
        it("should have duration constraints with range", () => {
            const model = getModel("seedance")!
            expect(model.durationConstraints).toBeDefined()
            expect(model.durationConstraints!.min).toBe(2)
            expect(model.durationConstraints!.max).toBe(10)
            expect(model.durationConstraints!.fixedOptions).toBeUndefined()
            expect(model.durationConstraints!.defaultDuration).toBe(5)
        })

        it("should not support audio", () => {
            const model = getModel("seedance")!
            expect(model.supportsAudio).toBeUndefined()
        })
    })

    describe("Seedance Pro", () => {
        it("should have same duration constraints as Seedance", () => {
            const model = getModel("seedance-pro")!
            expect(model.durationConstraints).toBeDefined()
            expect(model.durationConstraints!.min).toBe(2)
            expect(model.durationConstraints!.max).toBe(10)
        })
    })

    describe("Video aspect ratios", () => {
        it("should only support 16:9 and 9:16 for video models", () => {
            const veoRatios = getModelAspectRatios("veo")!
            const seedanceRatios = getModelAspectRatios("seedance")!

            expect(veoRatios.length).toBe(2)
            expect(veoRatios.map(r => r.value)).toEqual(["16:9", "9:16"])

            expect(seedanceRatios.length).toBe(2)
            expect(seedanceRatios.map(r => r.value)).toEqual(["16:9", "9:16"])
        })
    })
})

