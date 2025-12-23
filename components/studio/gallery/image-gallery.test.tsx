import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ImageGallery } from "./image-gallery"
import type { GeneratedImage } from "@/types/pollinations"

const mockImages: GeneratedImage[] = [
    {
        id: "1",
        url: "https://example.com/image1.jpg",
        prompt: "First image",
        params: {
            prompt: "First image",
            width: 1024,
            height: 1024,
            model: "flux",
            enhance: false,
            quality: "medium",
            private: false,
            nologo: false,
            nofeed: false,
            safe: false,
            transparent: false,
        },
        timestamp: Date.now(),
    },
    {
        id: "2",
        url: "https://example.com/image2.jpg",
        prompt: "Second image",
        params: {
            prompt: "Second image",
            width: 1024,
            height: 1024,
            model: "flux",
            enhance: false,
            quality: "medium",
            private: false,
            nologo: false,
            nofeed: false,
            safe: false,
            transparent: false,
        },
        timestamp: Date.now() - 1000,
    },
    {
        id: "3",
        url: "https://example.com/image3.jpg",
        prompt: "Third image",
        params: {
            prompt: "Third image",
            width: 1024,
            height: 1024,
            model: "flux",
            enhance: false,
            quality: "medium",
            private: false,
            nologo: false,
            nofeed: false,
            safe: false,
            transparent: false,
        },
        timestamp: Date.now() - 2000,
    },
]

describe("ImageGallery", () => {
    it("renders the gallery when images exist", () => {
        render(<ImageGallery images={mockImages} />)

        expect(screen.getByTestId("image-gallery")).toBeInTheDocument()
        expect(screen.getByTestId("gallery-grid")).toBeInTheDocument()
    })

    it("shows empty state when no images", () => {
        render(<ImageGallery images={[]} />)

        expect(screen.getByTestId("gallery-empty")).toBeInTheDocument()
        expect(screen.getByText("No images yet")).toBeInTheDocument()
    })

    it("displays image count in header", () => {
        render(<ImageGallery images={mockImages} />)

        expect(screen.getByText("History (3)")).toBeInTheDocument()
    })

    it("renders thumbnails for all images", () => {
        render(<ImageGallery images={mockImages} />)

        expect(screen.getAllByTestId("gallery-thumbnail")).toHaveLength(3)
    })

    it("calls onSelectImage when thumbnail is clicked", async () => {
        const onSelectImage = vi.fn()
        render(<ImageGallery images={mockImages} onSelectImage={onSelectImage} />)

        const thumbnails = screen.getAllByTestId("gallery-thumbnail")
        await userEvent.click(thumbnails[0])
        expect(onSelectImage).toHaveBeenCalledWith(mockImages[0])
    })

    it("marks active image", () => {
        render(<ImageGallery images={mockImages} activeImageId="2" />)

        // The active thumbnail should have the active indicator
        expect(screen.getByTestId("active-indicator")).toBeInTheDocument()
    })

    it("shows selection toggle button when handler provided", () => {
        render(
            <ImageGallery images={mockImages} onToggleSelectionMode={vi.fn()} />
        )

        expect(screen.getByTestId("toggle-selection")).toBeInTheDocument()
    })

    it("calls onToggleSelectionMode when toggle button clicked", async () => {
        const onToggleSelectionMode = vi.fn()
        render(
            <ImageGallery
                images={mockImages}
                onToggleSelectionMode={onToggleSelectionMode}
            />
        )

        await userEvent.click(screen.getByTestId("toggle-selection"))
        expect(onToggleSelectionMode).toHaveBeenCalledTimes(1)
    })

    it("shows select all button in selection mode", () => {
        render(
            <ImageGallery
                images={mockImages}
                selectionMode={true}
                onToggleSelectionMode={vi.fn()}
            />
        )

        expect(screen.getByTestId("select-all")).toBeInTheDocument()
    })

    it("shows delete button when items are selected", () => {
        render(
            <ImageGallery
                images={mockImages}
                selectionMode={true}
                selectedIds={new Set(["1", "2"])}
                onDeleteSelected={vi.fn()}
                onToggleSelectionMode={vi.fn()}
            />
        )

        expect(screen.getByTestId("delete-selected")).toBeInTheDocument()
        expect(screen.getByText("Delete (2)")).toBeInTheDocument()
    })

    it("calls onDeleteSelected when delete button clicked", async () => {
        const onDeleteSelected = vi.fn()
        render(
            <ImageGallery
                images={mockImages}
                selectionMode={true}
                selectedIds={new Set(["1"])}
                onDeleteSelected={onDeleteSelected}
                onToggleSelectionMode={vi.fn()}
            />
        )

        await userEvent.click(screen.getByTestId("delete-selected"))
        expect(onDeleteSelected).toHaveBeenCalledTimes(1)
    })

    it("applies custom className", () => {
        render(<ImageGallery images={mockImages} className="custom-class" />)

        expect(screen.getByTestId("image-gallery")).toHaveClass("custom-class")
    })
})
