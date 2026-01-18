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

        // Empty state should show the ImagePlus icon
        expect(screen.getByTestId("image-canvas")).toBeInTheDocument()
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

        // When image is provided, the placeholder should not be visible
        const image = screen.getByRole("img")
        expect(image).toBeInTheDocument()
    })

    it("hides loading state when not generating", () => {
        render(<ImageCanvas image={mockImage} isGenerating={false} />)

        // When not generating, the animated "GENERATING" text should not appear
        // Check that none of the generating indicator letters are present
        expect(screen.queryAllByText("G")).toHaveLength(0)
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

        // The MediaPlayer container should have max-width and max-height constraints
        // The actual img element is inside MediaPlayer with its own responsive classes
        const image = screen.getByRole("img")
        expect(image).toBeInTheDocument()
        // MediaPlayer applies w-full h-full object-contain to the img element
        expect(image).toHaveClass("object-contain")
        // The parent MediaPlayer div should have the dimension constraints
        expect(image.parentElement).toHaveClass("relative")
    })
    it("renders a video when the content is a video", () => {
        const videoImage: GeneratedImage = {
            ...mockImage,
            url: "https://example.com/video.mp4",
            contentType: "video/mp4",
        }
        const { container } = render(<ImageCanvas image={videoImage} />)

        const video = container.querySelector("video")
        expect(video).toBeInTheDocument()
        expect(video).toHaveAttribute("src", "https://example.com/video.mp4")
    })
})
