import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ImageToolbar } from "./image-toolbar"
import type { GeneratedImage } from "@/types/pollinations"

const mockImage: GeneratedImage = {
    id: "test-1",
    url: "https://example.com/image.jpg",
    prompt: "A beautiful sunset",
    params: {
        prompt: "A beautiful sunset",
        model: "flux",
        width: 1024,
        height: 1024,
        enhance: false,
        quality: "medium",
        private: false,
        nologo: false,
        nofeed: false,
        safe: false,
        transparent: false,
    },
    timestamp: Date.now(),
}

describe("ImageToolbar", () => {
    it("renders the toolbar when image is provided", () => {
        render(<ImageToolbar image={mockImage} />)

        expect(screen.getByTestId("image-toolbar")).toBeInTheDocument()
    })

    it("does not render when no image", () => {
        render(<ImageToolbar image={null} />)

        expect(screen.queryByTestId("image-toolbar")).not.toBeInTheDocument()
    })

    it("renders all primary action buttons", () => {
        render(<ImageToolbar image={mockImage} />)

        expect(screen.getByTestId("download-button")).toBeInTheDocument()
        expect(screen.getByTestId("copy-button")).toBeInTheDocument()
        expect(screen.getByTestId("favorite-button")).toBeInTheDocument()
        expect(screen.getByTestId("fullscreen-button")).toBeInTheDocument()
        expect(screen.getByTestId("more-button")).toBeInTheDocument()
    })

    it("calls onDownload when download button is clicked", async () => {
        const onDownload = vi.fn()
        render(<ImageToolbar image={mockImage} onDownload={onDownload} />)

        await userEvent.click(screen.getByTestId("download-button"))
        expect(onDownload).toHaveBeenCalledTimes(1)
    })

    it("calls onCopyUrl when copy button is clicked", async () => {
        const onCopyUrl = vi.fn()
        render(<ImageToolbar image={mockImage} onCopyUrl={onCopyUrl} />)

        await userEvent.click(screen.getByTestId("copy-button"))
        expect(onCopyUrl).toHaveBeenCalledTimes(1)
    })

    it("calls onToggleFavorite when favorite button is clicked", async () => {
        const onToggleFavorite = vi.fn()
        render(<ImageToolbar image={mockImage} onToggleFavorite={onToggleFavorite} />)

        await userEvent.click(screen.getByTestId("favorite-button"))
        expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    })

    it("calls onFullscreen when fullscreen button is clicked", async () => {
        const onFullscreen = vi.fn()
        render(<ImageToolbar image={mockImage} onFullscreen={onFullscreen} />)

        await userEvent.click(screen.getByTestId("fullscreen-button"))
        expect(onFullscreen).toHaveBeenCalledTimes(1)
    })

    it("shows favorited state with filled heart", () => {
        render(<ImageToolbar image={mockImage} isFavorited={true} />)

        const favoriteButton = screen.getByTestId("favorite-button")
        expect(favoriteButton).toHaveClass("text-red-500")
    })

    it("applies custom className", () => {
        render(<ImageToolbar image={mockImage} className="custom-class" />)

        expect(screen.getByTestId("image-toolbar")).toHaveClass("custom-class")
    })

    it("positions toolbar at top by default", () => {
        render(<ImageToolbar image={mockImage} />)

        expect(screen.getByTestId("image-toolbar")).toHaveClass("top-4")
    })

    it("positions toolbar at bottom when specified", () => {
        render(<ImageToolbar image={mockImage} position="bottom" />)

        expect(screen.getByTestId("image-toolbar")).toHaveClass("bottom-4")
    })
})
