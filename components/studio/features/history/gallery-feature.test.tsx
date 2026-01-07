// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { GalleryFeature, type GalleryFeatureProps } from "./gallery-feature"
import type { GeneratedImage } from "@/types/pollinations"

// Mock GalleryView
vi.mock("./gallery-view", () => ({
    GalleryView: ({
        activeImageId,
        onSelectImage,
        thumbnailSize,
    }: {
        activeImageId?: string
        onSelectImage?: (image: GeneratedImage) => void
        thumbnailSize?: string
    }) => {
        const mockImage: GeneratedImage = {
            id: "test-id",
            url: "https://example.com/image.jpg",
            prompt: "Test prompt",
            timestamp: Date.now(),
            params: {},
        }

        return (
            <div data-testid="gallery-view">
                <span data-testid="active-id">{activeImageId || "none"}</span>
                <span data-testid="thumbnail-size">{thumbnailSize}</span>
                <button
                    data-testid="select-btn"
                    onClick={() => onSelectImage?.(mockImage)}
                >
                    Select
                </button>
            </div>
        )
    },
}))

describe("GalleryFeature", () => {
    const defaultProps: GalleryFeatureProps = {}

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders GalleryView", () => {
        render(<GalleryFeature {...defaultProps} />)

        expect(screen.getByTestId("gallery-view")).toBeInTheDocument()
    })

    it("passes activeImageId to GalleryView", () => {
        render(<GalleryFeature {...defaultProps} activeImageId="image-123" />)

        expect(screen.getByTestId("active-id")).toHaveTextContent("image-123")
    })

    it("shows none when no activeImageId", () => {
        render(<GalleryFeature {...defaultProps} />)

        expect(screen.getByTestId("active-id")).toHaveTextContent("none")
    })

    it("passes thumbnailSize to GalleryView", () => {
        render(<GalleryFeature {...defaultProps} thumbnailSize="lg" />)

        expect(screen.getByTestId("thumbnail-size")).toHaveTextContent("lg")
    })

    it("defaults thumbnailSize to md", () => {
        render(<GalleryFeature {...defaultProps} />)

        expect(screen.getByTestId("thumbnail-size")).toHaveTextContent("md")
    })

    it("calls onSelectImage when select button clicked", () => {
        const onSelectImage = vi.fn()
        render(<GalleryFeature {...defaultProps} onSelectImage={onSelectImage} />)

        fireEvent.click(screen.getByTestId("select-btn"))

        expect(onSelectImage).toHaveBeenCalledWith(
            expect.objectContaining({ id: "test-id" })
        )
    })
})
