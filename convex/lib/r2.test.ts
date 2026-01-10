/**
 * Tests for R2 storage utilities
 */

import { describe, it, expect } from "vitest"
import { generateR2Key, generateThumbnailKey } from "./r2"
import crypto from "crypto"

describe("r2 utilities", () => {
    describe("generateR2Key", () => {
        it("generates key with correct format", () => {
            const userId = "user123"
            const key = generateR2Key(userId, "image/jpeg")
            // Expect hash (hex) and UUID (dashes allowed)
            expect(key).toMatch(/^generated\/[a-f0-9]{64}\/\d+-[0-9a-f-]{36}\.jpeg$/)
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

        it("does NOT include raw user ID in path but includes hash", () => {
            const userId = "clerk_12345"
            const key = generateR2Key(userId, "image/jpeg")
            expect(key).not.toContain(userId)

            const expectedHash = crypto.createHash("sha256").update(userId).digest("hex")
            expect(key).toContain(expectedHash)
        })
    })

    describe("generateThumbnailKey", () => {
        it("replaces generated/ prefix with thumbnails/ and converts extension to jpg", () => {
            const originalKey = "generated/abc123/1234567890-uuid.jpeg"
            const thumbnailKey = generateThumbnailKey(originalKey)
            expect(thumbnailKey).toBe("thumbnails/abc123/1234567890-uuid.jpg")
        })

        it("preserves rest of the path structure but normalizes extension", () => {
            const originalKey = "generated/hash123/timestamp-uuid.png"
            const thumbnailKey = generateThumbnailKey(originalKey)
            expect(thumbnailKey).toMatch(/^thumbnails\//)
            expect(thumbnailKey).toContain("hash123/timestamp-uuid")
            expect(thumbnailKey).toMatch(/\.jpg$/)
        })

        it("handles edge case of no generated/ prefix", () => {
            // Should return unchanged if no match
            const key = "other/path/file.jpg"
            expect(generateThumbnailKey(key)).toBe(key)
        })
    })
})
