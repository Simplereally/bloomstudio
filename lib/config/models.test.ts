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
                "klein",
                "klein-large",
                "imagen-4",
                "grok-imagine",
            ]

            for (const modelId of expectedImageModels) {
                expect(MODEL_REGISTRY[modelId]).toBeDefined()
                expect(MODEL_REGISTRY[modelId].type).toBe("image")
            }
        })

        it("should contain all expected video models", () => {
            const expectedVideoModels = ["seedance-pro", "seedance", "veo", "wan", "grok-video"]

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
            expect(MODEL_REGISTRY["nanobanana"].displayName).toBe("Nano Banana")
            expect(MODEL_REGISTRY["seedream-pro"].displayName).toBe("Seedream 4.5 Pro")
            expect(MODEL_REGISTRY["nanobanana-pro"].displayName).toBe("Nano Banana Pro")
            expect(MODEL_REGISTRY["seedance-pro"].displayName).toBe("Seedance Pro")
            expect(MODEL_REGISTRY["seedance"].displayName).toBe("Seedance")
            expect(MODEL_REGISTRY["veo"].displayName).toBe("Veo 3.1")
            expect(MODEL_REGISTRY["wan"].displayName).toBe("Wan 2.6")
            expect(MODEL_REGISTRY["klein"].displayName).toBe("FLUX.2 Klein 4B")
            expect(MODEL_REGISTRY["klein-large"].displayName).toBe("FLUX.2 Klein 9B")
            expect(MODEL_REGISTRY["imagen-4"].displayName).toBe("Imagen 4")
            expect(MODEL_REGISTRY["grok-imagine"].displayName).toBe("Grok Imagine")
            expect(MODEL_REGISTRY["grok-video"].displayName).toBe("Grok Video")
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
            expect(ALL_MODEL_IDS.length).toBe(19)
        })

        it("should have correct image model IDs", () => {
            expect(IMAGE_MODEL_IDS.length).toBe(14)
            expect(IMAGE_MODEL_IDS).toContain("zimage")
            expect(IMAGE_MODEL_IDS).toContain("gptimage")
            expect(IMAGE_MODEL_IDS).toContain("flux")
            expect(IMAGE_MODEL_IDS).toContain("klein")
            expect(IMAGE_MODEL_IDS).toContain("imagen-4")
            expect(IMAGE_MODEL_IDS).toContain("grok-imagine")
            expect(IMAGE_MODEL_IDS).not.toContain("veo")
        })

        it("should have correct video model IDs", () => {
            expect(VIDEO_MODEL_IDS.length).toBe(5)
            expect(VIDEO_MODEL_IDS).toContain("veo")
            expect(VIDEO_MODEL_IDS).toContain("seedance")
            expect(VIDEO_MODEL_IDS).toContain("wan")
            expect(VIDEO_MODEL_IDS).toContain("grok-video")
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

    describe("Nano Banana Pro", () => {
        it("should have ~17.2MP pixel budget and correct dimension limits from spec", () => {
            const model = getModel("nanobanana-pro")!
            // Per spec: max ~17.2 MP at 4K tier (e.g., 4800×3584)
            expect(model.constraints.maxPixels).toBe(17_203_200)
            // Max dimension from 4K tier 21:9 = 6336×2688
            expect(model.constraints.maxDimension).toBe(6336)
            // Min dimension from 1K tier 21:9 = 1584×672
            expect(model.constraints.minDimension).toBe(672)
            // Fixed output dimensions - no custom
            expect(model.constraints.dimensionsEnabled).toBe(false)
            // Supports HD→1K, 2K→2K, 4K→4K tiers
            expect(model.constraints.supportedTiers).toEqual(["hd", "2k", "4k"])
        })
    })

    describe("Nano Banana", () => {
        it("should have ~1.05MP pixel budget and correct dimension limits from spec", () => {
            const model = getModel("nanobanana")!
            // Per spec: max ~1.05 MP (1024×1024 max)
            expect(model.constraints.maxPixels).toBe(1_048_576)
            // Max dimension from 21:9 = 1536×672
            expect(model.constraints.maxDimension).toBe(1536)
            // Min dimension from 21:9 = 1536×672
            expect(model.constraints.minDimension).toBe(672)
            // Fixed output dimensions - no custom
            expect(model.constraints.dimensionsEnabled).toBe(false)
            // Single tier only - fixed output per aspect ratio
            expect(model.constraints.supportedTiers).toEqual(["hd"])
            // Exact output dimensions per aspect ratio
            expect(model.constraints.outputCertainty).toBe("exact")
        })
    })

    describe("Flux Schnell", () => {
        it("should have 1MP pixel limit (matches Klein 9B)", () => {
            const model = getModel("flux")!
            expect(model.constraints.maxPixels).toBe(1_048_576)
            expect(model.constraints.maxDimension).toBe(1600)
        })

        it("should have step 16 for dimension alignment", () => {
            const model = getModel("flux")!
            expect(model.constraints.step).toBe(16)
        })

        it("should support negative prompts", () => {
            const model = getModel("flux")!
            expect(model.supportsNegativePrompt).toBe(true)
        })

        it("should support SD and HD tiers", () => {
            const model = getModel("flux")!
            expect(model.constraints.supportedTiers).toEqual(["sd", "hd"])
        })

        it("should have all presets under 1MP pixel limit and step-aligned to 16", () => {
            const ratios = getModelAspectRatios("flux")!
            const step = 16
            const maxPixels = 1_048_576

            for (const ratio of ratios) {
                const pixels = ratio.width * ratio.height
                // All presets should be at or under the limit
                expect(pixels).toBeLessThanOrEqual(maxPixels)
                // All dimensions should be aligned to step 16
                expect(ratio.width % step).toBe(0)
                expect(ratio.height % step).toBe(0)
            }
        })
    })

    describe("Klein 4B (Flux.2)", () => {
        it("should have 4MP pixel limit", () => {
            const model = getModel("klein")!
            expect(model.constraints.maxPixels).toBe(4_000_000)
            expect(model.constraints.maxDimension).toBe(2560)
        })

        it("should have step 16", () => {
            const model = getModel("klein")!
            expect(model.constraints.step).toBe(16)
        })

        it("should support HD and 2K tiers", () => {
            const model = getModel("klein")!
            expect(model.constraints.supportedTiers).toEqual(["hd", "2k"])
        })
    })

    describe("Klein 9B (klein-large)", () => {
        it("should have 1MP pixel limit", () => {
            const model = getModel("klein-large")!
            expect(model.constraints.maxPixels).toBe(1_048_576)
        })

        it("should have step 16", () => {
            const model = getModel("klein-large")!
            expect(model.constraints.step).toBe(16)
        })

        it("should have 256px minimum dimension", () => {
            const model = getModel("klein-large")!
            expect(model.constraints.minDimension).toBe(256)
            expect(model.constraints.minPixels).toBe(65_536) // 256×256
        })

        it("should support only SD and HD tiers due to 1MP cap", () => {
            const model = getModel("klein-large")!
            expect(model.constraints.supportedTiers).toEqual(["sd", "hd"])
        })

        it("should have default dimensions of 1024x1024", () => {
            const model = getModel("klein-large")!
            expect(model.constraints.defaultDimensions).toEqual({ width: 1024, height: 1024 })
        })
    })

    describe("Imagen 4", () => {
        it("should have fixed dimensions (DALL-E 3 standard)", () => {
            const model = getModel("imagen-4")!
            expect(model.constraints.dimensionsEnabled).toBe(false)
            expect(model.constraints.outputCertainty).toBe("exact")
            expect(model.constraints.minDimension).toBe(1024)
            expect(model.constraints.maxDimension).toBe(1792)
            expect(model.constraints.defaultDimensions).toEqual({ width: 1024, height: 1024 })
        })

        it("should not support negative prompts or reference images", () => {
            const model = getModel("imagen-4")!
            expect(model.supportsNegativePrompt).toBe(false)
            expect(model.supportsReferenceImage).toBeUndefined()
        })

        it("should have correct provider metadata", () => {
            const model = getModel("imagen-4")!
            expect(model.icon).toBe("sparkles")
            expect(model.logo).toBe("/image-models/google.svg")
            expect(model.isLegacy).toBeUndefined()
        })

        it("should only support HD tier", () => {
            const model = getModel("imagen-4")!
            expect(model.constraints.supportedTiers).toEqual(["hd"])
        })
    })

    describe("Grok Imagine", () => {
        it("should have fixed dimensions (DALL-E 3 standard)", () => {
            const model = getModel("grok-imagine")!
            expect(model.constraints.dimensionsEnabled).toBe(false)
            expect(model.constraints.outputCertainty).toBe("exact")
            expect(model.constraints.minDimension).toBe(1024)
            expect(model.constraints.maxDimension).toBe(1792)
            expect(model.constraints.defaultDimensions).toEqual({ width: 1024, height: 1024 })
        })

        it("should not support negative prompts or reference images", () => {
            const model = getModel("grok-imagine")!
            expect(model.supportsNegativePrompt).toBe(false)
            expect(model.supportsReferenceImage).toBeUndefined()
        })

        it("should have correct provider metadata", () => {
            const model = getModel("grok-imagine")!
            expect(model.icon).toBe("sparkles")
            expect(model.logo).toBe("/image-models/xai.svg")
            expect(model.isLegacy).toBeUndefined()
        })

        it("should only support HD tier", () => {
            const model = getModel("grok-imagine")!
            expect(model.constraints.supportedTiers).toEqual(["hd"])
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

    it("should have all Klein 9B presets under 1MP and aligned to step 16", () => {
        const ratios = getModelAspectRatios("klein-large")!
        for (const ratio of ratios) {
            if (ratio.value !== "custom") {
                const pixels = ratio.width * ratio.height
                expect(pixels).toBeLessThanOrEqual(1_048_576)
                expect(ratio.width % 16).toBe(0)
                expect(ratio.height % 16).toBe(0)
            }
        }
        // Verify default square is exactly 1024x1024
        const square = ratios.find(r => r.value === "1:1")
        expect(square?.width).toBe(1024)
        expect(square?.height).toBe(1024)
    })

    it("should have all Klein 4B presets under 4MP and aligned to step 16", () => {
        const ratios = getModelAspectRatios("klein")!
        for (const ratio of ratios) {
            if (ratio.value !== "custom") {
                const pixels = ratio.width * ratio.height
                expect(pixels).toBeLessThanOrEqual(4_000_000)
                expect(ratio.width % 16).toBe(0)
                expect(ratio.height % 16).toBe(0)
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

    it("should have Nano Banana Pro presets with correct 1K tier dimensions from spec", () => {
        const ratios = getModelAspectRatios("nanobanana-pro")!
        expect(ratios).not.toBeNull()
        // Default dimensions shown are for 1K (HD) tier
        // Should NOT include 9:21 (not supported per spec)
        expect(ratios.every(r => r.value !== "9:21")).toBe(true)
        
        // Check specific dimensions from spec for 1K tier
        const square = ratios.find(r => r.value === "1:1")
        expect(square?.width).toBe(1024)
        expect(square?.height).toBe(1024)
        
        const landscape = ratios.find(r => r.value === "16:9")
        expect(landscape?.width).toBe(1376)
        expect(landscape?.height).toBe(768)
        
        const ultrawide = ratios.find(r => r.value === "21:9")
        expect(ultrawide?.width).toBe(1584)
        expect(ultrawide?.height).toBe(672)
    })

    it("should have Nano Banana presets with correct fixed dimensions from spec", () => {
        const ratios = getModelAspectRatios("nanobanana")!
        expect(ratios).not.toBeNull()
        // Should NOT include 9:21 (not supported per spec)
        expect(ratios.every(r => r.value !== "9:21")).toBe(true)
        // Should NOT include custom (fixed output only)
        expect(ratios.every(r => r.value !== "custom")).toBe(true)
        
        // Check specific dimensions from spec
        const square = ratios.find(r => r.value === "1:1")
        expect(square?.width).toBe(1024)
        expect(square?.height).toBe(1024)
        
        const landscape = ratios.find(r => r.value === "16:9")
        expect(landscape?.width).toBe(1344)
        expect(landscape?.height).toBe(768)
        
        const portrait = ratios.find(r => r.value === "9:16")
        expect(portrait?.width).toBe(768)
        expect(portrait?.height).toBe(1344)
        
        const ultrawide = ratios.find(r => r.value === "21:9")
        expect(ultrawide?.width).toBe(1536)
        expect(ultrawide?.height).toBe(672)
    })

    it("should have Flux Schnell presets under 1MP and aligned to step 16", () => {
        const ratios = getModelAspectRatios("flux")!
        expect(ratios).not.toBeNull()
        expect(ratios.length).toBeGreaterThan(0)
        for (const ratio of ratios) {
            if (ratio.value !== "custom") {
                const pixels = ratio.width * ratio.height
                expect(pixels).toBeLessThanOrEqual(1_048_576)
                expect(ratio.width % 16).toBe(0)
                expect(ratio.height % 16).toBe(0)
            }
        }
    })

    it("should have Imagen 4 limited to 3 presets (no custom) with DALL-E 3 standard dimensions", () => {
        const ratios = getModelAspectRatios("imagen-4")!
        expect(ratios.length).toBe(3)
        expect(ratios.every(r => r.value !== "custom")).toBe(true)

        const square = ratios.find(r => r.value === "1:1")
        expect(square?.width).toBe(1024)
        expect(square?.height).toBe(1024)

        const landscape = ratios.find(r => r.value === "16:9")
        expect(landscape?.width).toBe(1792)
        expect(landscape?.height).toBe(1024)

        const portrait = ratios.find(r => r.value === "9:16")
        expect(portrait?.width).toBe(1024)
        expect(portrait?.height).toBe(1792)
    })

    it("should have Grok Imagine limited to 3 presets (no custom) with DALL-E 3 standard dimensions", () => {
        const ratios = getModelAspectRatios("grok-imagine")!
        expect(ratios.length).toBe(3)
        expect(ratios.every(r => r.value !== "custom")).toBe(true)

        const square = ratios.find(r => r.value === "1:1")
        expect(square?.width).toBe(1024)
        expect(square?.height).toBe(1024)

        const landscape = ratios.find(r => r.value === "16:9")
        expect(landscape?.width).toBe(1792)
        expect(landscape?.height).toBe(1024)

        const portrait = ratios.find(r => r.value === "9:16")
        expect(portrait?.width).toBe(1024)
        expect(portrait?.height).toBe(1792)
    })

    it("should have Imagen 4 and Grok Imagine share identical aspect ratios", () => {
        const imagenRatios = getModelAspectRatios("imagen-4")!
        const grokRatios = getModelAspectRatios("grok-imagine")!
        expect(imagenRatios).toEqual(grokRatios)
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

    describe("Wan", () => {
        it("should have duration constraints 2-15s", () => {
            const model = getModel("wan")!
            expect(model.durationConstraints?.min).toBe(2)
            expect(model.durationConstraints?.max).toBe(15)
            expect(model.durationConstraints?.defaultDuration).toBe(5)
        })

        it("should support audio and reference image", () => {
            const model = getModel("wan")!
            expect(model.supportsAudio).toBe(true)
            expect(model.supportsReferenceImage).toBe(true)
        })
    })

    describe("Grok Video", () => {
        it("should have correct duration constraints (5s default, 10s max)", () => {
            const model = getModel("grok-video")!
            expect(model.durationConstraints).toBeDefined()
            expect(model.durationConstraints!.min).toBe(2)
            expect(model.durationConstraints!.max).toBe(10)
            expect(model.durationConstraints!.defaultDuration).toBe(5)
            expect(model.durationConstraints!.fixedOptions).toBeUndefined()
        })

        it("should support reference image (image-to-video)", () => {
            const model = getModel("grok-video")!
            expect(model.supportsReferenceImage).toBe(true)
        })

        it("should not support audio", () => {
            const model = getModel("grok-video")!
            expect(model.supportsAudio).toBeUndefined()
        })

        it("should have correct provider metadata", () => {
            const model = getModel("grok-video")!
            expect(model.icon).toBe("video")
            expect(model.logo).toBe("/image-models/xai.svg")
            expect(model.isLegacy).toBeUndefined()
        })

        it("should have video constraints with 720p default", () => {
            const model = getModel("grok-video")!
            expect(model.constraints.dimensionsEnabled).toBe(false)
            expect(model.constraints.defaultDimensions).toEqual({ width: 1280, height: 720 })
            expect(model.constraints.minDimension).toBe(480)
            expect(model.constraints.maxDimension).toBe(1920)
            expect(model.constraints.supportedTiers).toEqual(["sd", "hd"])
        })

        it("should have per-second video pricing at $0.0025/s", () => {
            const model = getModel("grok-video")!
            expect(model.modelPricing.type).toBe("video")
            expect(model.modelPricing.videoPricing?.perSecond).toBe(0.0025)
            expect(model.modelPricing.isAlpha).toBe(true)
            expect(model.modelPricing.supportsReferenceImage).toBe(true)
        })

        it("should have approximatePerPollen consistent with perSecond pricing at default duration", () => {
            const model = getModel("grok-video")!
            const perSecond = model.modelPricing.videoPricing?.perSecond
            expect(perSecond).toBeDefined()
            const defaultDuration = model.durationConstraints!.defaultDuration
            const costPerVideo = perSecond! * defaultDuration
            const expectedEfficiency = 1 / costPerVideo
            expect(model.modelPricing.approximatePerPollen).toBe(expectedEfficiency)
        })

        it("should have only 16:9 and 9:16 aspect ratios (like other video models)", () => {
            const ratios = getModelAspectRatios("grok-video")!
            expect(ratios.length).toBe(2)
            expect(ratios.map(r => r.value)).toEqual(["16:9", "9:16"])
        })
    })

    describe("Video aspect ratios", () => {
        it("should only support 16:9 and 9:16 for video models", () => {
            const veoRatios = getModelAspectRatios("veo")!
            const seedanceRatios = getModelAspectRatios("seedance")!
            const grokVideoRatios = getModelAspectRatios("grok-video")!

            expect(veoRatios.length).toBe(2)
            expect(veoRatios.map(r => r.value)).toEqual(["16:9", "9:16"])

            expect(seedanceRatios.length).toBe(2)
            expect(seedanceRatios.map(r => r.value)).toEqual(["16:9", "9:16"])

            expect(grokVideoRatios.length).toBe(2)
            expect(grokVideoRatios.map(r => r.value)).toEqual(["16:9", "9:16"])
        })
    })
})

