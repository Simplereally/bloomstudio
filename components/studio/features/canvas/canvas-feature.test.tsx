// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CanvasFeature, type CanvasFeatureProps } from "./canvas-feature"
import type { GeneratedImage } from "@/types/pollinations"
import { createMockImage } from "@/lib/test-utils"

// Mock CanvasView
vi.mock("./canvas-view", () => ({
    CanvasView: ({
        image,
        isGenerating,
        onImageClick,
        onDownload,
        onCopyUrl,
        onRegenerate,
        onOpenInNewTab,
        onFullscreen,
    }: {
        image: GeneratedImage | null
        isGenerating: boolean
        onImageClick?: () => void
        onDownload?: () => void
        onCopyUrl?: () => void
        onRegenerate?: () => void
        onOpenInNewTab?: () => void
        onFullscreen?: () => void
    }) => (
        <div data-testid="canvas-view">
            <span data-testid="has-image">{String(!!image)}</span>
            <span data-testid="is-generating">{String(isGenerating)}</span>
            {image && <span data-testid="image-id">{image.id}</span>}
            <button data-testid="image-click" onClick={onImageClick}>Image Click</button>
            <button data-testid="download" onClick={onDownload}>Download</button>
            <button data-testid="copy-url" onClick={onCopyUrl}>Copy URL</button>
            <button data-testid="regenerate" onClick={onRegenerate}>Regenerate</button>
            <button data-testid="open-tab" onClick={onOpenInNewTab}>Open Tab</button>
            <button data-testid="fullscreen" onClick={onFullscreen}>Fullscreen</button>
        </div>
    ),
}))

// Mock useDownloadImage
const mockDownload = vi.fn()
vi.mock("@/hooks/queries", () => ({
    useDownloadImage: () => ({
        download: mockDownload,
    }),
}))

vi.mock("@/lib/errors", () => ({
    showErrorToast: vi.fn(),
}))

describe("CanvasFeature", () => {
    const mockImage = createMockImage({
        id: "test-image-1",
        url: "https://example.com/image.jpg",
        prompt: "A beautiful sunset",
        params: {
            prompt: "A beautiful sunset",
            model: "flux",
            width: 1024,
            height: 1024,
        }
    })

    const defaultProps: CanvasFeatureProps = {
        currentImage: null,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // Mock clipboard API
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        })
        // Mock window.open
        window.open = vi.fn()
    })

    it("renders CanvasView", () => {
        render(<CanvasFeature {...defaultProps} />)

        expect(screen.getByTestId("canvas-view")).toBeInTheDocument()
    })

    it("passes currentImage to CanvasView", () => {
        render(<CanvasFeature {...defaultProps} currentImage={mockImage} />)

        expect(screen.getByTestId("has-image")).toHaveTextContent("true")
        expect(screen.getByTestId("image-id")).toHaveTextContent("test-image-1")
    })

    it("passes isGenerating to CanvasView", () => {
        render(<CanvasFeature {...defaultProps} isGenerating={true} />)

        expect(screen.getByTestId("is-generating")).toHaveTextContent("true")
    })

    it("defaults isGenerating to false", () => {
        render(<CanvasFeature {...defaultProps} />)

        expect(screen.getByTestId("is-generating")).toHaveTextContent("false")
    })

    it("handles download action", () => {
        render(<CanvasFeature {...defaultProps} currentImage={mockImage} />)

        fireEvent.click(screen.getByTestId("download"))

        expect(mockDownload).toHaveBeenCalledWith({
            url: mockImage.url,
            filename: `bloomstudio-${mockImage.id}.jpg`,
        })
    })

    it("does not call download when no image", () => {
        render(<CanvasFeature {...defaultProps} currentImage={null} />)

        fireEvent.click(screen.getByTestId("download"))

        expect(mockDownload).not.toHaveBeenCalled()
    })

    it("handles copy URL action", async () => {
        render(<CanvasFeature {...defaultProps} currentImage={mockImage} />)

        fireEvent.click(screen.getByTestId("copy-url"))

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockImage.url)
    })

    it("handles open in new tab action", () => {
        render(<CanvasFeature {...defaultProps} currentImage={mockImage} />)

        fireEvent.click(screen.getByTestId("open-tab"))

        expect(window.open).toHaveBeenCalledWith(mockImage.url, "_blank")
    })

    it("calls onOpenLightbox on image click", () => {
        const onOpenLightbox = vi.fn()
        render(
            <CanvasFeature
                {...defaultProps}
                currentImage={mockImage}
                onOpenLightbox={onOpenLightbox}
            />
        )

        fireEvent.click(screen.getByTestId("image-click"))

        expect(onOpenLightbox).toHaveBeenCalledWith(mockImage)
    })

    it("calls onOpenLightbox on fullscreen click", () => {
        const onOpenLightbox = vi.fn()
        render(
            <CanvasFeature
                {...defaultProps}
                currentImage={mockImage}
                onOpenLightbox={onOpenLightbox}
            />
        )

        fireEvent.click(screen.getByTestId("fullscreen"))

        expect(onOpenLightbox).toHaveBeenCalledWith(mockImage)
    })

    it("calls onRegenerate when regenerate clicked", () => {
        const onRegenerate = vi.fn()
        render(
            <CanvasFeature
                {...defaultProps}
                currentImage={mockImage}
                onRegenerate={onRegenerate}
            />
        )

        fireEvent.click(screen.getByTestId("regenerate"))

        expect(onRegenerate).toHaveBeenCalledTimes(1)
    })
})
