import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ImageCanvas } from "./image-canvas"
import type { GeneratedImage } from "@/types/pollinations"

const mockImage: GeneratedImage = {
    id: "test-1",
    url: "https://example.com/image.jpg",
    prompt: "A beautiful sunset",
    params: {
        prompt: "A beautiful sunset",
        width: 1024,
        height: 1024,
        model: "flux",
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

        expect(screen.getByTestId("empty-state")).toBeInTheDocument()
        expect(screen.getByText("Create something amazing")).toBeInTheDocument()
    })

    it("shows loading state when generating", () => {
        render(<ImageCanvas image={null} isGenerating={true} />)

        expect(screen.getByTestId("loading-state")).toBeInTheDocument()
        expect(screen.getByText("Generating your image...")).toBeInTheDocument()
    })

    it("shows progress when provided during generation", () => {
        render(<ImageCanvas image={null} isGenerating={true} progress={42} />)

        expect(screen.getByText("42% complete")).toBeInTheDocument()
    })

    it("displays the image when provided", () => {
        render(<ImageCanvas image={mockImage} />)

        const image = screen.getByTestId("generated-image")
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute("alt", "A beautiful sunset")
    })

    it("hides empty state when image is provided", () => {
        render(<ImageCanvas image={mockImage} />)

        expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument()
    })

    it("hides loading state when not generating", () => {
        render(<ImageCanvas image={mockImage} isGenerating={false} />)

        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument()
    })

    it("calls onImageClick when image is clicked", () => {
        const onImageClick = vi.fn()
        render(<ImageCanvas image={mockImage} onImageClick={onImageClick} />)

        fireEvent.click(screen.getByTestId("image-canvas"))
        expect(onImageClick).toHaveBeenCalledTimes(1)
    })

    it("does not call onImageClick when no image", () => {
        const onImageClick = vi.fn()
        render(<ImageCanvas image={null} onImageClick={onImageClick} />)

        fireEvent.click(screen.getByTestId("image-canvas"))
        expect(onImageClick).not.toHaveBeenCalled()
    })

    it("applies custom className", () => {
        render(<ImageCanvas image={null} className="custom-class" />)

        expect(screen.getByTestId("image-canvas")).toHaveClass("custom-class")
    })

    it("sets aspect ratio based on image dimensions", () => {
        const wideImage: GeneratedImage = {
            ...mockImage,
            params: { ...mockImage.params, width: 1920, height: 1080 },
        }
        render(<ImageCanvas image={wideImage} />)

        const container = screen.getByTestId("canvas-container")
        expect(container).toHaveStyle({ aspectRatio: "1920 / 1080" })
    })
})
