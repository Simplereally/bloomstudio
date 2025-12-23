// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { useStudioClientShell } from "./use-studio-client-shell"

// Mock PollinationsAPI
vi.mock("@/lib/pollinations-api", () => ({
    PollinationsAPI: {
        buildImageUrl: vi.fn(() => "https://pollinations.ai/p/mock-url"),
        generateRandomSeed: vi.fn(() => 12345),
        getHeaders: vi.fn(() => ({})),
    }
}))

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

describe("useStudioClientShell", () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Mock window.URL.createObjectURL and revokeObjectURL
        window.URL.createObjectURL = vi.fn()
        window.URL.revokeObjectURL = vi.fn()

        // Mock fetch
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                blob: () => Promise.resolve(new Blob(["mock content"], { type: "image/jpeg" })),
            })
        ) as unknown as typeof fetch

        // Mock window.open
        window.open = vi.fn()

        // Mock navigator.clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn(),
            },
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("initializes with default values", () => {
        const { result } = renderHook(() => useStudioClientShell(), {
            wrapper: createWrapper(),
        })

        expect(result.current.prompt).toBe("")
        expect(result.current.model).toBe("flux")
        expect(result.current.aspectRatio).toBe("1:1")
        expect(result.current.width).toBe(1024)
        expect(result.current.height).toBe(1024)
        expect(result.current.images).toEqual([])
        expect(result.current.currentImage).toBeNull()
        expect(result.current.isGenerating).toBe(false)
        expect(result.current.isFullscreen).toBe(false)
        expect(result.current.isDownloading).toBe(false)
    })

    it("updates prompt and negative prompt", () => {
        const { result } = renderHook(() => useStudioClientShell(), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.setPrompt("A sunny day")
            result.current.setNegativePrompt("clouds")
        })

        expect(result.current.prompt).toBe("A sunny day")
        expect(result.current.negativePrompt).toBe("clouds")
    })

    it("handles aspect ratio change", () => {
        const { result } = renderHook(() => useStudioClientShell(), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.handleAspectRatioChange("16:9", { width: 1280, height: 720 })
        })

        expect(result.current.aspectRatio).toBe("16:9")
        expect(result.current.width).toBe(1280)
        expect(result.current.height).toBe(720)
    })

    it("handles custom dimension changes", () => {
        const { result } = renderHook(() => useStudioClientShell(), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.handleWidthChange(800)
        })
        expect(result.current.width).toBe(800)
        expect(result.current.aspectRatio).toBe("custom")

        act(() => {
            result.current.handleHeightChange(600)
        })
        expect(result.current.height).toBe(600)
        expect(result.current.aspectRatio).toBe("custom")
    })

    it("generates an image", async () => {
        const { result } = renderHook(() => useStudioClientShell(), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.setPrompt("A beautiful cat")
        })

        act(() => {
            result.current.handleGenerate()
        })

        // Should be generating
        expect(result.current.isGenerating).toBe(true)

        // Wait for mutation to complete
        await waitFor(() => {
            expect(result.current.isGenerating).toBe(false)
        })

        expect(result.current.images.length).toBe(1)
        expect(result.current.images[0].prompt).toBe("A beautiful cat")
        expect(result.current.currentImage).toEqual(result.current.images[0])
        expect(result.current.promptHistory).toContain("A beautiful cat")
    })

    it("removes an image", async () => {
        const { result } = renderHook(() => useStudioClientShell(), {
            wrapper: createWrapper(),
        })

        act(() => {
            result.current.setPrompt("Image 1")
        })

        act(() => {
            result.current.handleGenerate()
        })

        await waitFor(() => {
            expect(result.current.isGenerating).toBe(false)
        })

        const imageId = result.current.images[0].id

        act(() => {
            result.current.handleRemoveImage(imageId)
        })

        expect(result.current.images.length).toBe(0)
        expect(result.current.currentImage).toBeNull()
    })

    it("toggles sidebars", () => {
        const { result } = renderHook(() => useStudioClientShell(), {
            wrapper: createWrapper(),
        })

        expect(result.current.showLeftSidebar).toBe(true)
        act(() => {
            result.current.setShowLeftSidebar(false)
        })
        expect(result.current.showLeftSidebar).toBe(false)

        expect(result.current.showGallery).toBe(true)
        act(() => {
            result.current.setShowGallery(false)
        })
        expect(result.current.showGallery).toBe(false)
    })

    it("toggles fullscreen", () => {
        const { result } = renderHook(() => useStudioClientShell(), {
            wrapper: createWrapper(),
        })

        expect(result.current.isFullscreen).toBe(false)
        act(() => {
            result.current.setIsFullscreen(true)
        })
        expect(result.current.isFullscreen).toBe(true)
        act(() => {
            result.current.setIsFullscreen(false)
        })
        expect(result.current.isFullscreen).toBe(false)
    })
})
