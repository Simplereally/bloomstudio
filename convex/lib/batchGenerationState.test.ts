import { describe, expect, it } from "vitest"
import {
    buildRecordBatchItemResultTransition,
    getBatchStatusAfterItemSettlement,
    getResumeBatchDecision,
} from "./batchGenerationState"

describe("getResumeBatchDecision", () => {
    it("blocks resume while in-flight work is still draining", () => {
        expect(
            getResumeBatchDecision({
                currentIndex: 4,
                totalCount: 10,
                inFlightCount: 2,
                settledItemIndexes: [0, 1, 2, 3],
            })
        ).toEqual({
            canSchedule: false,
            itemIndex: null,
            nextInFlightCount: 2,
            reason: "in_flight",
        })
    })

    it("resumes from the next unsettled item once work has drained", () => {
        expect(
            getResumeBatchDecision({
                currentIndex: 3,
                totalCount: 6,
                inFlightCount: 0,
                settledItemIndexes: [0, 1, 2, 3],
            })
        ).toEqual({
            canSchedule: true,
            itemIndex: 4,
            nextInFlightCount: 1,
            reason: null,
        })
    })
})

describe("buildRecordBatchItemResultTransition", () => {
    it("does not double-count a duplicate item result", () => {
        expect(
            buildRecordBatchItemResultTransition(
                {
                    completedCount: 2,
                    failedCount: 1,
                    imageIds: ["img_1", "img_2"],
                    inFlightCount: 2,
                    settledItemIndexes: [0, 1, 2],
                    status: "processing",
                    totalCount: 5,
                },
                {
                    itemIndex: 2,
                    success: true,
                    imageId: "img_duplicate",
                }
            )
        ).toEqual({
            isDuplicate: true,
            shouldDelete: false,
            updates: {
                inFlightCount: 1,
            },
        })
    })

    it("records a fresh success and marks pending batches as processing", () => {
        expect(
            buildRecordBatchItemResultTransition(
                {
                    completedCount: 0,
                    failedCount: 0,
                    imageIds: [],
                    inFlightCount: 1,
                    settledItemIndexes: [],
                    status: "pending",
                    totalCount: 3,
                },
                {
                    itemIndex: 0,
                    success: true,
                    imageId: "img_1",
                }
            )
        ).toEqual({
            isDuplicate: false,
            shouldDelete: false,
            updates: {
                completedCount: 1,
                imageIds: ["img_1"],
                inFlightCount: 0,
                settledItemIndexes: [0],
                status: "processing",
            },
        })
    })
})

describe("getBatchStatusAfterItemSettlement", () => {
    it("transitions pending batches to processing when work remains", () => {
        expect(
            getBatchStatusAfterItemSettlement({
                completedCount: 1,
                failedCount: 0,
                totalCount: 3,
                status: "pending",
            })
        ).toBe("processing")
    })

    it("keeps a partially failed batch running", () => {
        expect(
            getBatchStatusAfterItemSettlement({
                completedCount: 90,
                failedCount: 1,
                totalCount: 100,
                status: "processing",
            })
        ).toBe("processing")
    })

    it("marks a mixed-result finished batch as completed", () => {
        expect(
            getBatchStatusAfterItemSettlement({
                completedCount: 90,
                failedCount: 10,
                totalCount: 100,
                status: "processing",
            })
        ).not.toBe("failed")

        expect(
            getBatchStatusAfterItemSettlement({
                completedCount: 3,
                failedCount: 1,
                totalCount: 4,
                status: "processing",
            })
        ).toBe("completed")
    })

    it("marks an all-failed batch as failed", () => {
        expect(
            getBatchStatusAfterItemSettlement({
                completedCount: 0,
                failedCount: 4,
                totalCount: 4,
                status: "processing",
            })
        ).toBe("failed")
    })
})
