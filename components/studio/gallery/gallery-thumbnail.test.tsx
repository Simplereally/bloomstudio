
import type { GeneratedImage } from "@/types/pollinations"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { GalleryThumbnail } from "./gallery-thumbnail"

// Mock dependencies
vi.mock("@/components/gallery/visibility-toggle", () => ({
    VisibilityToggle: ({ currentVisibility }: { currentVisibility: string }) => (
        <div data-testid="visibility-toggle">{currentVisibility}</div>
    ),
}))

const mockImage: GeneratedImage = {
    id: "test-1",
    url: "https://example.com/image.jpg",
    prompt: "A beautiful sunset",
    params: {
        prompt: "A beautiful sunset",
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
}

describe("GalleryThumbnail", () => {
    it("renders the thumbnail", () => {
        render(<GalleryThumbnail image={mockImage} />)

        expect(screen.getByTestId("gallery-thumbnail")).toBeInTheDocument()
    })

    it("calls onClick when clicked", async () => {
        const onClick = vi.fn()
        render(<GalleryThumbnail image={mockImage} onClick={onClick} />)

        await userEvent.click(screen.getByTestId("gallery-thumbnail"))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it("shows active indicator when isActive", () => {
        render(<GalleryThumbnail image={mockImage} isActive={true} />)

        expect(screen.getByTestId("active-indicator")).toBeInTheDocument()
    })

    it("does not show active indicator when not active", () => {
        render(<GalleryThumbnail image={mockImage} isActive={false} />)

        expect(screen.queryByTestId("active-indicator")).not.toBeInTheDocument()
    })

    it("shows checkbox when showCheckbox is true", () => {
        render(<GalleryThumbnail image={mockImage} showCheckbox={true} />)

        expect(screen.getByTestId("thumbnail-checkbox")).toBeInTheDocument()
    })

    it("does not show checkbox by default", () => {
        render(<GalleryThumbnail image={mockImage} />)

        expect(screen.queryByTestId("thumbnail-checkbox")).not.toBeInTheDocument()
    })

    it("shows remove action when onRemove is provided", async () => {
        const onRemove = vi.fn()
        render(<GalleryThumbnail image={mockImage} onRemove={onRemove} />)

        // Hover to show overlay
        fireEvent.mouseEnter(screen.getByTestId("gallery-thumbnail"))
        expect(screen.getByTestId("remove-action")).toBeInTheDocument()
    })

    it("calls onRemove when remove button is clicked", async () => {
        const onRemove = vi.fn()
        render(<GalleryThumbnail image={mockImage} onRemove={onRemove} />)

        fireEvent.mouseEnter(screen.getByTestId("gallery-thumbnail"))
        await userEvent.click(screen.getByTestId("remove-action"))
        expect(onRemove).toHaveBeenCalledTimes(1)
    })

    it("shows copy action when onCopy is provided", async () => {
        const onCopy = vi.fn()
        render(<GalleryThumbnail image={mockImage} onCopy={onCopy} />)

        fireEvent.mouseEnter(screen.getByTestId("gallery-thumbnail"))
        expect(screen.getByTestId("copy-action")).toBeInTheDocument()
    })

    it("calls onCopy when copy button is clicked", async () => {
        const onCopy = vi.fn()
        render(<GalleryThumbnail image={mockImage} onCopy={onCopy} />)

        fireEvent.mouseEnter(screen.getByTestId("gallery-thumbnail"))
        await userEvent.click(screen.getByTestId("copy-action"))
        expect(onCopy).toHaveBeenCalledTimes(1)
    })

    it("shows download action when onDownload is provided", async () => {
        const onDownload = vi.fn()
        render(<GalleryThumbnail image={mockImage} onDownload={onDownload} />)

        fireEvent.mouseEnter(screen.getByTestId("gallery-thumbnail"))
        expect(screen.getByTestId("download-action")).toBeInTheDocument()
    })

    it("calls onCheckedChange when checkbox is clicked", async () => {
        const onCheckedChange = vi.fn()
        render(
            <GalleryThumbnail
                image={mockImage}
                showCheckbox={true}
                onCheckedChange={onCheckedChange}
            />
        )

        await userEvent.click(screen.getByTestId("thumbnail-checkbox"))
        expect(onCheckedChange).toHaveBeenCalledWith(true)
    })

    it("applies custom className", () => {
        render(<GalleryThumbnail image={mockImage} className="custom-class" />)

        expect(screen.getByTestId("gallery-thumbnail")).toHaveClass("custom-class")
    })


    it("applies size classes correctly", () => {
        const { rerender } = render(<GalleryThumbnail image={mockImage} size="sm" />)
        expect(screen.getByTestId("gallery-thumbnail")).toHaveClass("w-16", "h-16")

        rerender(<GalleryThumbnail image={mockImage} size="lg" />)
        expect(screen.getByTestId("gallery-thumbnail")).toHaveClass("w-32", "h-32")
    })

    it("shows visibility toggle when _id and visibility are provided", async () => {
        const imageWithVisibility = {
            ...mockImage,
            _id: "test-id-123",
            visibility: "public" as const
        }
        
        render(<GalleryThumbnail image={imageWithVisibility} />)
        
        // Hover to show overlay
        fireEvent.mouseEnter(screen.getByTestId("gallery-thumbnail"))
        expect(screen.getByTestId("visibility-toggle")).toBeInTheDocument()
        expect(screen.getByText("public")).toBeInTheDocument()
    })

    it("does not show visibility toggle when visibility is missing", () => {
        render(<GalleryThumbnail image={mockImage} />)
        
        fireEvent.mouseEnter(screen.getByTestId("gallery-thumbnail"))
        expect(screen.queryByTestId("visibility-toggle")).not.toBeInTheDocument()
    })
})
