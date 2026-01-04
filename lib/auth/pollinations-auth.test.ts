/**
 * @vitest-environment node
 *
 * Tests for Pollinations Authentication Utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest"
import {
    validateApiKeyType,
    getPollinationsAuth,
    getRateLimitInfo,
    getAuthorizationHeader,
    hasPublishableKey,
} from "./pollinations-auth"

// Mock the api.config module
vi.mock("@/lib/config/api.config", () => ({
    getApiKey: vi.fn(),
}))

import { getApiKey } from "@/lib/config/api.config"

const mockedGetApiKey = getApiKey as Mock

describe("pollinations-auth", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset environment variables
        delete process.env.NEXT_PUBLIC_POLLINATIONS_KEY
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("validateApiKeyType", () => {
        it("returns 'secret' for sk_ prefixed keys", () => {
            expect(validateApiKeyType("sk_test_key_123")).toBe("secret")
            expect(validateApiKeyType("sk_")).toBe("secret")
        })

        it("returns 'publishable' for pk_ prefixed keys", () => {
            expect(validateApiKeyType("pk_test_key_123")).toBe("publishable")
            expect(validateApiKeyType("pk_")).toBe("publishable")
        })

        it("returns null for invalid keys", () => {
            expect(validateApiKeyType("invalid_key")).toBeNull()
            expect(validateApiKeyType("")).toBeNull()
            expect(validateApiKeyType(undefined)).toBeNull()
            expect(validateApiKeyType("  ")).toBeNull()
        })

        it("trims whitespace before validation", () => {
            expect(validateApiKeyType("  sk_test  ")).toBe("secret")
            expect(validateApiKeyType("  pk_test  ")).toBe("publishable")
        })
    })

    describe("getPollinationsAuth", () => {
        it("returns authenticated state with secret key", () => {
            mockedGetApiKey.mockReturnValue("sk_test_key")

            const auth = getPollinationsAuth()

            expect(auth.isAuthenticated).toBe(true)
            expect(auth.keyType).toBe("secret")
            expect(auth.key).toBe("sk_test_key")
        })

        it("returns authenticated state with publishable key", () => {
            mockedGetApiKey.mockReturnValue("pk_test_key")

            const auth = getPollinationsAuth()

            expect(auth.isAuthenticated).toBe(true)
            expect(auth.keyType).toBe("publishable")
            expect(auth.key).toBe("pk_test_key")
        })

        it("returns unauthenticated state when no key", () => {
            mockedGetApiKey.mockReturnValue(undefined)

            const auth = getPollinationsAuth()

            expect(auth.isAuthenticated).toBe(false)
            expect(auth.keyType).toBeNull()
            expect(auth.key).toBeUndefined()
        })

        it("returns unauthenticated state with invalid key", () => {
            mockedGetApiKey.mockReturnValue("invalid_key")

            const auth = getPollinationsAuth()

            expect(auth.isAuthenticated).toBe(false)
            expect(auth.keyType).toBeNull()
        })
    })

    describe("getRateLimitInfo", () => {
        it("returns unlimited for secret keys", () => {
            const info = getRateLimitInfo("secret")

            expect(info.keyType).toBe("secret")
            expect(info.burst).toBe("unlimited")
            expect(info.description).toContain("Unlimited")
        })

        it("returns limited for publishable keys", () => {
            const info = getRateLimitInfo("publishable")

            expect(info.keyType).toBe("publishable")
            expect(info.burst).toBe(3)
            expect(info.refill).toContain("15")
        })

        it("returns most limited for anonymous", () => {
            const info = getRateLimitInfo(null)

            expect(info.keyType).toBeNull()
            expect(info.burst).toBe(1)
            expect(info.refill).toContain("30")
        })
    })

    describe("getAuthorizationHeader", () => {
        it("returns Bearer token with provided key", () => {
            const header = getAuthorizationHeader("sk_test_key")

            expect(header).toBe("Bearer sk_test_key")
        })

        it("returns Bearer token from getApiKey when no key provided", () => {
            mockedGetApiKey.mockReturnValue("pk_from_config")

            const header = getAuthorizationHeader()

            expect(header).toBe("Bearer pk_from_config")
        })

        it("returns undefined when no key available", () => {
            mockedGetApiKey.mockReturnValue(undefined)

            const header = getAuthorizationHeader()

            expect(header).toBeUndefined()
        })
    })

    describe("hasPublishableKey", () => {
        it("returns true when publishable key is in environment", () => {
            process.env.NEXT_PUBLIC_POLLINATIONS_KEY = "pk_test_public"

            expect(hasPublishableKey()).toBe(true)
        })

        it("returns false when no publishable key", () => {
            expect(hasPublishableKey()).toBe(false)
        })

        it("returns false when key has wrong prefix", () => {
            process.env.NEXT_PUBLIC_POLLINATIONS_KEY = "sk_wrong_prefix"

            expect(hasPublishableKey()).toBe(false)
        })
    })
})
