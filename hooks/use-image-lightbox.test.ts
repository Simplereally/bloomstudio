import { renderHook, act } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { useImageLightbox, type LightboxImage } from "./use-image-lightbox"
import * as React from "react"

describe("useImageLightbox", () => {
    const mockImage: LightboxImage = {
        url: "https://example.com/image.jpg",
        prompt: "A beautiful sunset",
        width: 1024,
        height: 1024,
    }

    const mockVideo: LightboxImage = {
        url: "https://example.com/video.mp4",
        prompt: "A cool animation",
        contentType: "video/mp4",
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // Mock window.navigator.clipboard.writeText
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        })
    })

    it("initializes with default values", () => {
        const { result } = renderHook(() => useImageLightbox({ image: mockImage, isOpen: true }))

        expect(result.current.isZoomed).toBe(false)
        expect(result.current.copied).toBe(false)
        expect(result.current.isDragging).toBe(false)
    })

    it("handles image load and calculates zoom ability", () => {
        const { result } = renderHook(() => useImageLightbox({ image: mockImage, isOpen: true }))

        const mockEvent = {
            currentTarget: {
                naturalWidth: 2000,
                naturalHeight: 2000,
                clientWidth: 1000,
                clientHeight: 1000,
            }
        } as unknown as React.SyntheticEvent<HTMLImageElement>

        act(() => {
            result.current.handleImageLoad(mockEvent)
        })

        expect(result.current.naturalSize).toEqual({ width: 2000, height: 2000 })
        expect(result.current.canZoom).toBe(true)
    })

    it("prevents zoom for video content", () => {
        const { result } = renderHook(() => useImageLightbox({ image: mockVideo, isOpen: true }))

        // Videos use videoWidth/videoHeight but the hook currently expects naturalWidth (image properties)
        const mockVideoEvent = {
            currentTarget: {
                naturalWidth: 1920,
                naturalHeight: 1080,
                clientWidth: 1000,
                clientHeight: 562,
            }
        } as unknown as React.SyntheticEvent<HTMLImageElement>

        act(() => {
            result.current.handleImageLoad(mockVideoEvent)
        })

        const mockMouseEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent
        act(() => {
            result.current.toggleZoom(mockMouseEvent)
        })
        expect(result.current.isZoomed).toBe(false)
    })

    it("handles copying prompt", async () => {
        const { result } = renderHook(() => useImageLightbox({ image: mockImage, isOpen: true }))

        const mockMouseEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent
        await act(async () => {
            await result.current.handleCopyPrompt(mockMouseEvent)
        })

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockImage.prompt)
        expect(result.current.copied).toBe(true)
    })

    it("resets state when image changes", () => {
        const { result, rerender } = renderHook(
            ({ image, isOpen }) => useImageLightbox({ image, isOpen }),
            {
                initialProps: { image: mockImage, isOpen: true }
            }
        )

        const mockEvent = {
            currentTarget: {
                naturalWidth: 2000,
                naturalHeight: 2000,
                clientWidth: 1000,
                clientHeight: 1000,
            }
        } as unknown as React.SyntheticEvent<HTMLImageElement>

        act(() => {
            result.current.handleImageLoad(mockEvent)
        })

        const mockMouseEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent
        act(() => {
            result.current.toggleZoom(mockMouseEvent)
        })
        expect(result.current.isZoomed).toBe(true)

        rerender({ image: { ...mockImage, url: "new-url.jpg" }, isOpen: true })
        expect(result.current.isZoomed).toBe(false)
    })
})
