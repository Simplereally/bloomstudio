// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { GalleryView, type GalleryViewProps } from "./gallery-view"
import type { GeneratedImage } from "@/types/pollinations"
import * as React from "react"

// Mock PersistentImageGallery
vi.mock("@/components/studio", () => ({
    PersistentImageGallery: ({
        activeImageId,
        onSelectImage,
        onRemoveImage,
        onDownloadImage,
        onCopyImageUrl,
        thumbnailSize,
    }: {
        activeImageId?: string
        onSelectImage?: (image: GeneratedImage) => void
        onRemoveImage?: (id: string) => void
        onDownloadImage?: (image: GeneratedImage) => void
        onCopyImageUrl?: (image: GeneratedImage) => void
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
            <button
                data-testid="remove-btn"
                onClick={() => onRemoveImage?.("test-id")}
            >
                Remove
            </button>
            <button
                data-testid="download-btn"
                onClick={() => onDownloadImage?.({ id: "test", url: "", prompt: "", timestamp: 0, params: {} } as GeneratedImage)}
            >
                Download
            </button>
            <button
                data-testid="copy-btn"
                onClick={() => onCopyImageUrl?.({ id: "test", url: "http://test.com", prompt: "", timestamp: 0, params: {} } as GeneratedImage)}
            >
                Copy URL
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

    it("calls onRemoveImage when remove button clicked", () => {
        const onRemoveImage = vi.fn()
        render(<GalleryView {...defaultProps} onRemoveImage={onRemoveImage} />)

        screen.getByTestId("remove-btn").click()

        expect(onRemoveImage).toHaveBeenCalledWith("test-id")
    })

    it("calls onDownloadImage when download button clicked", () => {
        const onDownloadImage = vi.fn()
        render(<GalleryView {...defaultProps} onDownloadImage={onDownloadImage} />)

        screen.getByTestId("download-btn").click()

        expect(onDownloadImage).toHaveBeenCalledTimes(1)
    })

    it("calls onCopyImageUrl when copy button clicked", () => {
        const onCopyImageUrl = vi.fn()
        render(<GalleryView {...defaultProps} onCopyImageUrl={onCopyImageUrl} />)

        screen.getByTestId("copy-btn").click()

        expect(onCopyImageUrl).toHaveBeenCalledTimes(1)
    })

    it("renders with styled container", () => {
        const { container } = render(<GalleryView {...defaultProps} />)

        // The outer div should have the styling classes
        const wrapper = container.firstChild as HTMLElement
        expect(wrapper).toHaveClass("h-full")
    })
})
