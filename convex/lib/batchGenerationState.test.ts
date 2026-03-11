import "@testing-library/jest-dom/vitest"
import { describe, expect, it } from "vitest"
import {
    buildRecordBatchItemResultTransition,
    getResumeBatchDecision,
} from "./batchGenerationState"

describe("getResumeBatchDecision", () => {
    it("blocks resume while in-flight work is still draining", () => {
        expect(
            getResumeBatchDecision({
                currentIndex: 4,
                totalCount: 10,
                inFlightCount: 2,
            })
        ).toEqual({
            canSchedule: false,
            itemIndex: null,
            nextInFlightCount: 2,
            reason: "in_flight",
        })
    })

    it("increments inFlightCount when a drained paused batch resumes", () => {
        expect(
            getResumeBatchDecision({
                currentIndex: 4,
                totalCount: 10,
                inFlightCount: 0,
            })
        ).toEqual({
            canSchedule: true,
            itemIndex: 4,
            nextInFlightCount: 1,
            reason: null,
        })
    })

    it("advances to the next unsettled index when the current index is already settled", () => {
        expect(
            getResumeBatchDecision({
                currentIndex: 4,
                totalCount: 10,
                inFlightCount: 0,
                settledItemIndexes: [0, 1, 2, 3, 4],
            })
        ).toEqual({
            canSchedule: true,
            itemIndex: 5,
            nextInFlightCount: 1,
            reason: null,
        })
    })
})

describe("buildRecordBatchItemResultTransition", () => {
    it("does not increment totals twice for the same settled item", () => {
        const transition = buildRecordBatchItemResultTransition(
            {
                completedCount: 3,
                failedCount: 1,
                imageIds: ["img-1", "img-2", "img-3"],
                inFlightCount: 2,
                settledItemIndexes: [0, 1, 2, 3],
                status: "processing",
                totalCount: 10,
            },
            {
                itemIndex: 3,
                success: true,
                imageId: "img-duplicate",
            }
        )

        expect(transition.isDuplicate).toBe(true)
        expect(transition.shouldDelete).toBe(false)
        expect(transition.updates).toEqual({
            inFlightCount: 1,
        })
    })

    it("records a first successful result and tracks the settled item index", () => {
        const transition = buildRecordBatchItemResultTransition(
            {
                completedCount: 3,
                failedCount: 1,
                imageIds: ["img-1", "img-2", "img-3"],
                inFlightCount: 2,
                settledItemIndexes: [0, 1, 2, 3],
                status: "pending",
                totalCount: 10,
            },
            {
                itemIndex: 4,
                success: true,
                imageId: "img-4",
                retryCount: 2,
            }
        )

        expect(transition.isDuplicate).toBe(false)
        expect(transition.shouldDelete).toBe(false)
        expect(transition.updates).toEqual({
            completedCount: 4,
            currentItemRetryCount: 2,
            imageIds: ["img-1", "img-2", "img-3", "img-4"],
            inFlightCount: 1,
            settledItemIndexes: [0, 1, 2, 3, 4],
            status: "processing",
        })
    })
})
