/**
 * Standard Resolutions Configuration Tests
 *
 * Tests for the standard resolution definitions and utilities.
 */

import { describe, expect, it } from "vitest"
import {
    ASPECT_RATIO_DEFINITIONS,
    CUSTOM_ASPECT_RATIO,
    STANDARD_RESOLUTIONS,
    getStandardDimensions,
    getAspectRatioDefinition,
    getAllAspectRatioDefinitions,
    getStandardDimensionsWithFallback,
} from "./standard-resolutions"

describe("Standard Resolutions Configuration", () => {
    describe("ASPECT_RATIO_DEFINITIONS", () => {
        it("should have all standard aspect ratios defined", () => {
            expect(ASPECT_RATIO_DEFINITIONS["1:1"]).toBeDefined()
            expect(ASPECT_RATIO_DEFINITIONS["16:9"]).toBeDefined()
            expect(ASPECT_RATIO_DEFINITIONS["9:16"]).toBeDefined()
            expect(ASPECT_RATIO_DEFINITIONS["4:3"]).toBeDefined()
            expect(ASPECT_RATIO_DEFINITIONS["3:4"]).toBeDefined()
            expect(ASPECT_RATIO_DEFINITIONS["3:2"]).toBeDefined()
            expect(ASPECT_RATIO_DEFINITIONS["2:3"]).toBeDefined()
            expect(ASPECT_RATIO_DEFINITIONS["4:5"]).toBeDefined()
            expect(ASPECT_RATIO_DEFINITIONS["5:4"]).toBeDefined()
            expect(ASPECT_RATIO_DEFINITIONS["21:9"]).toBeDefined()
            expect(ASPECT_RATIO_DEFINITIONS["9:21"]).toBeDefined()
        })

        it("should have labels and icons for all aspect ratios", () => {
            for (const def of Object.values(ASPECT_RATIO_DEFINITIONS)) {
                expect(def.label).toBeDefined()
                expect(def.icon).toBeDefined()
                expect(def.category).toBeDefined()
            }
        })
    })

    describe("CUSTOM_ASPECT_RATIO", () => {
        it("should have custom value", () => {
            expect(CUSTOM_ASPECT_RATIO.value).toBe("custom")
            expect(CUSTOM_ASPECT_RATIO.label).toBe("Custom")
        })
    })

    describe("STANDARD_RESOLUTIONS", () => {
        it("should have all resolution tiers defined (except max)", () => {
            expect(STANDARD_RESOLUTIONS.sd).toBeDefined()
            expect(STANDARD_RESOLUTIONS.hd).toBeDefined()
            expect(STANDARD_RESOLUTIONS["2k"]).toBeDefined()
            expect(STANDARD_RESOLUTIONS["4k"]).toBeDefined()
        })

        it("should have standard HD 16:9 resolution as 1920x1080", () => {
            expect(STANDARD_RESOLUTIONS.hd["16:9"]).toEqual({ width: 1920, height: 1080 })
        })

        it("should have standard HD 9:16 resolution as 1080x1920", () => {
            expect(STANDARD_RESOLUTIONS.hd["9:16"]).toEqual({ width: 1080, height: 1920 })
        })

        it("should have standard HD 1:1 resolution as 1024x1024", () => {
            expect(STANDARD_RESOLUTIONS.hd["1:1"]).toEqual({ width: 1024, height: 1024 })
        })

        it("should have standard 4K 16:9 resolution as 3840x2160", () => {
            expect(STANDARD_RESOLUTIONS["4k"]["16:9"]).toEqual({ width: 3840, height: 2160 })
        })

        it("should have standard SD 16:9 resolution as 960x540", () => {
            expect(STANDARD_RESOLUTIONS.sd["16:9"]).toEqual({ width: 960, height: 540 })
        })

        it("should have dimensions that maintain proper aspect ratios", () => {
            // 16:9 aspect ratio check
            const hd169 = STANDARD_RESOLUTIONS.hd["16:9"]
            expect(Math.abs((hd169.width / hd169.height) - (16 / 9))).toBeLessThan(0.01)

            // 4:3 aspect ratio check
            const hd43 = STANDARD_RESOLUTIONS.hd["4:3"]
            expect(Math.abs((hd43.width / hd43.height) - (4 / 3))).toBeLessThan(0.01)
        })
    })
})

describe("getStandardDimensions", () => {
    it("should return correct dimensions for HD 16:9", () => {
        const dims = getStandardDimensions("16:9", "hd")
        expect(dims).toEqual({ width: 1920, height: 1080 })
    })

    it("should return correct dimensions for 4K 16:9", () => {
        const dims = getStandardDimensions("16:9", "4k")
        expect(dims).toEqual({ width: 3840, height: 2160 })
    })

    it("should return null for custom aspect ratio", () => {
        const dims = getStandardDimensions("custom", "hd")
        expect(dims).toBeNull()
    })

    it("should return null for max tier", () => {
        const dims = getStandardDimensions("16:9", "max")
        expect(dims).toBeNull()
    })
})

describe("getAspectRatioDefinition", () => {
    it("should return correct definition for 16:9", () => {
        const def = getAspectRatioDefinition("16:9")
        expect(def.label).toBe("Landscape")
        expect(def.value).toBe("16:9")
        expect(def.category).toBe("landscape")
    })

    it("should return custom definition for custom ratio", () => {
        const def = getAspectRatioDefinition("custom")
        expect(def.label).toBe("Custom")
        expect(def.value).toBe("custom")
    })
})

describe("getAllAspectRatioDefinitions", () => {
    it("should return array of all definitions including custom", () => {
        const defs = getAllAspectRatioDefinitions()
        expect(defs.length).toBe(12) // 11 standard + 1 custom
        expect(defs.some(d => d.value === "custom")).toBe(true)
        expect(defs.some(d => d.value === "16:9")).toBe(true)
    })
})

describe("getStandardDimensionsWithFallback", () => {
    it("should return standard dimensions for valid ratio and tier", () => {
        const dims = getStandardDimensionsWithFallback("16:9", "hd")
        expect(dims).toEqual({ width: 1920, height: 1080 })
    })

    it("should return 4K dimensions for max tier", () => {
        const dims = getStandardDimensionsWithFallback("16:9", "max")
        expect(dims).toEqual({ width: 3840, height: 2160 }) // Falls back to 4K
    })

    it("should return default dimensions for custom ratio", () => {
        const dims = getStandardDimensionsWithFallback("custom", "hd")
        expect(dims).toEqual({ width: 1024, height: 1024 })
    })
})
