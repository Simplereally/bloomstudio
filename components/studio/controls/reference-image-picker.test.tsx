/**
 * @vitest-environment jsdom
 * 
 * Tests for ReferenceImagePicker Component
 */
import { useDeleteReferenceImage } from "@/hooks/mutations/use-delete-image"
import { useUploadReference } from "@/hooks/mutations/use-upload-reference"
import { useReferenceImages } from "@/hooks/queries/use-reference-images"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ReferenceImagePicker } from "./reference-image-picker"

// Mock next/image
vi.mock("next/image", () => ({
    default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}))

// Mock hooks
vi.mock("@/hooks/queries/use-reference-images", () => ({
    useReferenceImages: vi.fn(),
}))

vi.mock("@/hooks/mutations/use-upload-reference", () => ({
    useUploadReference: vi.fn(),
}))

vi.mock("@/hooks/mutations/use-delete-image", () => ({
    useDeleteReferenceImage: vi.fn(),
}))

describe("ReferenceImagePicker", () => {
    const mockOnSelect = vi.fn()
    const mockRecentImages = [
        { _id: "1", url: "url1" },
        { _id: "2", url: "url2" },
    ]

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useReferenceImages).mockReturnValue(mockRecentImages as any)
        vi.mocked(useUploadReference).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
        } as any)
        vi.mocked(useDeleteReferenceImage).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
        } as any)
    })

    it("renders upload button when no image selected", () => {
        render(<ReferenceImagePicker onSelect={mockOnSelect} />)
        expect(screen.getByText("Upload")).toBeInTheDocument()
    })

    it("renders selected image and clear button", () => {
        render(<ReferenceImagePicker selectedImage="selected-url" onSelect={mockOnSelect} />)
        expect(screen.getByAltText("Selected reference")).toBeInTheDocument()
        expect(screen.getByText("Clear")).toBeInTheDocument()
    })

    it("calls onSelect when recent image is clicked", () => {
        render(<ReferenceImagePicker onSelect={mockOnSelect} />)
        const recentImages = screen.getAllByAltText("Reference image")
        fireEvent.click(recentImages[0])
        expect(mockOnSelect).toHaveBeenCalledWith("url1")
    })

    it("calls onSelect with undefined when clear is clicked", () => {
        render(<ReferenceImagePicker selectedImage="url1" onSelect={mockOnSelect} />)
        fireEvent.click(screen.getByText("Clear"))
        expect(mockOnSelect).toHaveBeenCalledWith(undefined)
    })
})
