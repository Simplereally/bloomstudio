/**
 * @vitest-environment jsdom
 *
 * Tests for useSubscriptionStatus Hook
 */
import { renderHook, act } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useSubscriptionStatus } from "./use-subscription-status"
import { useQuery } from "convex/react"

// useQuery is already mocked in vitest.setup.ts, but we'll re-mock it here for clarity if needed
// or just use the global mock. The global mock is vi.fn() so we can use vi.mocked(useQuery)

describe("useSubscriptionStatus", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("returns loading state when query is undefined", () => {
        vi.mocked(useQuery).mockReturnValue(undefined)

        const { result } = renderHook(() => useSubscriptionStatus())

        expect(result.current.isLoading).toBe(true)
        expect(result.current.status).toBeUndefined()
        expect(result.current.canGenerate).toBe(false)
    })

    it("returns pro status correctly", () => {
        vi.mocked(useQuery).mockReturnValue({ status: "pro" })

        const { result } = renderHook(() => useSubscriptionStatus())

        expect(result.current.status).toBe("pro")
        expect(result.current.isLoading).toBe(false)
        expect(result.current.canGenerate).toBe(true)
        expect(result.current.timeLeft).toBeUndefined()
    })

    it("handles trial status with timer", () => {
        const now = Date.now()
        const trialExpiresAt = now + 2 * 60 * 60 * 1000 // 2 hours from now

        vi.mocked(useQuery).mockReturnValue({
            status: "trial",
            trialExpiresAt
        })

        const { result } = renderHook(() => useSubscriptionStatus())

        expect(result.current.status).toBe("trial")
        expect(result.current.timeLeft).toBe("2h 0m")

        // Advance time by 1 minute
        act(() => {
            vi.advanceTimersByTime(60000)
        })

        // Timer should update
        expect(result.current.timeLeft).toBe("1h 59m")
    })

    it("handles trial expiry during session", () => {
        const now = Date.now()
        const trialExpiresAt = now + 1000 // 1 second from now

        vi.mocked(useQuery).mockReturnValue({
            status: "trial",
            trialExpiresAt
        })

        const { result } = renderHook(() => useSubscriptionStatus())

        expect(result.current.timeLeft).not.toBe("Expired")

        // Advance time to expiry
        act(() => {
            vi.advanceTimersByTime(60000)
        })

        expect(result.current.timeLeft).toBe("Expired")
    })

    it("returns expired status correctly", () => {
        vi.mocked(useQuery).mockReturnValue({ status: "expired" })

        const { result } = renderHook(() => useSubscriptionStatus())

        expect(result.current.status).toBe("expired")
        expect(result.current.canGenerate).toBe(false)
    })
})
