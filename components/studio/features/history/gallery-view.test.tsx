// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { GalleryView, type GalleryViewProps } from "./gallery-view"
import type { GeneratedImage } from "@/types/pollinations"

// Mock PersistentImageGallery
vi.mock("@/components/studio", () => ({
    PersistentImageGallery: ({
        activeImageId,
        onSelectImage,
        thumbnailSize,
    }: {
        activeImageId?: string
        onSelectImage?: (image: GeneratedImage) => void
        thumbnailSize?: string
    }) => (
        <div data-testid="persistent-image-gallery">
            <span data-testid="active-id">{activeImageId || "none"}</span>
            <span data-testid="thumbnail-size">{thumbnailSize}</span>
            <button
                data-testid="select-btn"
                onClick={() => onSelectImage?.({ id: "test", url: "", prompt: "", timestamp: 0, params: {} } as GeneratedImage)}
            >
                Select
            </button>
        </div>
    ),
}))

describe("GalleryView", () => {
    const defaultProps: GalleryViewProps = {}

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders PersistentImageGallery", () => {
        render(<GalleryView {...defaultProps} />)

        expect(screen.getByTestId("persistent-image-gallery")).toBeInTheDocument()
    })

    it("passes activeImageId to gallery", () => {
        render(<GalleryView {...defaultProps} activeImageId="image-123" />)

        expect(screen.getByTestId("active-id")).toHaveTextContent("image-123")
    })

    it("shows none when no activeImageId", () => {
        render(<GalleryView {...defaultProps} />)

        expect(screen.getByTestId("active-id")).toHaveTextContent("none")
    })

    it("passes thumbnailSize to gallery", () => {
        render(<GalleryView {...defaultProps} thumbnailSize="lg" />)

        expect(screen.getByTestId("thumbnail-size")).toHaveTextContent("lg")
    })

    it("defaults thumbnailSize to md", () => {
        render(<GalleryView {...defaultProps} />)

        expect(screen.getByTestId("thumbnail-size")).toHaveTextContent("md")
    })

    it("calls onSelectImage when select button clicked", () => {
        const onSelectImage = vi.fn()
        render(<GalleryView {...defaultProps} onSelectImage={onSelectImage} />)

        screen.getByTestId("select-btn").click()

        expect(onSelectImage).toHaveBeenCalledTimes(1)
    })

    it("renders with styled container", () => {
        const { container } = render(<GalleryView {...defaultProps} />)

        // The outer div should have the styling classes
        const wrapper = container.firstChild as HTMLElement
        expect(wrapper).toHaveClass("h-full")
    })
})
