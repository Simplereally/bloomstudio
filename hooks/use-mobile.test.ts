/**
 * @vitest-environment jsdom
 *
 * Tests for useIsMobile Hook
 */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useIsMobile } from "./use-mobile"

describe("useIsMobile", () => {
    let addEventListenerSpy: Mock
    let removeEventListenerSpy: Mock

    beforeEach(() => {
        addEventListenerSpy = vi.fn()
        removeEventListenerSpy = vi.fn()

        // Mock matchMedia
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            configurable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(), // Deprecated
                removeListener: vi.fn(), // Deprecated
                addEventListener: addEventListenerSpy,
                removeEventListener: removeEventListenerSpy,
                dispatchEvent: vi.fn(),
            })),
        })

        // Mock innerWidth
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: 1024,
        })
    })

    it("should return false for desktop widths initially", () => {
        // @ts-expect-error - innerWidth is read-only but we mocked it to be writable
        window.innerWidth = 1024
        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(false)
    })

    it("should return true for mobile widths initially", () => {
        // @ts-expect-error - innerWidth is read-only but we mocked it to be writable
        window.innerWidth = 375
        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(true)
    })

    it("should update when the media query triggers a change", () => {
        // @ts-expect-error - innerWidth is read-only but we mocked it to be writable
        window.innerWidth = 1024
        const { result } = renderHook(() => useIsMobile())
        expect(result.current).toBe(false)

        // The hook registers a 'change' listener on the mql object
        const changeCall = addEventListenerSpy.mock.calls.find(
            (call: unknown[]) => (call as [string, EventListener])[0] === "change"
        )
        const onChangeCallback = changeCall?.[1] as (() => void) | undefined

        if (!onChangeCallback) {
            throw new Error("onChangeCallback not found")
        }

        act(() => {
            // @ts-expect-error - innerWidth is read-only but we mocked it to be writable
            window.innerWidth = 375
            onChangeCallback()
        })

        expect(result.current).toBe(true)

        act(() => {
            // @ts-expect-error - innerWidth is read-only but we mocked it to be writable
            window.innerWidth = 1024
            onChangeCallback()
        })

        expect(result.current).toBe(false)
    })

    it("should cleanup event listener on unmount", () => {
        const { unmount } = renderHook(() => useIsMobile())
        unmount()
        expect(removeEventListenerSpy).toHaveBeenCalledWith("change", expect.any(Function))
    })
})

