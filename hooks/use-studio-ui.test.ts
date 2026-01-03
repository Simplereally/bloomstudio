// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useStudioUI } from "./use-studio-ui"
import type { GeneratedImage } from "@/types/pollinations"

// Mock useKeyboardShortcuts
vi.mock("@/hooks/use-keyboard-shortcuts", () => ({
    useKeyboardShortcuts: vi.fn(),
}))

describe("useStudioUI", () => {
    const mockImage: GeneratedImage = {
        id: "test-image-1",
        url: "https://example.com/image.jpg",
        prompt: "A beautiful sunset",
        timestamp: Date.now(),
        params: {
            model: "zimage",
            width: 1024,
            height: 1024,
        },
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("initializes with default values", () => {
        const { result } = renderHook(() => useStudioUI())

        expect(result.current.showLeftSidebar).toBe(true)
        expect(result.current.showGallery).toBe(true)
        expect(result.current.isFullscreen).toBe(false)
        expect(result.current.lightboxImage).toBeNull()
    })

    it("toggles left sidebar", () => {
        const { result } = renderHook(() => useStudioUI())

        expect(result.current.showLeftSidebar).toBe(true)

        act(() => {
            result.current.toggleLeftSidebar()
        })

        expect(result.current.showLeftSidebar).toBe(false)

        act(() => {
            result.current.toggleLeftSidebar()
        })

        expect(result.current.showLeftSidebar).toBe(true)
    })

    it("toggles gallery panel", () => {
        const { result } = renderHook(() => useStudioUI())

        expect(result.current.showGallery).toBe(true)

        act(() => {
            result.current.toggleGallery()
        })

        expect(result.current.showGallery).toBe(false)

        act(() => {
            result.current.toggleGallery()
        })

        expect(result.current.showGallery).toBe(true)
    })

    it("sets left sidebar state directly", () => {
        const { result } = renderHook(() => useStudioUI())

        act(() => {
            result.current.setShowLeftSidebar(false)
        })

        expect(result.current.showLeftSidebar).toBe(false)
    })

    it("sets gallery state directly", () => {
        const { result } = renderHook(() => useStudioUI())

        act(() => {
            result.current.setShowGallery(false)
        })

        expect(result.current.showGallery).toBe(false)
    })

    it("opens lightbox with image", () => {
        const { result } = renderHook(() => useStudioUI())

        act(() => {
            result.current.openLightbox(mockImage)
        })

        expect(result.current.isFullscreen).toBe(true)
        expect(result.current.lightboxImage).toEqual(mockImage)
    })

    it("opens lightbox with null image", () => {
        const { result } = renderHook(() => useStudioUI())

        act(() => {
            result.current.openLightbox(null)
        })

        expect(result.current.isFullscreen).toBe(true)
        expect(result.current.lightboxImage).toBeNull()
    })

    it("closes lightbox", () => {
        const { result } = renderHook(() => useStudioUI())

        // First open lightbox
        act(() => {
            result.current.openLightbox(mockImage)
        })

        expect(result.current.isFullscreen).toBe(true)

        // Then close it
        act(() => {
            result.current.closeLightbox()
        })

        expect(result.current.isFullscreen).toBe(false)
    })

    it("sets fullscreen state directly", () => {
        const { result } = renderHook(() => useStudioUI())

        act(() => {
            result.current.setIsFullscreen(true)
        })

        expect(result.current.isFullscreen).toBe(true)
    })

    it("sets lightbox image directly", () => {
        const { result } = renderHook(() => useStudioUI())

        act(() => {
            result.current.setLightboxImage(mockImage)
        })

        expect(result.current.lightboxImage).toEqual(mockImage)
    })

    it("toggle functions have stable references", () => {
        const { result, rerender } = renderHook(() => useStudioUI())

        const toggleLeft1 = result.current.toggleLeftSidebar
        const toggleGallery1 = result.current.toggleGallery
        const openLightbox1 = result.current.openLightbox
        const closeLightbox1 = result.current.closeLightbox

        rerender()

        expect(result.current.toggleLeftSidebar).toBe(toggleLeft1)
        expect(result.current.toggleGallery).toBe(toggleGallery1)
        expect(result.current.openLightbox).toBe(openLightbox1)
        expect(result.current.closeLightbox).toBe(closeLightbox1)
    })
})
