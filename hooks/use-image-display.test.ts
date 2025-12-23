// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { useImageDisplay } from "./use-image-display"
import type { GeneratedImage } from "@/types/pollinations"

// Create a wrapper with QueryClientProvider for testing
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }
}

describe("useImageDisplay", () => {
    const mockImage: GeneratedImage = {
        id: "1",
        url: "https://example.com/image.jpg",
        prompt: "A beautiful landscape",
        params: {
            prompt: "A beautiful landscape",
            width: 1024,
            height: 1024,
            model: "flux",
            enhance: false,
            quality: "medium",
            private: false,
            nologo: false,
            nofeed: false,
            safe: false,
            transparent: false
        },
        timestamp: Date.now()
    }

    const originalClipboard = navigator.clipboard
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock navigator.clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        })

        // Mock window.URL methods
        window.URL.createObjectURL = vi.fn().mockReturnValue("blob:url")
        window.URL.revokeObjectURL = vi.fn()

        // Mock fetch
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            blob: vi.fn().mockResolvedValue(new Blob()),
        })

        // Mock document.createElement and body.appendChild for download test
        vi.spyOn(document, 'createElement')
    })

    afterEach(() => {
        Object.assign(navigator, { clipboard: originalClipboard })
        global.fetch = originalFetch
        vi.restoreAllMocks()
    })

    it("should initialize with default values", () => {
        const { result } = renderHook(() => useImageDisplay(null), {
            wrapper: createWrapper(),
        })
        expect(result.current.copiedUrl).toBe(null)
        expect(result.current.isImageLoading).toBe(false)
        expect(result.current.isDownloading).toBe(false)
    })

    it("should set isImageLoading to true when currentImage changes", () => {
        const { result, rerender } = renderHook(
            ({ image }) => useImageDisplay(image),
            {
                initialProps: { image: null as GeneratedImage | null },
                wrapper: createWrapper(),
            }
        )

        rerender({ image: mockImage })
        expect(result.current.isImageLoading).toBe(true)
    })

    it("should handle copy url", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useImageDisplay(null), {
            wrapper: createWrapper(),
        })

        await act(async () => {
            await result.current.handleCopyUrl("https://example.com")
        })

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.com")
        expect(result.current.copiedUrl).toBe("https://example.com")

        act(() => {
            vi.advanceTimersByTime(2000)
        })

        expect(result.current.copiedUrl).toBe(null)
        vi.useRealTimers()
    })

    it("should handle download", async () => {
        const { result } = renderHook(() => useImageDisplay(null), {
            wrapper: createWrapper(),
        })

        // Mocking the anchor element
        const mockAnchor = {
            href: '',
            download: '',
            click: vi.fn(),
        } as unknown as HTMLAnchorElement

        vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
        vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor)
        vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor)

        act(() => {
            result.current.handleDownload(mockImage)
        })

        // Wait for the mutation to complete
        await waitFor(() => {
            expect(result.current.isDownloading).toBe(false)
        })

        expect(global.fetch).toHaveBeenCalledWith(mockImage.url)
    })

    it("should allow manual toggle of isImageLoading", () => {
        const { result } = renderHook(() => useImageDisplay(null), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.setIsImageLoading(true)
        })
        expect(result.current.isImageLoading).toBe(true)

        act(() => {
            result.current.setIsImageLoading(false)
        })
        expect(result.current.isImageLoading).toBe(false)
    })
})
