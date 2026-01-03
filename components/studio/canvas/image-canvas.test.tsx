import type { GeneratedImage } from "@/types/pollinations"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ImageCanvas } from "./image-canvas"

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

describe("ImageCanvas", () => {
    it("renders the canvas container", () => {
        render(<ImageCanvas image={null} />)

        expect(screen.getByTestId("image-canvas")).toBeInTheDocument()
        expect(screen.getByTestId("canvas-container")).toBeInTheDocument()
    })

    it("shows empty state when no image is provided", () => {
        render(<ImageCanvas image={null} />)

        expect(screen.getByText("Create something amazing")).toBeInTheDocument()
    })

    it("shows loading state when generating", () => {
        render(<ImageCanvas image={null} isGenerating={true} />)

        expect(screen.getByText("Generating Vision")).toBeInTheDocument()
    })

    it("shows progress when provided during generation", () => {
        render(<ImageCanvas image={null} isGenerating={true} progress={42} />)

        expect(screen.getByText("42%")).toBeInTheDocument()
    })

    it("displays the image when provided", () => {
        render(<ImageCanvas image={mockImage} />)

        const image = screen.getByRole("img")
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute("alt", "A beautiful sunset")
    })

    it("hides empty state when image is provided", () => {
        render(<ImageCanvas image={mockImage} />)

        expect(screen.queryByText("Create something amazing")).not.toBeInTheDocument()
    })

    it("hides loading state when not generating", () => {
        render(<ImageCanvas image={mockImage} isGenerating={false} />)

        expect(screen.queryByText("Generating Vision")).not.toBeInTheDocument()
    })

    it("calls onImageClick when image is clicked", () => {
        const onImageClick = vi.fn()
        render(<ImageCanvas image={mockImage} onImageClick={onImageClick} />)

        // Click on the image wrapper, not the canvas container
        fireEvent.click(screen.getByRole("img"))
        expect(onImageClick).toHaveBeenCalledTimes(1)
    })

    it("does not call onImageClick when no image", () => {
        const onImageClick = vi.fn()
        render(<ImageCanvas image={null} onImageClick={onImageClick} />)

        fireEvent.click(screen.getByTestId("canvas-container"))
        expect(onImageClick).not.toHaveBeenCalled()
    })

    it("applies custom className", () => {
        render(<ImageCanvas image={null} className="custom-class" />)

        expect(screen.getByTestId("image-canvas")).toHaveClass("custom-class")
    })

    it("constrains image dimensions with max-width and max-height", () => {
        const wideImage: GeneratedImage = {
            ...mockImage,
            params: { ...mockImage.params, width: 1920, height: 1080 },
        }
        render(<ImageCanvas image={wideImage} />)

        // The img element should have max-width and max-height constraints
        // to prevent it from exceeding the container size
        const image = screen.getByRole("img")
        expect(image).toHaveClass("max-w-full")
        expect(image).toHaveClass("max-h-[80vh]")
        expect(image).toHaveClass("w-auto")
        expect(image).toHaveClass("h-auto")
    })
})
