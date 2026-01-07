/**
 * @vitest-environment node
 *
 * Tests for production key validation security checks
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

/**
 * These tests verify the validation logic that would run
 * in convex-client-provider.tsx for production key checks.
 * 
 * The actual validation is inline in the provider, so we test
 * the logic patterns here.
 */
describe("production key validation", () => {
    const originalEnv = process.env

    beforeEach(() => {
        vi.resetModules()
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    describe("Clerk publishable key validation", () => {
        it("detects test key prefix pk_test_", () => {
            const key = "pk_test_abc123xyz"
            expect(key.startsWith("pk_test_")).toBe(true)
        })

        it("accepts live key prefix pk_live_", () => {
            const key = "pk_live_abc123xyz"
            expect(key.startsWith("pk_test_")).toBe(false)
            expect(key.startsWith("pk_live_")).toBe(true)
        })

        it("handles undefined key gracefully", () => {
            const key: string | undefined = undefined
            expect((key as string | undefined)?.startsWith("pk_test_")).toBeFalsy()
        })

        it("handles empty string key", () => {
            const key = ""
            expect(key.startsWith("pk_test_")).toBe(false)
        })
    })

    describe("Convex URL validation", () => {
        it("detects development instance patterns", () => {
            const devUrl = "https://my-app-dev-abc123.convex.cloud"
            expect(devUrl.includes(".convex.cloud") && devUrl.includes("-dev-")).toBe(true)
        })

        it("accepts production URL patterns", () => {
            const prodUrl = "https://my-app-prod-abc123.convex.cloud"
            expect(prodUrl.includes("-dev-")).toBe(false)
        })

        it("accepts URLs without dev indicator", () => {
            const url = "https://my-app-abc123.convex.cloud"
            expect(url.includes("-dev-")).toBe(false)
        })
    })

    describe("validation logic with Vercel environment detection", () => {
        /**
         * Simulates the validation logic from convex-client-provider.tsx
         */
        function validateProductionKeys(options: {
            nodeEnv: string
            vercelEnv?: string
            clerkKey?: string
            convexUrl?: string
        }): { errors: string[]; warnings: string[] } {
            const errors: string[] = []
            const warnings: string[] = []
            const { nodeEnv, vercelEnv, clerkKey, convexUrl } = options

            const IS_VERCEL_PRODUCTION = vercelEnv === "production"
            const IS_NODE_PRODUCTION = nodeEnv === "production"

            if (IS_VERCEL_PRODUCTION) {
                // Strict validation for Vercel production
                if (clerkKey?.startsWith("pk_test_")) {
                    errors.push(
                        "[Security Error] Test Clerk publishable key detected in production deployment."
                    )
                }

                if (convexUrl?.includes(".convex.cloud") && convexUrl.includes("-dev-")) {
                    warnings.push(
                        "[Security Warning] Convex URL appears to be a development instance."
                    )
                }
            } else if (IS_NODE_PRODUCTION && !vercelEnv) {
                // Local production build - warning only
                if (clerkKey?.startsWith("pk_test_")) {
                    warnings.push(
                        "[Security Warning] Test Clerk publishable key detected in production build."
                    )
                }
            }

            return { errors, warnings }
        }

        it("throws error for test Clerk key in Vercel production", () => {
            const result = validateProductionKeys({
                nodeEnv: "production",
                vercelEnv: "production",
                clerkKey: "pk_test_abc123",
                convexUrl: "https://my-app.convex.cloud",
            })

            expect(result.errors).toHaveLength(1)
            expect(result.errors[0]).toContain("Security Error")
            expect(result.warnings).toHaveLength(0)
        })

        it("warns for dev Convex URL in Vercel production", () => {
            const result = validateProductionKeys({
                nodeEnv: "production",
                vercelEnv: "production",
                clerkKey: "pk_live_abc123",
                convexUrl: "https://my-app-dev-abc123.convex.cloud",
            })

            expect(result.errors).toHaveLength(0)
            expect(result.warnings).toHaveLength(1)
            expect(result.warnings[0]).toContain("Security Warning")
        })

        it("passes validation with valid production keys in Vercel production", () => {
            const result = validateProductionKeys({
                nodeEnv: "production",
                vercelEnv: "production",
                clerkKey: "pk_live_abc123",
                convexUrl: "https://my-app-prod-abc123.convex.cloud",
            })

            expect(result.errors).toHaveLength(0)
            expect(result.warnings).toHaveLength(0)
        })

        it("allows test keys in Vercel preview environment", () => {
            const result = validateProductionKeys({
                nodeEnv: "production",
                vercelEnv: "preview",
                clerkKey: "pk_test_abc123",
                convexUrl: "https://my-app-dev-abc123.convex.cloud",
            })

            // Preview mode should not block or warn
            expect(result.errors).toHaveLength(0)
            expect(result.warnings).toHaveLength(0)
        })

        it("issues warning for test keys in local production build", () => {
            const result = validateProductionKeys({
                nodeEnv: "production",
                vercelEnv: undefined, // No VERCEL_ENV = local build
                clerkKey: "pk_test_abc123",
                convexUrl: "https://my-app.convex.cloud",
            })

            // Should warn but not error for local builds
            expect(result.errors).toHaveLength(0)
            expect(result.warnings).toHaveLength(1)
            expect(result.warnings[0]).toContain("Security Warning")
        })

        it("skips validation in development mode", () => {
            const result = validateProductionKeys({
                nodeEnv: "development",
                clerkKey: "pk_test_abc123",
                convexUrl: "https://my-app-dev-abc123.convex.cloud",
            })

            expect(result.errors).toHaveLength(0)
            expect(result.warnings).toHaveLength(0)
        })

        it("handles missing keys in Vercel production", () => {
            const result = validateProductionKeys({
                nodeEnv: "production",
                vercelEnv: "production",
                clerkKey: undefined,
                convexUrl: undefined,
            })

            expect(result.errors).toHaveLength(0)
            expect(result.warnings).toHaveLength(0)
        })
    })
})
