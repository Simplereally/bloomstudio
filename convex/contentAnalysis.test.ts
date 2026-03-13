import { describe, expect, it } from "vitest"
import {
    getNextAnalysisRunDelayMs,
    getProviderRecoveryDelayMs,
    shouldSkipAnalyzeRecentImagesSchedule,
    getVisionFailureDispatchStatus,
    shouldRunRecoveryPromptInference,
    getEffectiveScheduledBackgroundJob,
    getLatestBackgroundJobLastRunAt,
} from "./contentAnalysis"

describe("getNextAnalysisRunDelayMs", () => {
    it("schedules the next analysis run when more work is queued", () => {
        expect(
            getNextAnalysisRunDelayMs({
                queuedImageCount: 2,
                providerRecoveryDelayMs: null,
            })
        ).toBe(2100)
    })

    it("schedules another run when providers have a recovery delay", () => {
        expect(
            getNextAnalysisRunDelayMs({
                queuedImageCount: 2,
                providerRecoveryDelayMs: 60_000,
            })
        ).toBe(60_000)
    })

    it("does not schedule another run when there is no lookahead work", () => {
        expect(
            getNextAnalysisRunDelayMs({
                queuedImageCount: 1,
                providerRecoveryDelayMs: null,
            })
        ).toBeNull()
    })
})

describe("getProviderRecoveryDelayMs", () => {
    it("waits until the earliest provider reset instead of hot-looping", () => {
        expect(
            getProviderRecoveryDelayMs({
                now: 1_000,
                providerHealths: [
                    { isAvailable: false, rateLimitedUntil: 11_000 },
                    { isAvailable: false, rateLimitedUntil: 21_000 },
                ],
            })
        ).toBe(10_000)
    })

    it("returns the floor delay when reset is too close", () => {
        expect(
            getProviderRecoveryDelayMs({
                now: 1_000,
                providerHealths: [
                    { isAvailable: false, rateLimitedUntil: 1_500 },
                ],
            })
        ).toBe(2100)
    })

    it("returns null when a provider is already available", () => {
        expect(
            getProviderRecoveryDelayMs({
                now: 1_000,
                providerHealths: [
                    { isAvailable: true },
                    null,
                ],
            })
        ).toBeNull()
    })
})

describe("shouldSkipAnalyzeRecentImagesSchedule", () => {
    it("keeps an already-scheduled claimable run instead of replacing it", () => {
        expect(
            shouldSkipAnalyzeRecentImagesSchedule({
                now: 10_000,
                existingNextRunAt: 9_500,
                requestedNextRunAt: 12_000,
            })
        ).toBe(true)
    })

    it("re-schedules when the existing run is stale in the past", () => {
        expect(
            shouldSkipAnalyzeRecentImagesSchedule({
                now: 10_000,
                existingNextRunAt: 8_500,
                requestedNextRunAt: 12_000,
            })
        ).toBe(false)
    })

    it("re-schedules when the new request is earlier than the existing run", () => {
        expect(
            shouldSkipAnalyzeRecentImagesSchedule({
                now: 10_000,
                existingNextRunAt: 11_000,
                requestedNextRunAt: 10_500,
            })
        ).toBe(false)
    })
})

describe("getEffectiveScheduledBackgroundJob", () => {
    it("prefers the earliest scheduled run when duplicate job rows exist", () => {
        expect(
            getEffectiveScheduledBackgroundJob([
                {
                    _creationTime: 200,
                    updatedAt: 2_000,
                    nextRunAt: 8_000,
                    scheduledToken: "later",
                },
                {
                    _creationTime: 100,
                    updatedAt: 1_000,
                    nextRunAt: 6_000,
                    scheduledToken: "earlier",
                },
            ])
        ).toMatchObject({
            nextRunAt: 6_000,
            scheduledToken: "earlier",
        })
    })

    it("breaks same-time schedule ties by the most recent row", () => {
        expect(
            getEffectiveScheduledBackgroundJob([
                {
                    _creationTime: 100,
                    updatedAt: 1_000,
                    nextRunAt: 6_000,
                    scheduledToken: "older",
                },
                {
                    _creationTime: 200,
                    updatedAt: 2_000,
                    nextRunAt: 6_000,
                    scheduledToken: "newer",
                },
            ])
        ).toMatchObject({
            nextRunAt: 6_000,
            scheduledToken: "newer",
        })
    })
})

describe("getLatestBackgroundJobLastRunAt", () => {
    it("keeps the latest completion timestamp while reconciling duplicates", () => {
        expect(
            getLatestBackgroundJobLastRunAt([
                { lastRunAt: 2_000 },
                {},
                { lastRunAt: 5_000 },
            ])
        ).toBe(5_000)
    })
})

describe("shouldRunRecoveryPromptInference", () => {
    it("runs prompt inference when a prompt exists and no inference was stored", () => {
        expect(
            shouldRunRecoveryPromptInference({
                hasPrompt: true,
                hasPromptInference: false,
            })
        ).toBe(true)
    })

    it("skips duplicate prompt inference when recovery state shows it already ran", () => {
        expect(
            shouldRunRecoveryPromptInference({
                hasPrompt: true,
                hasPromptInference: true,
            })
        ).toBe(false)
    })

    it("skips prompt inference when there is no prompt", () => {
        expect(
            shouldRunRecoveryPromptInference({
                hasPrompt: false,
                hasPromptInference: false,
            })
        ).toBe(false)
    })
})

describe("getVisionFailureDispatchStatus", () => {
    it("keeps rate-limited images pending so cron can retry later", () => {
        expect(
            getVisionFailureDispatchStatus({
                rateLimited: true,
            })
        ).toBe("pending")
    })

    it("marks non-rate-limited vision failures as failed to stop infinite recovery loops", () => {
        expect(
            getVisionFailureDispatchStatus({
                rateLimited: false,
            })
        ).toBe("failed")
    })
})
