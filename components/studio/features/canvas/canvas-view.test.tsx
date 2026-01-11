// @vitest-environment jsdom
import type { GeneratedImage } from "@/types/pollinations"
import { render, screen } from "@testing-library/react"
import * as React from "react"
import { createMockImage } from "@/lib/test-utils"
import { CanvasView, type CanvasViewProps } from "./canvas-view"

// Mock studio components
vi.mock("@/components/studio", () => ({
    ImageCanvas: ({ image, isGenerating, onImageClick, children }: {
        image: GeneratedImage | null;
        isGenerating: boolean;
        onImageClick?: () => void;
        children?: React.ReactNode;
    }) => (
        <div data-testid="image-canvas" onClick={onImageClick}>
            <span data-testid="canvas-has-image">{String(!!image)}</span>
            <span data-testid="canvas-is-generating">{String(isGenerating)}</span>
            {image && <span data-testid="canvas-image-id">{image.id}</span>}
            {children}
        </div>
    ),
    ImageToolbar: ({ image, onDownload, onCopyUrl, onRegenerate, onOpenInNewTab, onFullscreen }: {
        image: GeneratedImage | null;
        onDownload?: () => void;
        onCopyUrl?: () => void;
        onRegenerate?: () => void;
        onOpenInNewTab?: () => void;
        onFullscreen?: () => void;
    }) => (
        <div data-testid="image-toolbar">
            <button data-testid="download-btn" onClick={onDownload}>Download</button>
            <button data-testid="copy-btn" onClick={onCopyUrl}>Copy</button>
            <button data-testid="regenerate-btn" onClick={onRegenerate}>Regenerate</button>
            <button data-testid="open-tab-btn" onClick={onOpenInNewTab}>Open Tab</button>
            <button data-testid="fullscreen-btn" onClick={onFullscreen}>Fullscreen</button>
        </div>
    ),
    ImageMetadata: ({ image, variant }: { image: GeneratedImage; variant: string }) => (
        <div data-testid="image-metadata">
            <span data-testid="metadata-prompt">{image.prompt}</span>
            <span data-testid="metadata-variant">{variant}</span>
        </div>
    ),
}))

describe("CanvasView", () => {
    const mockImage = createMockImage({
        id: "test-image-1",
        url: "https://example.com/image.jpg",
        prompt: "A beautiful sunset",
        params: {
            prompt: "A beautiful sunset",
            model: "flux",
            width: 1024,
            height: 1024,
        } as any
    })

    const defaultProps: CanvasViewProps = {
        image: null,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders image canvas", () => {
        render(<CanvasView {...defaultProps} />)

        expect(screen.getByTestId("image-canvas")).toBeInTheDocument()
    })

    it("renders image toolbar", () => {
        render(<CanvasView {...defaultProps} />)

        expect(screen.getByTestId("image-toolbar")).toBeInTheDocument()
    })

    it("renders with no image", () => {
        render(<CanvasView {...defaultProps} />)

        expect(screen.getByTestId("canvas-has-image")).toHaveTextContent("false")
    })

    it("renders with image", () => {
        render(<CanvasView {...defaultProps} image={mockImage} />)

        expect(screen.getByTestId("canvas-has-image")).toHaveTextContent("true")
        expect(screen.getByTestId("canvas-image-id")).toHaveTextContent("test-image-1")
    })

    it("shows generating state", () => {
        render(<CanvasView {...defaultProps} isGenerating={true} />)

        expect(screen.getByTestId("canvas-is-generating")).toHaveTextContent("true")
    })

    it("defaults isGenerating to false", () => {
        render(<CanvasView {...defaultProps} />)

        expect(screen.getByTestId("canvas-is-generating")).toHaveTextContent("false")
    })

    it("renders image metadata when image exists and not generating", () => {
        render(<CanvasView {...defaultProps} image={mockImage} isGenerating={false} />)

        expect(screen.getByTestId("image-metadata")).toBeInTheDocument()
        expect(screen.getByTestId("metadata-prompt")).toHaveTextContent("A beautiful sunset")
        expect(screen.getByTestId("metadata-variant")).toHaveTextContent("compact")
    })

    it("does not render image metadata when no image", () => {
        render(<CanvasView {...defaultProps} image={null} />)

        expect(screen.queryByTestId("image-metadata")).not.toBeInTheDocument()
    })

    it("does not render image metadata when generating", () => {
        render(<CanvasView {...defaultProps} image={mockImage} isGenerating={true} />)

        expect(screen.queryByTestId("image-metadata")).not.toBeInTheDocument()
    })

    it("calls onDownload when download button clicked", async () => {
        const onDownload = vi.fn()
        render(<CanvasView {...defaultProps} onDownload={onDownload} />)

        screen.getByTestId("download-btn").click()

        expect(onDownload).toHaveBeenCalledTimes(1)
    })

    it("calls onCopyUrl when copy button clicked", async () => {
        const onCopyUrl = vi.fn()
        render(<CanvasView {...defaultProps} onCopyUrl={onCopyUrl} />)

        screen.getByTestId("copy-btn").click()

        expect(onCopyUrl).toHaveBeenCalledTimes(1)
    })

    it("calls onRegenerate when regenerate button clicked", async () => {
        const onRegenerate = vi.fn()
        render(<CanvasView {...defaultProps} onRegenerate={onRegenerate} />)

        screen.getByTestId("regenerate-btn").click()

        expect(onRegenerate).toHaveBeenCalledTimes(1)
    })

    it("calls onOpenInNewTab when open tab button clicked", async () => {
        const onOpenInNewTab = vi.fn()
        render(<CanvasView {...defaultProps} onOpenInNewTab={onOpenInNewTab} />)

        screen.getByTestId("open-tab-btn").click()

        expect(onOpenInNewTab).toHaveBeenCalledTimes(1)
    })

    it("calls onFullscreen when fullscreen button clicked", async () => {
        const onFullscreen = vi.fn()
        render(<CanvasView {...defaultProps} onFullscreen={onFullscreen} />)

        screen.getByTestId("fullscreen-btn").click()

        expect(onFullscreen).toHaveBeenCalledTimes(1)
    })

    it("calls onImageClick when canvas clicked", async () => {
        const onImageClick = vi.fn()
        render(<CanvasView {...defaultProps} onImageClick={onImageClick} />)

        screen.getByTestId("image-canvas").click()

        expect(onImageClick).toHaveBeenCalledTimes(1)
    })
})
