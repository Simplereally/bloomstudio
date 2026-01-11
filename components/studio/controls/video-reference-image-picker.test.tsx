// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { VideoReferenceImagePicker, type VideoReferenceImages } from "./video-reference-image-picker"

// Mock hooks
vi.mock("@/hooks/queries/use-reference-images", () => ({
    useReferenceImages: () => [
        { _id: "img1", url: "https://example.com/recent1.jpg" },
        { _id: "img2", url: "https://example.com/recent2.jpg" },
        { _id: "img3", url: "https://example.com/recent3.jpg" },
        { _id: "img4", url: "https://example.com/recent4.jpg" },
        { _id: "img5", url: "https://example.com/recent5.jpg" },
    ],
}))

vi.mock("@/hooks/mutations/use-upload-reference", () => ({
    useUploadReference: () => ({
        mutateAsync: vi.fn(),
        isPending: false,
    }),
}))

vi.mock("@/hooks/mutations/use-delete-image", () => ({
    useDeleteReferenceImage: () => ({
        mutateAsync: vi.fn(),
        isPending: false,
    }),
}))

// Mock next/image
vi.mock("next/image", () => ({
    default: ({ src, alt }: { src: string; alt: string }) => (
        <img src={src} alt={alt} data-testid="mock-image" />
    ),
}))

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

// Mock the browser modal
vi.mock("./reference-images-browser-modal", () => ({
    ReferenceImagesBrowserModal: ({ open, onSelect, onOpenChange }: { 
        open: boolean; 
        onSelect: (url: string) => void;
        onOpenChange: (open: boolean) => void;
    }) => (
        open ? (
            <div data-testid="browser-modal">
                <button onClick={() => onSelect("https://example.com/selected.jpg")} data-testid="modal-select-button">
                    Select Image
                </button>
                <button onClick={() => onOpenChange(false)} data-testid="modal-close-button">
                    Close
                </button>
            </div>
        ) : null
    ),
}))

