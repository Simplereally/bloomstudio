/**
 * @vitest-environment jsdom
 *
 * Tests for useAuthStatus Hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook } from "@testing-library/react"

// Mock the auth module to control key validation
vi.mock("@/lib/auth", () => ({
    validateApiKeyType: vi.fn((key: string | undefined) => {
        if (!key) return null
        if (key.startsWith("sk_")) return "secret"
        if (key.startsWith("pk_")) return "publishable"
        return null
    }),
    getRateLimitInfo: vi.fn((keyType: string | null) => {
        if (keyType === "secret") {
            return {
                keyType: "secret",
                burst: "unlimited",
                refill: "Unlimited",
                description: "Unlimited requests with secret key",
            }
        }
        if (keyType === "publishable") {
            return {
                keyType: "publishable",
                burst: 3,
                refill: "1 per 15 sec",
                description: "3 burst requests, refills 1 per 15 seconds",
            }
        }
        return {
            keyType: null,
            burst: 1,
            refill: "1 per 30 sec",
            description: "1 request, refills 1 per 30 seconds",
        }
    }),
}))

// Store original env
const originalEnv = { ...process.env }

describe("useAuthStatus", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset environment
        process.env = { ...originalEnv }
        delete process.env.NEXT_PUBLIC_POLLINATIONS_KEY
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it("returns unauthenticated state when no key configured", async () => {
        const { useAuthStatus } = await import("./use-auth-status")
        const { result } = renderHook(() => useAuthStatus())

        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.keyType).toBeNull()
        expect(result.current.rateLimitDescription).toContain("1 request")
    })

    it("returns authenticated state with publishable key", async () => {
        process.env.NEXT_PUBLIC_POLLINATIONS_KEY = "pk_test_key"

        const { useAuthStatus } = await import("./use-auth-status")
        const { result } = renderHook(() => useAuthStatus())

        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.keyType).toBe("publishable")
        expect(result.current.rateLimitInfo.burst).toBe(3)
    })

    it("treats secret key in NEXT_PUBLIC as invalid", async () => {
        // Secret keys should never be in NEXT_PUBLIC vars
        process.env.NEXT_PUBLIC_POLLINATIONS_KEY = "sk_secret_key"

        const { useAuthStatus } = await import("./use-auth-status")
        const { result } = renderHook(() => useAuthStatus())

        // Should treat as unauthenticated since secret keys shouldn't be client-side
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.keyType).toBeNull()
    })

    it("returns rate limit info matching key type", async () => {
        process.env.NEXT_PUBLIC_POLLINATIONS_KEY = "pk_test_key"

        const { useAuthStatus } = await import("./use-auth-status")
        const { result } = renderHook(() => useAuthStatus())

        expect(result.current.rateLimitInfo).toEqual({
            keyType: "publishable",
            burst: 3,
            refill: "1 per 15 sec",
            description: "3 burst requests, refills 1 per 15 seconds",
        })
    })
})
