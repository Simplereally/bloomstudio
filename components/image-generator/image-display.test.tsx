import { useImageDisplay } from "@/hooks/use-image-display"
import type { GeneratedImage } from "@/types/pollinations"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ImageDisplay } from "./image-display"

// Mock the hook
vi.mock("@/hooks/use-image-display", () => ({
    useImageDisplay: vi.fn(),
}))

describe("ImageDisplay", () => {
    const mockImage: GeneratedImage = {
        id: "1",
        url: "https://example.com/image.jpg",
        prompt: "A beautiful landscape",
        params: {
            prompt: "A beautiful landscape",
            width: 1024,
            height: 1024,
            model: "flux",
            seed: 123,
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

    const defaultProps = {
        images: [],
        currentImage: null,
        onRemove: vi.fn(),
        onSelect: vi.fn(),
        isGenerating: false,
    }

    const mockHookReturn = {
        copiedUrl: null,
        isImageLoading: false,
        isDownloading: false,
        setIsImageLoading: vi.fn(),
        handleDownload: vi.fn(),
        handleCopyUrl: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useImageDisplay).mockReturnValue(mockHookReturn)
    })

    it("renders empty state when no image is selected", () => {
        render(<ImageDisplay {...defaultProps} />)
        expect(screen.getByTestId("empty-state")).toBeInTheDocument()
        expect(screen.getByText("No image generated yet")).toBeInTheDocument()
    })

    it("renders loading state when isGenerating is true", () => {
        render(<ImageDisplay {...defaultProps} isGenerating={true} />)
        expect(screen.getByTestId("loading-state")).toBeInTheDocument()
        expect(screen.getByText("Creating Magic")).toBeInTheDocument()
    })

    it("renders loading state when hook says image is loading", () => {
        vi.mocked(useImageDisplay).mockReturnValue({
            ...mockHookReturn,
            isImageLoading: true,
        })
        render(<ImageDisplay {...defaultProps} currentImage={mockImage} />)
        expect(screen.getByTestId("loading-state")).toBeInTheDocument()
    })

    it("renders the current image when provided and not loading", () => {
        render(<ImageDisplay {...defaultProps} currentImage={mockImage} />)
        const img = screen.getByTestId("generated-image")
        expect(img).toBeInTheDocument()
        // In next/image mocked environment, src might be different but should contain the url
        expect(img).toHaveAttribute("src")
        expect(screen.getByTestId("image-info")).toBeInTheDocument()
        expect(screen.getByText(mockImage.prompt)).toBeInTheDocument()
    })

    it("calls handleDownload when download button is clicked", async () => {
        const handleDownload = vi.fn()
        vi.mocked(useImageDisplay).mockReturnValue({
            ...mockHookReturn,
            handleDownload,
        })
        render(<ImageDisplay {...defaultProps} currentImage={mockImage} />)

        const downloadButton = screen.getByTestId("download-button")
        await userEvent.click(downloadButton)

        expect(handleDownload).toHaveBeenCalledWith(mockImage)
    })

    it("calls handleCopyUrl when copy button is clicked", async () => {
        const handleCopyUrl = vi.fn()
        vi.mocked(useImageDisplay).mockReturnValue({
            ...mockHookReturn,
            handleCopyUrl,
        })
        render(<ImageDisplay {...defaultProps} currentImage={mockImage} />)

        const copyButton = screen.getByTestId("copy-button")
        await userEvent.click(copyButton)

        expect(handleCopyUrl).toHaveBeenCalledWith(mockImage.url)
    })

    it("renders gallery items when images are provided", () => {
        const images = [mockImage, { ...mockImage, id: "2" }]
        render(<ImageDisplay {...defaultProps} images={images} />)

        expect(screen.getByTestId("gallery")).toBeInTheDocument()
        expect(screen.getByTestId("gallery-item-1")).toBeInTheDocument()
        expect(screen.getByTestId("gallery-item-2")).toBeInTheDocument()
    })

    it("calls onSelect when a gallery item is clicked", async () => {
        const onSelect = vi.fn()
        render(<ImageDisplay {...defaultProps} images={[mockImage]} onSelect={onSelect} />)

        await userEvent.click(screen.getByTestId("gallery-item-1"))
        expect(onSelect).toHaveBeenCalledWith(mockImage)
    })

    it("calls onRemove when remove button is clicked", async () => {
        const onRemove = vi.fn()
        render(<ImageDisplay {...defaultProps} images={[mockImage]} onRemove={onRemove} />)

        const removeButton = screen.getByTestId("remove-button-1")
        await userEvent.click(removeButton)
        expect(onRemove).toHaveBeenCalledWith(mockImage.id)
    })
})
