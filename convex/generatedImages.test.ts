import { describe, expect, it } from "vitest"
import { getLegacyModerationBackfillPatch } from "./generatedImages"

describe("getLegacyModerationBackfillPatch", () => {
    it("normalizes fully legacy moderation rows to indexed pending state", () => {
        expect(
            getLegacyModerationBackfillPatch({
                createdAt: 5_000,
                isSensitive: undefined,
                moderationDispatchStatus: undefined,
                moderationUpdatedAt: undefined,
            })
        ).toEqual({
            isSensitive: null,
            moderationDispatchStatus: "pending",
            moderationUpdatedAt: 5_000,
        })
    })

    it("preserves an existing moderation status while backfilling missing sensitivity", () => {
        expect(
            getLegacyModerationBackfillPatch({
                createdAt: 5_000,
                isSensitive: undefined,
                moderationDispatchStatus: "processing",
                moderationUpdatedAt: undefined,
            })
        ).toEqual({
            isSensitive: null,
            moderationUpdatedAt: 5_000,
        })
    })

    it("adds a pending status for null-sensitivity rows missing moderation state", () => {
        expect(
            getLegacyModerationBackfillPatch({
                createdAt: 5_000,
                isSensitive: null,
                moderationDispatchStatus: undefined,
                moderationUpdatedAt: undefined,
            })
        ).toEqual({
            moderationDispatchStatus: "pending",
            moderationUpdatedAt: 5_000,
        })
    })

    it("leaves already normalized rows untouched", () => {
        expect(
            getLegacyModerationBackfillPatch({
                createdAt: 5_000,
                isSensitive: null,
                moderationDispatchStatus: "pending",
                moderationUpdatedAt: 5_000,
            })
        ).toBeNull()
    })
})
