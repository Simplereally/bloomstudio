
import { describe, expect, it, vi } from "vitest"

// Mock server-only
vi.mock("server-only", () => ({}))

import { CACHE_TAGS, CACHE_TTL, PAGE_SIZES } from "./config"

describe("cache config", () => {
    describe("CACHE_TTL", () => {
        it("defines TTLs for feed pages", () => {
            expect(CACHE_TTL.FEED_PUBLIC_FIRST_PAGE).toBe(60)
            expect(CACHE_TTL.FEED_PUBLIC_LATER_PAGES).toBe(21600) // 6 hours
        })

        it("defines TTLs for history pages", () => {
            expect(CACHE_TTL.HISTORY_FIRST_PAGE).toBe(30)
            expect(CACHE_TTL.HISTORY_LATER_PAGES).toBe(43200) // 12 hours
        })
    })

    describe("CACHE_TAGS", () => {
        it("defines static tags", () => {
            expect(CACHE_TAGS.FEED_PUBLIC).toBe("feed:public")
        })

        it("generates correct user tags", () => {
            expect(CACHE_TAGS.HISTORY_USER("123")).toBe("history:user:123")
            expect(CACHE_TAGS.FAVORITES_USER("123")).toBe("favorites:user:123")
            expect(CACHE_TAGS.FEED_FOLLOWING_USER("123")).toBe("feed:following:123")
        })
    })

    describe("PAGE_SIZES", () => {
        it("defines consistent page sizes", () => {
            expect(PAGE_SIZES.DEFAULT).toBe(20)
            expect(PAGE_SIZES.STUDIO_GALLERY).toBe(20)
            expect(PAGE_SIZES.HISTORY).toBe(20)
            expect(PAGE_SIZES.FAVORITES).toBe(20)
            expect(PAGE_SIZES.FEED).toBe(20)
        })
    })
})
