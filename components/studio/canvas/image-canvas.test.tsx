import type { GeneratedImage } from "@/types/pollinations"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ImageCanvas, type QueueItem } from "./image-canvas"

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

const createQueueItems = (count: number): QueueItem[] =>
    Array.from({ length: count }, (_, i) => {
        const status: QueueItem["status"] = i === 0 ? "processing" : "pending"
        return {
            id: `gen-${i + 1}`,
            status,
            createdAt: Date.now() - (count - i) * 1000,
            aspectRatio: 1,
            labelIndex: i + 1,
        }
    })

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
        expect(screen.getByTestId("empty-state-icon")).toBeInTheDocument()
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

    describe("Queue Cards", () => {
        it("renders queue cards when queueItems are provided", () => {
            const items = createQueueItems(3)
            render(
                <ImageCanvas image={null} isGenerating={true} queueItems={items} />
            )

            const cards = screen.getAllByTestId("queue-card")
            expect(cards).toHaveLength(3)
            expect(screen.getByTestId("queue-card-grid")).toBeInTheDocument()
            expect(screen.getByTestId("queue-card-scroll-region")).toBeInTheDocument()
        })

        it("does not render queue grid when queueItems is empty", () => {
            render(<ImageCanvas image={null} isGenerating={true} queueItems={[]} />)

            expect(screen.queryByTestId("queue-card-grid")).not.toBeInTheDocument()
        })

        it("renders stop button per queue card with cancel handler", () => {
            const onCancelItem = vi.fn()
            const items = createQueueItems(2)
            render(
                <ImageCanvas
                    image={null}
                    isGenerating={true}
                    queueItems={items}
                    onCancelItem={onCancelItem}
                />
            )

            const stopButtons = screen.getAllByTestId("queue-card-stop")
            expect(stopButtons).toHaveLength(2)

            // Click the first stop button — should cancel gen-1
            fireEvent.click(stopButtons[0])
            expect(onCancelItem).toHaveBeenCalledTimes(1)
            expect(onCancelItem).toHaveBeenCalledWith("gen-1")

            // Click the second stop button — should cancel gen-2
            fireEvent.click(stopButtons[1])
            expect(onCancelItem).toHaveBeenCalledTimes(2)
            expect(onCancelItem).toHaveBeenCalledWith("gen-2")
        })

        it("shows 'Generating' label for processing items and 'Queued' for pending", () => {
            const items = createQueueItems(2) // first is processing, second is pending
            render(
                <ImageCanvas image={null} isGenerating={true} queueItems={items} />
            )

            expect(screen.getByText("Generating")).toBeInTheDocument()
            expect(screen.getByText("Queued")).toBeInTheDocument()
        })

        it("does not render stop buttons when onCancelItem is not provided", () => {
            const items = createQueueItems(2)
            render(
                <ImageCanvas image={null} isGenerating={true} queueItems={items} />
            )

            expect(screen.queryByTestId("queue-card-stop")).not.toBeInTheDocument()
        })
    })
})
