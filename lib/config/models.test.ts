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
            expect(zimageConstraints!.maxPixels).toBe(4_194_304)
            expect(zimageConstraints!.step).toBe(32)
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
            expect(ALL_MODEL_IDS.length).toBe(12)
        })

        it("should have correct image model IDs", () => {
            expect(IMAGE_MODEL_IDS.length).toBe(9)
            expect(IMAGE_MODEL_IDS).toContain("zimage")
            expect(IMAGE_MODEL_IDS).toContain("gptimage")
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
        it("should have 4MP limit", () => {
            const model = getModel("zimage")!
            expect(model.constraints.maxPixels).toBe(4_194_304)
            expect(model.constraints.maxDimension).toBe(4096)
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
})
