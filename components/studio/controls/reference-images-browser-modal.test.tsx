// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { ReferenceImagesBrowserModal } from "./reference-images-browser-modal"

// Mock hooks
const mockReferenceImages = [
    { _id: "img1", url: "https://example.com/image1.jpg" },
    { _id: "img2", url: "https://example.com/image2.jpg" },
    { _id: "img3", url: "https://example.com/test-photo.jpg" },
    { _id: "img4", url: "https://example.com/sunset.jpg" },
]

vi.mock("@/hooks/queries/use-reference-images", () => ({
    useReferenceImages: () => mockReferenceImages,
}))

vi.mock("@/hooks/mutations/use-delete-image", () => ({
    useDeleteReferenceImage: () => ({
        mutateAsync: vi.fn(),
        isPending: false,
    }),
}))

// Mock next/image
vi.mock("next/image", () => ({
    default: ({ src, alt }: { src: string; alt: string }): JSX.Element => (
        <img src={src} alt={alt} data-testid="mock-image" />
    ),
}))

// Mock DeleteImageDialog
vi.mock("@/components/studio/delete-image-dialog", () => ({
    DeleteImageDialog: ({ onConfirm }: { onConfirm: () => void }): JSX.Element => (
        <button onClick={onConfirm} data-testid="delete-button">
            Delete
        </button>
    ),
}))

describe("ReferenceImagesBrowserModal", () => {
    const mockOnSelect = vi.fn()
    const mockOnOpenChange = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("rendering", () => {
        it("renders modal when open is true", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            expect(screen.getByRole("dialog")).toBeInTheDocument()
        })

        it("does not render modal when open is false", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={false}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        })

        it("renders default title", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            expect(screen.getByText("Browse Reference Images")).toBeInTheDocument()
        })

        it("renders custom title", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                    title="Select First Frame"
                />
            )
            expect(screen.getByText("Select First Frame")).toBeInTheDocument()
        })

        it("renders description", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                    description="Choose a reference"
                />
            )
            expect(screen.getByText("Choose a reference")).toBeInTheDocument()
        })

        it("renders search input", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            expect(screen.getByTestId("reference-images-search")).toBeInTheDocument()
        })

        it("renders images grid", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            expect(screen.getByTestId("reference-images-grid")).toBeInTheDocument()
        })

        it("renders all images from the query", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            const images = screen.getAllByTestId("reference-image-item")
            expect(images).toHaveLength(4)
        })

        it("displays image count in footer", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            expect(screen.getByText("4 images")).toBeInTheDocument()
        })
    })

    describe("search functionality", () => {
        it("filters images based on search query", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            const searchInput = screen.getByTestId("reference-images-search")
            fireEvent.change(searchInput, { target: { value: "test" } })
            
            const images = screen.getAllByTestId("reference-image-item")
            expect(images).toHaveLength(1)
        })

        it("shows clear search button when search is active", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            const searchInput = screen.getByTestId("reference-images-search")
            
            // No clear button initially
            expect(screen.queryByTestId("clear-search-button")).not.toBeInTheDocument()
            
            // Type in search
            fireEvent.change(searchInput, { target: { value: "test" } })
            
            // Clear button should appear
            expect(screen.getByTestId("clear-search-button")).toBeInTheDocument()
        })

        it("clears search when clear button is clicked", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            const searchInput = screen.getByTestId("reference-images-search")
            fireEvent.change(searchInput, { target: { value: "test" } })
            
            const clearButton = screen.getByTestId("clear-search-button")
            fireEvent.click(clearButton)
            
            expect(searchInput).toHaveValue("")
            const images = screen.getAllByTestId("reference-image-item")
            expect(images).toHaveLength(4)
        })

        it("shows empty state when no images match search", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            const searchInput = screen.getByTestId("reference-images-search")
            fireEvent.change(searchInput, { target: { value: "nonexistent" } })
            
            expect(screen.getByText("No images match your search")).toBeInTheDocument()
        })

        it("updates image count when filtering", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            const searchInput = screen.getByTestId("reference-images-search")
            fireEvent.change(searchInput, { target: { value: "test" } })
            
            expect(screen.getByText("1 image")).toBeInTheDocument()
        })
    })

    describe("selection", () => {
        it("calls onSelect when an image is clicked", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            const selectButton = screen.getByTestId("select-image-img1")
            fireEvent.click(selectButton)
            
            expect(mockOnSelect).toHaveBeenCalledWith("https://example.com/image1.jpg")
        })

        it("highlights selected images", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                    selectedUrls={["https://example.com/image1.jpg"]}
                />
            )
            const items = screen.getAllByTestId("reference-image-item")
            expect(items[0]).toHaveClass("border-primary")
        })
    })

    describe("close behavior", () => {
        it("calls onOpenChange when close button is clicked", () => {
            render(
                <ReferenceImagesBrowserModal
                    open={true}
                    onOpenChange={mockOnOpenChange}
                    onSelect={mockOnSelect}
                />
            )
            // Get all close buttons and select the footer one (the one with text "Close" that's visible)
            const closeButtons = screen.getAllByRole("button", { name: /close/i })
            // The footer button is the one with the "Close" text content (first one in our case)
            const footerCloseButton = closeButtons.find(btn => btn.textContent === "Close")
            expect(footerCloseButton).toBeDefined()
            fireEvent.click(footerCloseButton!)
            
            expect(mockOnOpenChange).toHaveBeenCalledWith(false)
        })
    })
})

describe("ReferenceImagesBrowserModal - search empty state", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("shows empty state message when search yields no results", async () => {
        const mockOnSelect = vi.fn()
        const mockOnOpenChange = vi.fn()

        render(
            <ReferenceImagesBrowserModal
                open={true}
                onOpenChange={mockOnOpenChange}
                onSelect={mockOnSelect}
            />
        )

        // Type something that won't match
        const searchInput = screen.getByTestId("reference-images-search")
        fireEvent.change(searchInput, { target: { value: "zzzznonexistent" } })

        expect(screen.getByText("No images match your search")).toBeInTheDocument()
    })
})
