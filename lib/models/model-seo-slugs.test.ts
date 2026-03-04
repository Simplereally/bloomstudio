/**
 * Model SEO Slug Registry Tests
 *
 * Tests for the SEO slug registry, lookup helpers, and page-param generation.
 */

import { describe, expect, it } from "vitest"
import {
    MODEL_SEO_SLUGS,
    getModelBySlug,
    getModelByModelId,
    getAllModelSlugs,
    getAllModelPageParams,
} from "./model-seo-slugs"

describe("MODEL_SEO_SLUGS registry", () => {
    it("should contain only active (non-legacy) models", () => {
        // Current active set: 8 image + 1 video = 9
        expect(MODEL_SEO_SLUGS.length).toBeGreaterThan(0)
    })

    it("should have 8 image models", () => {
        const imageEntries = MODEL_SEO_SLUGS.filter((e) => e.type === "image")
        expect(imageEntries).toHaveLength(8)
    })

    it("should have 1 video model", () => {
        const videoEntries = MODEL_SEO_SLUGS.filter((e) => e.type === "video")
        expect(videoEntries).toHaveLength(1)
    })

    it("should have unique slugs", () => {
        const slugs = MODEL_SEO_SLUGS.map((e) => e.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
    })

    it("should have unique modelIds", () => {
        const ids = MODEL_SEO_SLUGS.map((e) => e.modelId)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it("should use lowercase hyphen-separated slugs only", () => {
        for (const entry of MODEL_SEO_SLUGS) {
            expect(entry.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        }
    })

    it("every entry should have at least 'create' and 'features' categories", () => {
        for (const entry of MODEL_SEO_SLUGS) {
            expect(entry.categories).toContain("create")
            expect(entry.categories).toContain("features")
        }
    })

    it("should not include legacy models", () => {
        const modelIds = MODEL_SEO_SLUGS.map((e) => e.modelId)
        // Known legacy models should be absent
        expect(modelIds).not.toContain("turbo")
        expect(modelIds).not.toContain("nanobanana")
        expect(modelIds).not.toContain("seedream")
        expect(modelIds).not.toContain("seedance")
    })
})

describe("FLUX.2 Dev SEO slug entry", () => {
    it("should exist in the registry", () => {
        const entry = MODEL_SEO_SLUGS.find((e) => e.modelId === "flux-2-dev")
        expect(entry).toBeDefined()
    })

    it("should have the correct slug", () => {
        const entry = getModelByModelId("flux-2-dev")
        expect(entry?.slug).toBe("flux-2-dev")
    })

    it("should have the correct display name", () => {
        const entry = getModelByModelId("flux-2-dev")
        expect(entry?.displayName).toBe("FLUX.2 Dev")
    })

    it("should be an image model", () => {
        const entry = getModelByModelId("flux-2-dev")
        expect(entry?.type).toBe("image")
    })

    it("should have 'create' and 'features' categories but NOT 'edit'", () => {
        const entry = getModelByModelId("flux-2-dev")
        expect(entry?.categories).toContain("create")
        expect(entry?.categories).toContain("features")
        expect(entry?.categories).not.toContain("edit")
    })
})

describe("getModelBySlug", () => {
    it("should find flux-2-dev by slug", () => {
        const entry = getModelBySlug("flux-2-dev")
        expect(entry).toBeDefined()
        expect(entry?.modelId).toBe("flux-2-dev")
    })

    it("should find flux-schnell by slug", () => {
        const entry = getModelBySlug("flux-schnell")
        expect(entry).toBeDefined()
        expect(entry?.modelId).toBe("flux")
    })

    it("should return undefined for an unknown slug", () => {
        expect(getModelBySlug("nonexistent-model")).toBeUndefined()
    })

    it("should return undefined for a modelId used as slug (when they differ)", () => {
        // "flux" is the modelId, "flux-schnell" is the slug
        expect(getModelBySlug("flux")).toBeUndefined()
    })
})

describe("getModelByModelId", () => {
    it("should find flux-2-dev by modelId", () => {
        const entry = getModelByModelId("flux-2-dev")
        expect(entry).toBeDefined()
        expect(entry?.slug).toBe("flux-2-dev")
    })

    it("should find flux by modelId", () => {
        const entry = getModelByModelId("flux")
        expect(entry).toBeDefined()
        expect(entry?.slug).toBe("flux-schnell")
    })

    it("should return undefined for an unknown modelId", () => {
        expect(getModelByModelId("nonexistent")).toBeUndefined()
    })
})

describe("getAllModelSlugs", () => {
    it("should return all slugs as an array of strings", () => {
        const slugs = getAllModelSlugs()
        expect(slugs).toHaveLength(MODEL_SEO_SLUGS.length)
        expect(slugs).toContain("flux-2-dev")
        expect(slugs).toContain("flux-schnell")
    })

    it("should contain only unique values", () => {
        const slugs = getAllModelSlugs()
        expect(new Set(slugs).size).toBe(slugs.length)
    })
})

describe("getAllModelPageParams", () => {
    it("should return flat slug+category pairs", () => {
        const params = getAllModelPageParams()
        expect(params.length).toBeGreaterThan(0)
        for (const param of params) {
            expect(param).toHaveProperty("slug")
            expect(param).toHaveProperty("category")
        }
    })

    it("should include flux-2-dev create and features pages", () => {
        const params = getAllModelPageParams()
        const flux2DevParams = params.filter((p) => p.slug === "flux-2-dev")
        expect(flux2DevParams).toHaveLength(2)
        expect(flux2DevParams.map((p) => p.category)).toContain("create")
        expect(flux2DevParams.map((p) => p.category)).toContain("features")
    })

    it("should include edit category for models that support it", () => {
        const params = getAllModelPageParams()
        const gptImageParams = params.filter((p) => p.slug === "gpt-image")
        expect(gptImageParams.map((p) => p.category)).toContain("edit")
    })

    it("should NOT include edit category for flux-2-dev", () => {
        const params = getAllModelPageParams()
        const flux2DevParams = params.filter((p) => p.slug === "flux-2-dev")
        expect(flux2DevParams.map((p) => p.category)).not.toContain("edit")
    })

    it("total params should equal sum of all entry categories", () => {
        const params = getAllModelPageParams()
        const expectedCount = MODEL_SEO_SLUGS.reduce(
            (sum, entry) => sum + entry.categories.length,
            0,
        )
        expect(params).toHaveLength(expectedCount)
    })
})
