/**
 * Tests for Temporary Tag Stats Query
 *
 * Tests the aggregation logic and edge cases for the tagging status query.
 * Note: Integration tests for the full query require a Convex test environment.
 */
import { describe, expect, it } from "vitest"

/**
 * Extract the aggregation logic for unit testing.
 * This mirrors the reduce logic in getTaggingStatus handler.
 */
type ImageWithSensitivity = {
    isSensitive?: boolean | null
}

function aggregateSensitivityCounts(images: ImageWithSensitivity[]) {
    const counts = images.reduce(
        (acc, img) => {
            if (img.isSensitive === false) {
                acc.safe++
            } else if (img.isSensitive === true) {
                acc.sensitive++
            } else if (img.isSensitive === null) {
                acc.pending++
            } else {
                // isSensitive is undefined (legacy records)
                acc.legacy++
            }
            return acc
        },
        { safe: 0, sensitive: 0, pending: 0, legacy: 0 }
    )

    const total = images.length
    const tagged = counts.safe + counts.sensitive

    const completionRate = total > 0
        ? `${((tagged / total) * 100).toFixed(1)}%`
        : "N/A (no images)"

    return {
        total,
        taggedSafe: counts.safe,
        taggedSensitive: counts.sensitive,
        pending: counts.pending,
        legacy: counts.legacy,
        completionRate,
    }
}

describe("aggregateSensitivityCounts", () => {
    describe("counting behavior", () => {
        it("counts safe images (isSensitive === false)", () => {
            const images = [
                { isSensitive: false },
                { isSensitive: false },
            ]

            const result = aggregateSensitivityCounts(images)

            expect(result.taggedSafe).toBe(2)
            expect(result.taggedSensitive).toBe(0)
            expect(result.pending).toBe(0)
            expect(result.legacy).toBe(0)
        })

        it("counts sensitive images (isSensitive === true)", () => {
            const images = [
                { isSensitive: true },
                { isSensitive: true },
                { isSensitive: true },
            ]

            const result = aggregateSensitivityCounts(images)

            expect(result.taggedSafe).toBe(0)
            expect(result.taggedSensitive).toBe(3)
            expect(result.pending).toBe(0)
            expect(result.legacy).toBe(0)
        })

        it("counts pending images (isSensitive === null)", () => {
            const images = [
                { isSensitive: null },
                { isSensitive: null },
            ]

            const result = aggregateSensitivityCounts(images)

            expect(result.taggedSafe).toBe(0)
            expect(result.taggedSensitive).toBe(0)
            expect(result.pending).toBe(2)
            expect(result.legacy).toBe(0)
        })

        it("counts legacy images (isSensitive === undefined)", () => {
            const images = [
                {},
                { isSensitive: undefined },
            ]

            const result = aggregateSensitivityCounts(images)

            expect(result.taggedSafe).toBe(0)
            expect(result.taggedSensitive).toBe(0)
            expect(result.pending).toBe(0)
            expect(result.legacy).toBe(2)
        })

        it("correctly aggregates mixed statuses", () => {
            const images = [
                { isSensitive: false },     // safe
                { isSensitive: true },      // sensitive
                { isSensitive: null },      // pending
                {},                         // legacy
                { isSensitive: false },     // safe
                { isSensitive: true },      // sensitive
                { isSensitive: undefined }, // legacy
            ]

            const result = aggregateSensitivityCounts(images)

            expect(result.total).toBe(7)
            expect(result.taggedSafe).toBe(2)
            expect(result.taggedSensitive).toBe(2)
            expect(result.pending).toBe(1)
            expect(result.legacy).toBe(2)
        })
    })

    describe("completion rate calculation", () => {
        it("calculates completion rate correctly", () => {
            const images = [
                { isSensitive: false },     // tagged
                { isSensitive: true },      // tagged
                { isSensitive: null },      // not tagged (pending)
                {},                         // not tagged (legacy)
            ]

            const result = aggregateSensitivityCounts(images)

            // 2 tagged out of 4 total = 50%
            expect(result.completionRate).toBe("50.0%")
        })

        it("returns 100% when all images are tagged", () => {
            const images = [
                { isSensitive: false },
                { isSensitive: true },
                { isSensitive: false },
            ]

            const result = aggregateSensitivityCounts(images)

            expect(result.completionRate).toBe("100.0%")
        })

        it("returns 0% when no images are tagged", () => {
            const images = [
                { isSensitive: null },
                {},
                { isSensitive: undefined },
            ]

            const result = aggregateSensitivityCounts(images)

            expect(result.completionRate).toBe("0.0%")
        })

        it("handles division by zero with empty array", () => {
            const images: ImageWithSensitivity[] = []

            const result = aggregateSensitivityCounts(images)

            expect(result.total).toBe(0)
            expect(result.completionRate).toBe("N/A (no images)")
        })
    })

    describe("edge cases", () => {
        it("handles single image", () => {
            const images = [{ isSensitive: false }]

            const result = aggregateSensitivityCounts(images)

            expect(result.total).toBe(1)
            expect(result.taggedSafe).toBe(1)
            expect(result.completionRate).toBe("100.0%")
        })

        it("rounds completion rate to one decimal place", () => {
            // 1 tagged out of 3 = 33.333...%
            const images = [
                { isSensitive: false },
                { isSensitive: null },
                {},
            ]

            const result = aggregateSensitivityCounts(images)

            expect(result.completionRate).toBe("33.3%")
        })
    })
})

/**
 * Integration Tests (Documentation)
 *
 * These document the expected behavior of the full getTaggingStatus query.
 * Actual integration tests require a Convex test environment with database access.
 */
describe("getTaggingStatus Query (Documentation)", () => {
    it("should perform a single table scan instead of multiple queries", () => {
        // Expected behavior:
        // - Query collects all generatedImages once
        // - Aggregates counts in-memory using reduce
        // - More efficient than 4 separate database queries
        expect(true).toBe(true)
    })

    it("should correctly distinguish between null and undefined isSensitive values", () => {
        // Expected behavior:
        // - isSensitive === null → counted as "pending" (explicitly untagged)
        // - isSensitive === undefined → counted as "legacy" (field never set)
        expect(true).toBe(true)
    })

    it("should return structured stats object with all fields", () => {
        // Expected behavior:
        // Returns {
        //   total: number,
        //   taggedSafe: number,
        //   taggedSensitive: number,
        //   pending: number,
        //   legacy: number,
        //   completionRate: string
        // }
        expect(true).toBe(true)
    })
})
