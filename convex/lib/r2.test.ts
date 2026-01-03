/**
 * Tests for R2 storage utilities
 */

import { describe, it, expect } from "vitest"
import { generateR2Key } from "./r2"

describe("r2 utilities", () => {
    describe("generateR2Key", () => {
        it("generates key with correct format", () => {
            const key = generateR2Key("user123", "image/jpeg")
            expect(key).toMatch(/^generated\/user123\/\d+-[a-z0-9]+\.jpeg$/)
        })

        it("extracts extension from content type", () => {
            expect(generateR2Key("user", "image/png")).toMatch(/\.png$/)
            expect(generateR2Key("user", "image/webp")).toMatch(/\.webp$/)
            expect(generateR2Key("user", "image/gif")).toMatch(/\.gif$/)
        })

        it("defaults to jpg for invalid content type", () => {
            expect(generateR2Key("user", "invalid")).toMatch(/\.jpg$/)
            expect(generateR2Key("user", "")).toMatch(/\.jpg$/)
        })

        it("generates unique keys", () => {
            const keys = new Set<string>()
            for (let i = 0; i < 100; i++) {
                keys.add(generateR2Key("user", "image/jpeg"))
            }
            // All keys should be unique
            expect(keys.size).toBe(100)
        })

        it("includes user ID in path", () => {
            const key = generateR2Key("clerk_12345", "image/jpeg")
            expect(key).toContain("clerk_12345")
        })
    })
})
