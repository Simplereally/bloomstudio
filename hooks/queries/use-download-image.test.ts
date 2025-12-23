// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { useDownloadImage } from "./use-download-image"
import { PollinationsApiError, ClientErrorCode } from "@/lib/api"

// Mock the image API module
vi.mock("@/lib/api", () => ({
    downloadImage: vi.fn(),
    PollinationsApiError: class PollinationsApiError extends Error {
        constructor(
            message: string,
            public code?: string,
            public status?: number,
            public details?: Record<string, unknown>
        ) {
            super(message)
            this.name = "PollinationsApiError"
        }
    },
    ClientErrorCode: {
        GENERATION_FAILED: "GENERATION_FAILED",
        VALIDATION_ERROR: "VALIDATION_ERROR",
        NETWORK_ERROR: "NETWORK_ERROR",
        UNKNOWN_ERROR: "UNKNOWN_ERROR",
    },
}))

// Import the mocked function
import { downloadImage } from "@/lib/api"

const mockDownloadImage = downloadImage as unknown as ReturnType<typeof vi.fn>

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

describe("useDownloadImage", () => {
    let mockAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn> }

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock window.URL methods
        window.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/test")
        window.URL.revokeObjectURL = vi.fn()

        // Setup mock anchor for download
        mockAnchor = {
            href: "",
            download: "",
            click: vi.fn(),
        }
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("initializes with default values", () => {
        const { result } = renderHook(() => useDownloadImage(), {
            wrapper: createWrapper(),
        })

        expect(result.current.isDownloading).toBe(false)
        expect(result.current.isSuccess).toBe(false)
        expect(result.current.isError).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it("downloads an image successfully", async () => {
        const mockBlob = new Blob(["test"], { type: "image/jpeg" })
        mockDownloadImage.mockResolvedValueOnce(mockBlob)

        // Store original createElement
        const originalCreateElement = document.createElement.bind(document)

        // Mock after renderHook to avoid interfering with container creation
        const createElementSpy = vi.spyOn(document, "createElement")
        createElementSpy.mockImplementation((tagName: string) => {
            if (tagName === "a") {
                return mockAnchor as unknown as HTMLAnchorElement
            }
            return originalCreateElement(tagName)
        })
        vi.spyOn(document.body, "appendChild").mockImplementation((node) => node)
        vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)

        const onSuccess = vi.fn()
        const { result } = renderHook(
            () => useDownloadImage({ onSuccess }),
            { wrapper: createWrapper() }
        )

        act(() => {
            result.current.download({
                url: "https://example.com/image.jpg",
                filename: "test-image.jpg",
            })
        })

        await waitFor(() => {
            expect(result.current.isDownloading).toBe(false)
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(onSuccess).toHaveBeenCalledWith({
            url: "https://example.com/image.jpg",
            filename: "test-image.jpg",
        })

        createElementSpy.mockRestore()
    })

    it("handles download error with PollinationsApiError type", async () => {
        const error = new PollinationsApiError(
            "Download failed",
            ClientErrorCode.GENERATION_FAILED,
            500
        )
        mockDownloadImage.mockRejectedValueOnce(error)

        const onError = vi.fn()
        const { result } = renderHook(
            () => useDownloadImage({ onError }),
            { wrapper: createWrapper() }
        )

        act(() => {
            result.current.download({
                url: "https://example.com/image.jpg",
                filename: "test-image.jpg",
            })
        })

        await waitFor(() => {
            expect(result.current.isDownloading).toBe(false)
        })

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error).toBeInstanceOf(PollinationsApiError)
        expect(result.current.error?.code).toBe(ClientErrorCode.GENERATION_FAILED)
        expect(onError).toHaveBeenCalled()
    })

    it("triggers browser download with correct filename", async () => {
        const mockBlob = new Blob(["test"], { type: "image/jpeg" })
        mockDownloadImage.mockResolvedValueOnce(mockBlob)

        // Store original createElement
        const originalCreateElement = document.createElement.bind(document)

        const { result } = renderHook(() => useDownloadImage(), {
            wrapper: createWrapper(),
        })

        // Mock after renderHook
        const createElementSpy = vi.spyOn(document, "createElement")
        createElementSpy.mockImplementation((tagName: string) => {
            if (tagName === "a") {
                return mockAnchor as unknown as HTMLAnchorElement
            }
            return originalCreateElement(tagName)
        })
        vi.spyOn(document.body, "appendChild").mockImplementation((node) => node)
        vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)

        act(() => {
            result.current.download({
                url: "https://example.com/image.jpg",
                filename: "my-custom-name.jpg",
            })
        })

        await waitFor(() => {
            expect(result.current.isDownloading).toBe(false)
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(mockAnchor.download).toBe("my-custom-name.jpg")
        expect(mockAnchor.click).toHaveBeenCalled()

        createElementSpy.mockRestore()
    })

    it("cleans up blob URL after download", async () => {
        const mockBlob = new Blob(["test"], { type: "image/jpeg" })
        mockDownloadImage.mockResolvedValueOnce(mockBlob)

        const { result } = renderHook(() => useDownloadImage(), {
            wrapper: createWrapper(),
        })

        // Mock after renderHook
        const createElementSpy = vi.spyOn(document, "createElement")
        const originalCreateElement = document.createElement.bind(document)
        createElementSpy.mockImplementation((tagName: string) => {
            if (tagName === "a") {
                return mockAnchor as unknown as HTMLAnchorElement
            }
            return originalCreateElement(tagName)
        })
        vi.spyOn(document.body, "appendChild").mockImplementation((node) => node)
        vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)

        act(() => {
            result.current.download({
                url: "https://example.com/image.jpg",
                filename: "test-image.jpg",
            })
        })

        await waitFor(() => {
            expect(result.current.isDownloading).toBe(false)
        })

        expect(window.URL.revokeObjectURL).toHaveBeenCalled()
    })
})
