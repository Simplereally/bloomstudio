import { describe, expect, it } from "vitest"
import {
    getNextAnalysisRunDelayMs,
    getProviderRecoveryDelayMs,
    getVisionFailureDispatchStatus,
    shouldRunRecoveryPromptInference,
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