describe("VideoReferenceImagePicker", () => {
    const defaultImages: VideoReferenceImages = {
        firstFrame: undefined,
        lastFrame: undefined,
    }

    const mockOnImagesChange = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("rendering", () => {
        it("renders first frame slot", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            expect(screen.getByTestId("firstFrame-slot")).toBeInTheDocument()
        })

        it("does not render last frame slot when supportsInterpolation is false", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                    supportsInterpolation={false}
                />
            )
            expect(screen.queryByTestId("lastFrame-slot")).not.toBeInTheDocument()
        })

        it("renders last frame slot when supportsInterpolation is true", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                    supportsInterpolation={true}
                />
            )
            expect(screen.getByTestId("lastFrame-slot")).toBeInTheDocument()
        })

        it("shows header by default", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            expect(screen.getByText("Video Frames")).toBeInTheDocument()
        })

        it("hides header when hideHeader is true", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                    hideHeader={true}
                />
            )
            expect(screen.queryByText("Video Frames")).not.toBeInTheDocument()
        })

        it("renders horizontal layout with frames container", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                    supportsInterpolation={true}
                />
            )
            expect(screen.getByTestId("frames-container")).toBeInTheDocument()
        })
    })

    describe("frame selection", () => {
        it("shows selected first frame image", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={{ firstFrame: "https://example.com/first.jpg", lastFrame: undefined }}
                    onImagesChange={mockOnImagesChange}
                />
            )
            const images = screen.getAllByTestId("mock-image")
            expect(images.some(img => img.getAttribute("src") === "https://example.com/first.jpg")).toBe(true)
        })

        it("shows selected last frame image when interpolation is supported", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={{ firstFrame: undefined, lastFrame: "https://example.com/last.jpg" }}
                    onImagesChange={mockOnImagesChange}
                    supportsInterpolation={true}
                />
            )
            const images = screen.getAllByTestId("mock-image")
            expect(images.some(img => img.getAttribute("src") === "https://example.com/last.jpg")).toBe(true)
        })

        it("clears first frame when clear button is clicked", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={{ firstFrame: "https://example.com/first.jpg", lastFrame: undefined }}
                    onImagesChange={mockOnImagesChange}
                />
            )
            const clearButton = screen.getByTestId("clear-firstFrame-button")
            fireEvent.click(clearButton)
            expect(mockOnImagesChange).toHaveBeenCalledWith({
                firstFrame: undefined,
                lastFrame: undefined,
            })
        })
    })

    describe("recent images", () => {
        it("shows recent images container", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            expect(screen.getByTestId("recent-images-container")).toBeInTheDocument()
        })

        it("shows only 3 recent images inline", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            const thumbnails = screen.getAllByTestId("recent-image-thumbnail")
            expect(thumbnails).toHaveLength(3)
        })

        it("shows View All button when there are more than 3 images", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            expect(screen.getByTestId("view-all-images-button")).toBeInTheDocument()
        })

        it("selects image when clicking on recent thumbnail", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            const selectButton = screen.getByTestId("select-recent-img1")
            fireEvent.click(selectButton)
            expect(mockOnImagesChange).toHaveBeenCalledWith({
                firstFrame: "https://example.com/recent1.jpg",
                lastFrame: undefined,
            })
        })
    })

    describe("browser modal", () => {
        it("opens browser modal when Browse button is clicked", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            const browseButton = screen.getByTestId("browse-firstFrame-button")
            fireEvent.click(browseButton)
            expect(screen.getByTestId("browser-modal")).toBeInTheDocument()
        })

        it("opens browser modal when View All button is clicked", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            const viewAllButton = screen.getByTestId("view-all-images-button")
            fireEvent.click(viewAllButton)
            expect(screen.getByTestId("browser-modal")).toBeInTheDocument()
        })

        it("selects image from modal and updates state", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            // Open the modal
            const browseButton = screen.getByTestId("browse-firstFrame-button")
            fireEvent.click(browseButton)
            
            // Select from modal
            const selectButton = screen.getByTestId("modal-select-button")
            fireEvent.click(selectButton)
            
            expect(mockOnImagesChange).toHaveBeenCalledWith({
                firstFrame: "https://example.com/selected.jpg",
                lastFrame: undefined,
            })
        })

        it("closes modal when close button is clicked", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            // Open the modal
            const browseButton = screen.getByTestId("browse-firstFrame-button")
            fireEvent.click(browseButton)
            expect(screen.getByTestId("browser-modal")).toBeInTheDocument()
            
            // Close the modal
            const closeButton = screen.getByTestId("modal-close-button")
            fireEvent.click(closeButton)
            expect(screen.queryByTestId("browser-modal")).not.toBeInTheDocument()
        })
    })

    describe("helper text", () => {
        it("shows default helper text when no frames selected", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            expect(screen.getByText("Upload a starting frame for the video")).toBeInTheDocument()
        })

        it("shows interpolation helper when supportsInterpolation and no frames", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                    supportsInterpolation={true}
                />
            )
            expect(screen.getByText("Upload frames to guide video generation")).toBeInTheDocument()
        })

        it("shows first frame helper when only first frame selected", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={{ firstFrame: "https://example.com/first.jpg", lastFrame: undefined }}
                    onImagesChange={mockOnImagesChange}
                    supportsInterpolation={true}
                />
            )
            expect(screen.getByText("Video will start from the first frame")).toBeInTheDocument()
        })

        it("shows interpolation helper when both frames selected", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={{ firstFrame: "https://example.com/first.jpg", lastFrame: "https://example.com/last.jpg" }}
                    onImagesChange={mockOnImagesChange}
                    supportsInterpolation={true}
                />
            )
            expect(screen.getByText("Video will interpolate between first and last frames")).toBeInTheDocument()
        })
    })

    describe("upload buttons", () => {
        it("renders upload button for first frame when not selected", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            expect(screen.getByTestId("upload-firstFrame-button")).toBeInTheDocument()
        })

        it("renders upload button for last frame when not selected and interpolation supported", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                    supportsInterpolation={true}
                />
            )
            expect(screen.getByTestId("upload-lastFrame-button")).toBeInTheDocument()
        })

        it("disables upload button when disabled prop is true", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                    disabled={true}
                />
            )
            const uploadButton = screen.getByTestId("upload-firstFrame-button")
            expect(uploadButton).toBeDisabled()
        })
    })

    describe("layout", () => {
        it("uses square aspect ratio for upload areas", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={defaultImages}
                    onImagesChange={mockOnImagesChange}
                />
            )
            const uploadButton = screen.getByTestId("upload-firstFrame-button")
            expect(uploadButton).toHaveClass("aspect-square")
        })

        it("uses square aspect ratio for selected frame preview", () => {
            render(
                <VideoReferenceImagePicker
                    selectedImages={{ firstFrame: "https://example.com/first.jpg", lastFrame: undefined }}
                    onImagesChange={mockOnImagesChange}
                />
            )
            const firstFrameSlot = screen.getByTestId("firstFrame-slot")
            const preview = firstFrameSlot.querySelector(".aspect-square")
            expect(preview).toBeInTheDocument()
        })
    })
})
