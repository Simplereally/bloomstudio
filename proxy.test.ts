/**
 * @vitest-environment node
 *
 * Tests for Proxy route protection configuration
 * 
 * Note: These tests validate the route matching logic, using the actual
 * matcher exported from proxy.ts.
 */
import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { config, isProtectedRoute } from "./proxy"

/**
 * Helper to wrap pathname in a NextRequest for Clerk's matcher
 */
function createRequest(pathname: string) {
    return new NextRequest(`https://pixelstream.app${pathname}`)
}

describe("proxy route protection", () => {
    describe("protected routes", () => {
        it("protects /studio root path", () => {
            expect(isProtectedRoute(createRequest("/studio"))).toBe(true)
        })

        it("protects /studio child paths", () => {
            expect(isProtectedRoute(createRequest("/studio/something"))).toBe(true)
            expect(isProtectedRoute(createRequest("/studio/deeply/nested/path"))).toBe(true)
        })

        it("protects /settings root path", () => {
            expect(isProtectedRoute(createRequest("/settings"))).toBe(true)
        })

        it("protects /settings child paths", () => {
            expect(isProtectedRoute(createRequest("/settings/profile"))).toBe(true)
            expect(isProtectedRoute(createRequest("/settings/billing"))).toBe(true)
        })

        it("protects /history paths", () => {
            expect(isProtectedRoute(createRequest("/history"))).toBe(true)
            expect(isProtectedRoute(createRequest("/history/page/2"))).toBe(true)
        })

        it("protects /favorites paths", () => {
            expect(isProtectedRoute(createRequest("/favorites"))).toBe(true)
            expect(isProtectedRoute(createRequest("/favorites/collection"))).toBe(true)
        })

        it("protects /api/upload paths", () => {
            expect(isProtectedRoute(createRequest("/api/upload"))).toBe(true)
            expect(isProtectedRoute(createRequest("/api/upload/image"))).toBe(true)
        })

        it("protects /api/images/delete paths", () => {
            expect(isProtectedRoute(createRequest("/api/images/delete"))).toBe(true)
            expect(isProtectedRoute(createRequest("/api/images/delete/123"))).toBe(true)
        })
    })

    describe("public routes", () => {
        it("allows home page", () => {
            expect(isProtectedRoute(createRequest("/"))).toBe(false)
        })

        it("allows pricing page", () => {
            expect(isProtectedRoute(createRequest("/pricing"))).toBe(false)
        })

        it("allows feed page", () => {
            expect(isProtectedRoute(createRequest("/feed"))).toBe(false)
        })

        it("allows sign-in routes", () => {
            expect(isProtectedRoute(createRequest("/sign-in"))).toBe(false)
            expect(isProtectedRoute(createRequest("/sign-up"))).toBe(false)
        })

        it("allows public API routes", () => {
            expect(isProtectedRoute(createRequest("/api/enhance-prompt"))).toBe(false)
            expect(isProtectedRoute(createRequest("/api/suggestions"))).toBe(false)
        })
    })
})

describe("proxy matcher configuration", () => {
    /**
     * Check if a path should be processed by the middleware based on config.matcher.
     * We use a robust regex construction that accurately reflects Next.js behavior
     * by anchoring the patterns.
     */
    function shouldProcessPath(pathname: string): boolean {
        return config.matcher.some(pattern => {
            const regex = new RegExp(`^${pattern}$`)
            return regex.test(pathname)
        })
    }

    it("processes regular page routes", () => {
        expect(shouldProcessPath("/")).toBe(true)
        expect(shouldProcessPath("/studio")).toBe(true)
        expect(shouldProcessPath("/settings")).toBe(true)
        expect(shouldProcessPath("/pricing")).toBe(true)
    })

    it("processes API and TRPC routes", () => {
        expect(shouldProcessPath("/api/upload")).toBe(true)
        expect(shouldProcessPath("/api/enhance-prompt")).toBe(true)
        expect(shouldProcessPath("/trpc/someEndpoint")).toBe(true)
    })

    it("skips Next.js internal routes", () => {
        expect(shouldProcessPath("/_next")).toBe(false)
        expect(shouldProcessPath("/_next/static/chunks/main.js")).toBe(false)
        expect(shouldProcessPath("/_next/data/development/index.json")).toBe(false)
    })

    it("skips static assets with common extensions", () => {
        expect(shouldProcessPath("/favicon.ico")).toBe(false)
        expect(shouldProcessPath("/styles.css")).toBe(false)
        expect(shouldProcessPath("/script.js")).toBe(false)
        expect(shouldProcessPath("/image.png")).toBe(false)
        expect(shouldProcessPath("/photo.jpg")).toBe(false)
        expect(shouldProcessPath("/icon.svg")).toBe(false)
        expect(shouldProcessPath("/font.woff2")).toBe(false)
    })

    it("processes files that look like static but aren't in the exclusion list", () => {
        // .json is NOT in the exclusion list (it was excluded from the js negative lookahead)
        expect(shouldProcessPath("/api/data.json")).toBe(true)
        // .txt is NOT in the exclusion list
        expect(shouldProcessPath("/robots.txt")).toBe(true)
    })
})
