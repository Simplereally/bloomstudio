
import type { GeneratedImage } from "@/types/pollinations"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { GalleryThumbnail } from "./gallery-thumbnail"

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

    it("calls onClick when clicked (not in selection mode)", async () => {
        const onClick = vi.fn()
        render(<GalleryThumbnail image={mockImage} onClick={onClick} />)

        await userEvent.click(screen.getByTestId("gallery-thumbnail"))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it("shows active indicator when isActive and not in selection mode", () => {
        render(<GalleryThumbnail image={mockImage} isActive={true} />)

        expect(screen.getByTestId("active-indicator")).toBeInTheDocument()
    })

    it("does not show active indicator when not active", () => {
        render(<GalleryThumbnail image={mockImage} isActive={false} />)

        expect(screen.queryByTestId("active-indicator")).not.toBeInTheDocument()
    })

    it("does not show active indicator in selection mode even when active", () => {
        render(<GalleryThumbnail image={mockImage} isActive={true} showCheckbox={true} />)

        expect(screen.queryByTestId("active-indicator")).not.toBeInTheDocument()
    })

    it("shows selection indicator when showCheckbox is true", () => {
        render(<GalleryThumbnail image={mockImage} showCheckbox={true} />)

        expect(screen.getByTestId("selection-indicator")).toBeInTheDocument()
    })

    it("does not show selection indicator by default", () => {
        render(<GalleryThumbnail image={mockImage} />)

        expect(screen.queryByTestId("selection-indicator")).not.toBeInTheDocument()
    })

    describe("selection mode behavior", () => {
        it("toggles selection when clicked in selection mode", async () => {
            const onCheckedChange = vi.fn()
            render(
                <GalleryThumbnail
                    image={mockImage}
                    showCheckbox={true}
                    isChecked={false}
                    onCheckedChange={onCheckedChange}
                />
            )

            await userEvent.click(screen.getByTestId("gallery-thumbnail"))
            expect(onCheckedChange).toHaveBeenCalledWith(true)
        })

        it("toggles selection off when clicked while checked", async () => {
            const onCheckedChange = vi.fn()
            render(
                <GalleryThumbnail
                    image={mockImage}
                    showCheckbox={true}
                    isChecked={true}
                    onCheckedChange={onCheckedChange}
                />
            )

            await userEvent.click(screen.getByTestId("gallery-thumbnail"))
            expect(onCheckedChange).toHaveBeenCalledWith(false)
        })

        it("does not call onClick in selection mode", async () => {
            const onClick = vi.fn()
            const onCheckedChange = vi.fn()
            render(
                <GalleryThumbnail
                    image={mockImage}
                    showCheckbox={true}
                    onClick={onClick}
                    onCheckedChange={onCheckedChange}
                />
            )

            await userEvent.click(screen.getByTestId("gallery-thumbnail"))
            expect(onClick).not.toHaveBeenCalled()
            expect(onCheckedChange).toHaveBeenCalled()
        })

        it("applies selected styling when checked", () => {
            render(
                <GalleryThumbnail
                    image={mockImage}
                    showCheckbox={true}
                    isChecked={true}
                />
            )

            const thumbnail = screen.getByTestId("gallery-thumbnail")
            expect(thumbnail).toHaveClass("border-primary")
        })
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
})
