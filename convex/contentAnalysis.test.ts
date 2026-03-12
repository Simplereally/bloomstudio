import { describe, expect, it } from "vitest"
import { getNextAnalysisRunDelayMs, shouldRunRecoveryPromptInference } from "./contentAnalysis"

describe("getNextAnalysisRunDelayMs", () => {
    it("schedules the next analysis run when more work is queued", () => {
        expect(
            getNextAnalysisRunDelayMs({
                queuedImageCount: 2,
                allProvidersRateLimited: false,
            })
        ).toBe(2100)
    })

    it("schedules another run when providers are rate-limited", () => {
        expect(
            getNextAnalysisRunDelayMs({
                queuedImageCount: 2,
                allProvidersRateLimited: true,
            })
        ).toBe(2100)
    })

    it("does not schedule another run when there is no lookahead work", () => {
        expect(
            getNextAnalysisRunDelayMs({
                queuedImageCount: 1,
                allProvidersRateLimited: false,
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
