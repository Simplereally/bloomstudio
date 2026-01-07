// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { VideoReferenceImagePicker, type VideoReferenceImages } from "./video-reference-image-picker"

// Mock hooks
vi.mock("@/hooks/queries/use-reference-images", () => ({
    useReferenceImages: () => [],
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
})
