/**
 * Tests for retry utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
    calculateBackoffDelay,
    sleep,
    fetchWithRetry,
    DEFAULT_RETRY_CONFIG,
} from "./retry"

describe("retry utilities", () => {
    describe("calculateBackoffDelay", () => {
        it("calculates exponential delay for attempt 0", () => {
            // With no jitter, delay would be baseDelay * 2^0 = 2000
            // With jitter (±25%), range is 1500-2500
            const delay = calculateBackoffDelay(0, 2000, 30000)
            expect(delay).toBeGreaterThanOrEqual(1500)
            expect(delay).toBeLessThanOrEqual(2500)
        })

        it("calculates exponential delay for attempt 1", () => {
            // With no jitter, delay would be baseDelay * 2^1 = 4000
            // With jitter (±25%), range is 3000-5000
            const delay = calculateBackoffDelay(1, 2000, 30000)
            expect(delay).toBeGreaterThanOrEqual(3000)
            expect(delay).toBeLessThanOrEqual(5000)
        })

        it("calculates exponential delay for attempt 2", () => {
            // With no jitter, delay would be baseDelay * 2^2 = 8000
            // With jitter (±25%), range is 6000-10000
            const delay = calculateBackoffDelay(2, 2000, 30000)
            expect(delay).toBeGreaterThanOrEqual(6000)
            expect(delay).toBeLessThanOrEqual(10000)
        })

        it("caps delay at maximum", () => {
            // Attempt 10 would be 2000 * 2^10 = 2048000, but capped at 30000
            const delay = calculateBackoffDelay(10, 2000, 30000)
            expect(delay).toBeLessThanOrEqual(30000)
        })

        it("respects different base delays", () => {
            const delay = calculateBackoffDelay(0, 1000, 30000)
            expect(delay).toBeGreaterThanOrEqual(750)
            expect(delay).toBeLessThanOrEqual(1250)
        })
    })

    describe("sleep", () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it("resolves after specified duration", async () => {
            const promise = sleep(1000)
            vi.advanceTimersByTime(1000)
            await expect(promise).resolves.toBeUndefined()
        })
    })

    describe("fetchWithRetry", () => {
        const mockShouldRetry = vi.fn((status: number) => status >= 500 || status === 429)

        beforeEach(() => {
            vi.clearAllMocks()
            // Use real timers for fetch tests but with short delays
            vi.useRealTimers()
        })

        it("returns success on first attempt when response is ok", async () => {
            const mockResponse = new Response("OK", { status: 200 })
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const result = await fetchWithRetry(
                "https://example.com",
                {},
                mockShouldRetry,
                { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 }
            )

            expect(result.success).toBe(true)
            expect(result.attemptsMade).toBe(1)
            expect(fetch).toHaveBeenCalledTimes(1)
        })

        it("retries on retryable errors", async () => {
            const errorResponse = new Response("Server Error", { status: 500 })
            const successResponse = new Response("OK", { status: 200 })
            
            global.fetch = vi.fn()
                .mockResolvedValueOnce(errorResponse)
                .mockResolvedValueOnce(successResponse)

            const result = await fetchWithRetry(
                "https://example.com",
                {},
                mockShouldRetry,
                { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 }
            )

            expect(result.success).toBe(true)
            expect(result.attemptsMade).toBe(2)
            expect(fetch).toHaveBeenCalledTimes(2)
        })

        it("does not retry on non-retryable errors", async () => {
            const errorResponse = new Response("Bad Request", { status: 400 })
            global.fetch = vi.fn().mockResolvedValue(errorResponse)

            const result = await fetchWithRetry(
                "https://example.com",
                {},
                mockShouldRetry,
                { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 }
            )

            expect(result.success).toBe(false)
            expect(result.attemptsMade).toBe(1)
            expect(result.wasNonRetryable).toBe(true)
            expect(fetch).toHaveBeenCalledTimes(1)
        })

        it("exhausts all retries on persistent errors", async () => {
            const errorResponse = new Response("Server Error", { status: 500 })
            global.fetch = vi.fn().mockResolvedValue(errorResponse)

            const result = await fetchWithRetry(
                "https://example.com",
                {},
                mockShouldRetry,
                { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 }
            )

            expect(result.success).toBe(false)
            expect(result.attemptsMade).toBe(3) // 1 initial + 2 retries
            expect(fetch).toHaveBeenCalledTimes(3)
        })

        it("retries on network errors", async () => {
            const successResponse = new Response("OK", { status: 200 })
            
            global.fetch = vi.fn()
                .mockRejectedValueOnce(new Error("Network error"))
                .mockResolvedValueOnce(successResponse)

            const result = await fetchWithRetry(
                "https://example.com",
                {},
                mockShouldRetry,
                { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 }
            )

            expect(result.success).toBe(true)
            expect(result.attemptsMade).toBe(2)
        })

        it("includes error message in failed result", async () => {
            const errorResponse = new Response("Validation failed: prompt too long", { status: 400 })
            global.fetch = vi.fn().mockResolvedValue(errorResponse)

            const result = await fetchWithRetry(
                "https://example.com",
                {},
                mockShouldRetry,
                { maxRetries: 0, baseDelayMs: 10, maxDelayMs: 100 }
            )

            expect(result.success).toBe(false)
            expect(result.error).toContain("400")
            expect(result.error).toContain("Validation failed")
        })
    })

    describe("DEFAULT_RETRY_CONFIG", () => {
        it("has sensible defaults", () => {
            expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3)
            expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(2000)
            expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(30000)
        })
    })
})
