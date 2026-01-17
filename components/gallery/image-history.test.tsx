/**
 * @vitest-environment jsdom
 * 
 * Tests for ImageHistory Component
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ImageHistory } from "./image-history"

// Mock hooks
const mockUseImageHistoryWithDisplayData = vi.fn()
const mockUseDeleteGeneratedImage = vi.fn()

vi.mock("@/hooks/queries/use-image-history", () => ({
    useImageHistoryWithDisplayData: () => mockUseImageHistoryWithDisplayData(),
}))

vi.mock("@/hooks/mutations/use-delete-image", () => ({
    useDeleteGeneratedImage: () => mockUseDeleteGeneratedImage(),
}))

// Mock Next.js Image
vi.mock("next/image", () => ({
    default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={alt} {...props} />
    },

}))

// Mock components
vi.mock("@/components/gallery/visibility-toggle", () => ({
    VisibilityToggle: ({ imageId }: { imageId: string }) => (
        <button data-testid={`visibility-toggle-${imageId}`}>Toggle Visibility</button>
    ),
}))

vi.mock("@/components/studio/delete-image-dialog", () => ({
    DeleteImageDialog: ({ onConfirm, isDeleting }: { onConfirm: () => void, isDeleting: boolean }) => (
        <button
            data-testid="delete-dialog-button"
            onClick={onConfirm}
            disabled={isDeleting}
        >
            Delete
        </button>
    ),
}))

// Mock utils
vi.mock("@/lib/config/models", () => ({
    getModelDisplayName: (model: string) => `Display ${model}`,
}))

describe("ImageHistory", () => {
    const mockLoadMore = vi.fn()
    const mockDeleteMutateAsync = vi.fn()

    const mockImages = [
        {
            _id: "img1",
            url: "/img1.jpg",
            prompt: "A beautiful sunset",
            model: "flux-pro",
            visibility: "public"
        },
        {
            _id: "img2",
            url: "/img2.jpg",
            prompt: "A cute cat",
            model: "stable-diffusion",
            visibility: "private"
        },
    ]

    beforeEach(() => {
        vi.clearAllMocks()

        // Default mock implementations
        mockUseDeleteGeneratedImage.mockReturnValue({
            mutateAsync: mockDeleteMutateAsync,
            isPending: false,
        })
    })

    describe("Loading State", () => {
        it("renders skeletons when loading first page", () => {
            mockUseImageHistoryWithDisplayData.mockReturnValue({
                results: [],
                status: "LoadingFirstPage",
                loadMore: mockLoadMore,
            })

            const { container } = render(<ImageHistory />)

            // Should render 8 skeletons
            // Currently utilizing a loose check since skeletons don't have a specific test id but have 'animate-pulse' class
            const skeletons = container.querySelectorAll(".animate-pulse")
            expect(skeletons.length).toBeGreaterThan(0)
            expect(skeletons.length).toBe(8)
        })
    })

    describe("Empty State", () => {
        it("renders empty state message when exhausted and no results", () => {
            mockUseImageHistoryWithDisplayData.mockReturnValue({
                results: [],
                status: "Exhausted",
                loadMore: mockLoadMore,
            })

            render(<ImageHistory />)

            expect(screen.getByText("No generations yet")).toBeInTheDocument()
            expect(screen.getByText("Your generated images will appear here once you start creating.")).toBeInTheDocument()
            expect(screen.getByAltText("No images")).toBeInTheDocument()
        })
    })

    describe("Content Rendering", () => {
        beforeEach(() => {
            mockUseImageHistoryWithDisplayData.mockReturnValue({
                results: mockImages,
                status: "Exhausted",
                loadMore: mockLoadMore,
            })
        })

        it("renders images with correct details", () => {
            render(<ImageHistory />)

            // Check for images
            expect(screen.getByAltText("A beautiful sunset")).toBeInTheDocument()
            expect(screen.getByAltText("A cute cat")).toBeInTheDocument()

            // Check for prompts
            expect(screen.getByText("A beautiful sunset")).toBeInTheDocument()
            expect(screen.getByText("A cute cat")).toBeInTheDocument()

            // Check for model names (using the mocked getModelDisplayName)
            expect(screen.getByText("Display flux-pro")).toBeInTheDocument()
            expect(screen.getByText("Display stable-diffusion")).toBeInTheDocument()
        })

        it("renders visibility toggle for each image", () => {
            render(<ImageHistory />)

            expect(screen.getByTestId("visibility-toggle-img1")).toBeInTheDocument()
            expect(screen.getByTestId("visibility-toggle-img2")).toBeInTheDocument()
        })
    })

    describe("Load More Functionality", () => {
        it("renders Load More button when status is CanLoadMore", () => {
            mockUseImageHistoryWithDisplayData.mockReturnValue({
                results: mockImages,
                status: "CanLoadMore",
                loadMore: mockLoadMore,
            })

            render(<ImageHistory />)

            const loadMoreBtn = screen.getByRole("button", { name: /load more/i })
            expect(loadMoreBtn).toBeInTheDocument()
            expect(loadMoreBtn).not.toBeDisabled()
        })

        it("calls loadMore when Load More button is clicked", () => {
            mockUseImageHistoryWithDisplayData.mockReturnValue({
                results: mockImages,
                status: "CanLoadMore",
                loadMore: mockLoadMore,
            })

            render(<ImageHistory />)

            const loadMoreBtn = screen.getByRole("button", { name: /load more/i })
            fireEvent.click(loadMoreBtn)

            expect(mockLoadMore).toHaveBeenCalledWith(20)
        })

        it("shows loading state on button when LoadingMore", () => {
            mockUseImageHistoryWithDisplayData.mockReturnValue({
                results: mockImages,
                status: "LoadingMore",
                loadMore: mockLoadMore,
            })

            render(<ImageHistory />)

            const loadMoreBtn = screen.getByRole("button", { name: /loading/i })
            expect(loadMoreBtn).toBeInTheDocument()
            expect(loadMoreBtn).toBeDisabled()
            expect(screen.queryByText("Load More")).not.toBeInTheDocument()
        })

        it("does not render Load More button when Exhausted", () => {
            mockUseImageHistoryWithDisplayData.mockReturnValue({
                results: mockImages,
                status: "Exhausted",
                loadMore: mockLoadMore,
            })

            render(<ImageHistory />)

            expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument()
        })
    })

    describe("Delete Interactions", () => {
        beforeEach(() => {
            mockUseImageHistoryWithDisplayData.mockReturnValue({
                results: mockImages,
                status: "Exhausted",
                loadMore: mockLoadMore,
            })
        })

        it("calls deleteMutation when delete is confirmed", async () => {
            render(<ImageHistory />)

            const deleteButtons = screen.getAllByTestId("delete-dialog-button")
            fireEvent.click(deleteButtons[0]) // Click delete for first image

            expect(mockDeleteMutateAsync).toHaveBeenCalledWith("img1")
        })

        it("disables delete button while deleting", () => {
            mockUseDeleteGeneratedImage.mockReturnValue({
                mutateAsync: mockDeleteMutateAsync,
                isPending: true,
            })

            render(<ImageHistory />)

            const deleteButtons = screen.getAllByTestId("delete-dialog-button")
            expect(deleteButtons[0]).toBeDisabled()
        })
    })
})
