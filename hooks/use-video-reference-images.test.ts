// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useVideoReferenceImages } from "./use-video-reference-images"

describe("useVideoReferenceImages", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("initialization", () => {
        it("initializes with default empty images", () => {
            const { result } = renderHook(() => useVideoReferenceImages())
            
            expect(result.current.selectedImages).toEqual({
                firstFrame: undefined,
                lastFrame: undefined,
            })
        })

        it("initializes with provided initial images", () => {
            const initialImages = {
                firstFrame: "https://example.com/first.jpg",
                lastFrame: "https://example.com/last.jpg",
            }
            
            const { result } = renderHook(() => 
                useVideoReferenceImages({ initialImages })
            )
            
            expect(result.current.selectedImages).toEqual(initialImages)
        })

        it("initializes browser as closed", () => {
            const { result } = renderHook(() => useVideoReferenceImages())
            
            expect(result.current.isBrowserOpen).toBe(false)
            expect(result.current.browserFrameType).toBeNull()
        })
    })

    describe("frame count", () => {
        it("returns 0 when no frames selected", () => {
            const { result } = renderHook(() => useVideoReferenceImages())
            
            expect(result.current.frameCount).toBe(0)
        })

        it("returns 1 when only first frame selected", () => {
            const { result } = renderHook(() => 
                useVideoReferenceImages({
                    initialImages: { firstFrame: "https://example.com/first.jpg", lastFrame: undefined }
                })
            )
            
            expect(result.current.frameCount).toBe(1)
        })

        it("returns 1 when only last frame selected", () => {
            const { result } = renderHook(() => 
                useVideoReferenceImages({
                    initialImages: { firstFrame: undefined, lastFrame: "https://example.com/last.jpg" }
                })
            )
            
            expect(result.current.frameCount).toBe(1)
        })

        it("returns 2 when both frames selected", () => {
            const { result } = renderHook(() => 
                useVideoReferenceImages({
                    initialImages: { 
                        firstFrame: "https://example.com/first.jpg", 
                        lastFrame: "https://example.com/last.jpg" 
                    }
                })
            )
            
            expect(result.current.frameCount).toBe(2)
        })
    })

    describe("setSelectedImages", () => {
        it("updates selected images", () => {
            const { result } = renderHook(() => useVideoReferenceImages())
            
            act(() => {
                result.current.setSelectedImages({
                    firstFrame: "https://example.com/first.jpg",
                    lastFrame: undefined,
                })
            })
            
            expect(result.current.selectedImages.firstFrame).toBe("https://example.com/first.jpg")
        })

        it("calls onImagesChange callback when provided", () => {
            const onImagesChange = vi.fn()
            const { result } = renderHook(() => 
                useVideoReferenceImages({ onImagesChange })
            )
            
            act(() => {
                result.current.setSelectedImages({
                    firstFrame: "https://example.com/first.jpg",
                    lastFrame: undefined,
                })
            })
            
            expect(onImagesChange).toHaveBeenCalledWith({
                firstFrame: "https://example.com/first.jpg",
                lastFrame: undefined,
            })
        })
    })

    describe("browser modal state", () => {
        it("opens browser with correct frame type", () => {
            const { result } = renderHook(() => useVideoReferenceImages())
            
            act(() => {
                result.current.openBrowser("firstFrame")
            })
            
            expect(result.current.isBrowserOpen).toBe(true)
            expect(result.current.browserFrameType).toBe("firstFrame")
        })

        it("opens browser for last frame", () => {
            const { result } = renderHook(() => useVideoReferenceImages())
            
            act(() => {
                result.current.openBrowser("lastFrame")
            })
            
            expect(result.current.isBrowserOpen).toBe(true)
            expect(result.current.browserFrameType).toBe("lastFrame")
        })

        it("closes browser and resets frame type", () => {
            const { result } = renderHook(() => useVideoReferenceImages())
            
            act(() => {
                result.current.openBrowser("firstFrame")
            })
            
            act(() => {
                result.current.closeBrowser()
            })
            
            expect(result.current.isBrowserOpen).toBe(false)
            expect(result.current.browserFrameType).toBeNull()
        })
    })

    describe("handleBrowserSelect", () => {
        it("selects image for the current browser frame type", () => {
            const onImagesChange = vi.fn()
            const { result } = renderHook(() => 
                useVideoReferenceImages({ onImagesChange })
            )
            
            act(() => {
                result.current.openBrowser("firstFrame")
            })
            
            act(() => {
                result.current.handleBrowserSelect("https://example.com/selected.jpg")
            })
            
            expect(result.current.selectedImages.firstFrame).toBe("https://example.com/selected.jpg")
            expect(result.current.isBrowserOpen).toBe(false)
        })

        it("does nothing if browser frame type is null", () => {
            const onImagesChange = vi.fn()
            const { result } = renderHook(() => 
                useVideoReferenceImages({ onImagesChange })
            )
            
            act(() => {
                result.current.handleBrowserSelect("https://example.com/selected.jpg")
            })
            
            expect(onImagesChange).not.toHaveBeenCalled()
        })

        it("closes browser after selection", () => {
            const { result } = renderHook(() => useVideoReferenceImages())
            
            act(() => {
                result.current.openBrowser("lastFrame")
            })
            
            act(() => {
                result.current.handleBrowserSelect("https://example.com/selected.jpg")
            })
            
            expect(result.current.isBrowserOpen).toBe(false)
            expect(result.current.browserFrameType).toBeNull()
        })
    })

    describe("handleClearFrame", () => {
        it("clears first frame", () => {
            const { result } = renderHook(() => 
                useVideoReferenceImages({
                    initialImages: { 
                        firstFrame: "https://example.com/first.jpg", 
                        lastFrame: "https://example.com/last.jpg" 
                    }
                })
            )
            
            act(() => {
                result.current.handleClearFrame("firstFrame")
            })
            
            expect(result.current.selectedImages.firstFrame).toBeUndefined()
            expect(result.current.selectedImages.lastFrame).toBe("https://example.com/last.jpg")
        })

        it("clears last frame", () => {
            const { result } = renderHook(() => 
                useVideoReferenceImages({
                    initialImages: { 
                        firstFrame: "https://example.com/first.jpg", 
                        lastFrame: "https://example.com/last.jpg" 
                    }
                })
            )
            
            act(() => {
                result.current.handleClearFrame("lastFrame")
            })
            
            expect(result.current.selectedImages.firstFrame).toBe("https://example.com/first.jpg")
            expect(result.current.selectedImages.lastFrame).toBeUndefined()
        })
    })

    describe("handleClearAll", () => {
        it("clears all frames", () => {
            const { result } = renderHook(() => 
                useVideoReferenceImages({
                    initialImages: { 
                        firstFrame: "https://example.com/first.jpg", 
                        lastFrame: "https://example.com/last.jpg" 
                    }
                })
            )
            
            act(() => {
                result.current.handleClearAll()
            })
            
            expect(result.current.selectedImages).toEqual({
                firstFrame: undefined,
                lastFrame: undefined,
            })
        })
    })

    describe("handleSelectForFrame", () => {
        it("selects image for first frame", () => {
            const { result } = renderHook(() => useVideoReferenceImages())
            
            act(() => {
                result.current.handleSelectForFrame("https://example.com/new.jpg", "firstFrame")
            })
            
            expect(result.current.selectedImages.firstFrame).toBe("https://example.com/new.jpg")
        })

        it("selects image for last frame", () => {
            const { result } = renderHook(() => useVideoReferenceImages())
            
            act(() => {
                result.current.handleSelectForFrame("https://example.com/new.jpg", "lastFrame")
            })
            
            expect(result.current.selectedImages.lastFrame).toBe("https://example.com/new.jpg")
        })

        it("preserves other frame when selecting", () => {
            const { result } = renderHook(() => 
                useVideoReferenceImages({
                    initialImages: { firstFrame: "https://example.com/first.jpg", lastFrame: undefined }
                })
            )
            
            act(() => {
                result.current.handleSelectForFrame("https://example.com/last.jpg", "lastFrame")
            })
            
            expect(result.current.selectedImages.firstFrame).toBe("https://example.com/first.jpg")
            expect(result.current.selectedImages.lastFrame).toBe("https://example.com/last.jpg")
        })
    })
})
