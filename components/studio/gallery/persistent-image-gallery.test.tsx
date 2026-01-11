import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PersistentImageGallery } from "./persistent-image-gallery"
import { useSetBulkVisibility } from "@/hooks/mutations/use-set-visibility"
import { useBulkDeleteGeneratedImages } from "@/hooks/mutations/use-delete-image"
import { useImageHistory } from "@/hooks/queries/use-image-history"
import type { Id } from "@/convex/_generated/dataModel"

// Mock the hooks
vi.mock("@/hooks/mutations/use-set-visibility", () => ({
    useSetBulkVisibility: vi.fn(),
}))

vi.mock("@/hooks/mutations/use-delete-image", () => ({
    useBulkDeleteGeneratedImages: vi.fn(),
}))

vi.mock("@/hooks/queries/use-image-history", () => ({
    useImageHistory: vi.fn(),
}))

vi.mock("@/components/gallery/history-filters", () => ({
    HistoryFiltersDropdown: () => <div data-testid="history-filters-dropdown" />,
    ActiveFilterBadges: () => <div data-testid="active-filter-badges" />,
}))

vi.mock("@clerk/nextjs", () => ({
    useUser: () => ({ user: { id: "test-user-id" } }),
}))

const mockConvexImages = [
    {
        _id: "conv123" as Id<"generatedImages">,
        _creationTime: Date.now(),
        ownerId: "user1",
        visibility: "public" as const,
        r2Key: "key1",
        url: "https://example.com/image1.jpg",
        filename: "image1.jpg",
        contentType: "image/jpeg",
        sizeBytes: 1000,
        width: 1024,
        height: 1024,
        prompt: "First image",
        model: "flux",
        createdAt: Date.now(),
        generationParams: {
            prompt: "First image",
            width: 1024,
            height: 1024,
            model: "flux",
        },
    },
    {
        _id: "conv456" as Id<"generatedImages">,
        _creationTime: Date.now() - 1000,
        ownerId: "user1",
        visibility: "unlisted" as const,
        r2Key: "key2",
        url: "https://example.com/image2.jpg",
        filename: "image2.jpg",
        contentType: "image/jpeg",
        sizeBytes: 2000,
        width: 1024,
        height: 1024,
        prompt: "Second image",
        model: "flux",
        createdAt: Date.now() - 1000,
        generationParams: {
            prompt: "Second image",
            width: 1024,
            height: 1024,
            model: "flux",
        },
    },
]

describe("PersistentImageGallery", () => {
    let mockVisibilityMutateAsync: Mock
    let mockBulkDeleteMutateAsync: Mock

    beforeEach(() => {
        vi.clearAllMocks()

        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            },
            writable: true,
        })

        mockVisibilityMutateAsync = vi.fn().mockResolvedValue({ success: true, successCount: 1 })
        mockBulkDeleteMutateAsync = vi.fn().mockResolvedValue({ success: true, successCount: 2 })

            ; (useSetBulkVisibility as Mock).mockReturnValue({
                mutateAsync: mockVisibilityMutateAsync,
            })

            ; (useBulkDeleteGeneratedImages as Mock).mockReturnValue({
                mutateAsync: mockBulkDeleteMutateAsync,
            })

            ; (useImageHistory as Mock).mockReturnValue({
                results: mockConvexImages,
                status: "Exhausted",
                loadMore: vi.fn(),
            })
    })

    describe("rendering", () => {
        it("renders the gallery with images from history", () => {
            render(<PersistentImageGallery />)

            expect(screen.getByTestId("image-gallery")).toBeInTheDocument()
            expect(screen.getAllByTestId("gallery-thumbnail")).toHaveLength(2)
        })

        it("renders filter controls", () => {
            render(<PersistentImageGallery />)

            expect(screen.getByTestId("history-filters-dropdown")).toBeInTheDocument()
            expect(screen.getByTestId("active-filter-badges")).toBeInTheDocument()
        })

        it("shows loading state when loading first page", () => {
            ; (useImageHistory as Mock).mockReturnValue({
                results: [],
                status: "LoadingFirstPage",
                loadMore: vi.fn(),
            })

            render(<PersistentImageGallery />)

            expect(screen.getByTestId("gallery-loading")).toBeInTheDocument()
        })

        it("shows empty state when exhausted with no results", () => {
            ; (useImageHistory as Mock).mockReturnValue({
                results: [],
                status: "Exhausted",
                loadMore: vi.fn(),
            })

            render(<PersistentImageGallery />)

            expect(screen.getByTestId("gallery-empty")).toBeInTheDocument()
        })
    })

    describe("bulk visibility actions", () => {
        it("calls setBulkVisibility with public when make public clicked", async () => {
            const user = userEvent.setup()

            render(<PersistentImageGallery />)

            // Enter selection mode
            await user.click(screen.getByTestId("toggle-selection"))

            // Select items by clicking thumbnails (whole card toggles selection in selection mode)
            const thumbnails = screen.getAllByTestId("gallery-thumbnail")
            await user.click(thumbnails[0])
            await user.click(thumbnails[1])

            // Open bulk actions menu
            await user.click(screen.getByTestId("bulk-actions-menu"))

            // Click make public
            await user.click(screen.getByTestId("make-public"))

            await waitFor(() => {
                expect(mockVisibilityMutateAsync).toHaveBeenCalledWith({
                    imageIds: expect.arrayContaining(["conv123", "conv456"]),
                    visibility: "public",
                })
            })
        })

        it("calls setBulkVisibility with unlisted when make private clicked", async () => {
            const user = userEvent.setup()

            render(<PersistentImageGallery />)

            // Enter selection mode
            await user.click(screen.getByTestId("toggle-selection"))

            // Select first item by clicking thumbnail
            const thumbnails = screen.getAllByTestId("gallery-thumbnail")
            await user.click(thumbnails[0])

            // Open bulk actions menu
            await user.click(screen.getByTestId("bulk-actions-menu"))

            // Click make private
            await user.click(screen.getByTestId("make-private"))

            await waitFor(() => {
                expect(mockVisibilityMutateAsync).toHaveBeenCalledWith({
                    imageIds: ["conv123"],
                    visibility: "unlisted",
                })
            })
        })

        it("clears selection after successful visibility change", async () => {
            const user = userEvent.setup()

            render(<PersistentImageGallery />)

            // Enter selection mode
            await user.click(screen.getByTestId("toggle-selection"))

            // Select first item by clicking thumbnail
            const thumbnails = screen.getAllByTestId("gallery-thumbnail")
            await user.click(thumbnails[0])

            // Verify item is selected (label shows selection count)
            expect(screen.getByText("1 selected")).toBeInTheDocument()

            // Open bulk actions menu
            await user.click(screen.getByTestId("bulk-actions-menu"))

            // Click make public
            await user.click(screen.getByTestId("make-public"))

            // After action, selection should be cleared and mode exited
            await waitFor(() => {
                expect(screen.queryByText("1 selected")).not.toBeInTheDocument()
            })
        })

        it("disables bulk actions menu when no items selected", async () => {
            const user = userEvent.setup()

            render(<PersistentImageGallery />)

            // Enter selection mode
            await user.click(screen.getByTestId("toggle-selection"))

            // Bulk actions menu should be present but disabled when nothing is selected
            expect(screen.getByTestId("bulk-actions-menu")).toBeInTheDocument()
            expect(screen.getByTestId("bulk-actions-menu")).toBeDisabled()
        })

        it("handles mutation error gracefully", async () => {
            const user = userEvent.setup()
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { })
            mockVisibilityMutateAsync.mockRejectedValueOnce(new Error("Network error"))

            render(<PersistentImageGallery />)

            // Enter selection mode
            await user.click(screen.getByTestId("toggle-selection"))

            // Select first item by clicking thumbnail
            const thumbnails = screen.getAllByTestId("gallery-thumbnail")
            await user.click(thumbnails[0])

            // Open bulk actions menu
            await user.click(screen.getByTestId("bulk-actions-menu"))

            // Click make public
            await user.click(screen.getByTestId("make-public"))

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    "Failed to make images public:",
                    expect.any(Error)
                )
            })

            consoleSpy.mockRestore()
        })
    })

    describe("bulk delete actions", () => {
        it("calls bulkDeleteMutation with all selected image IDs", async () => {
            const user = userEvent.setup()

            render(<PersistentImageGallery />)

            // Enter selection mode
            await user.click(screen.getByTestId("toggle-selection"))

            // Select both items
            const thumbnails = screen.getAllByTestId("gallery-thumbnail")
            await user.click(thumbnails[0])
            await user.click(thumbnails[1])

            // Verify 2 items are selected
            expect(screen.getByText("2 selected")).toBeInTheDocument()

            // Open bulk actions menu and click delete
            await user.click(screen.getByTestId("bulk-actions-menu"))
            await user.click(screen.getByTestId("delete-selected"))

            await waitFor(() => {
                // Should call with array of all selected IDs
                expect(mockBulkDeleteMutateAsync).toHaveBeenCalledTimes(1)
                expect(mockBulkDeleteMutateAsync).toHaveBeenCalledWith(
                    expect.arrayContaining(["conv123", "conv456"])
                )
            })
        })

        it("clears selection and exits selection mode after successful delete", async () => {
            const user = userEvent.setup()

            render(<PersistentImageGallery />)

            // Enter selection mode and select an item
            await user.click(screen.getByTestId("toggle-selection"))
            const thumbnails = screen.getAllByTestId("gallery-thumbnail")
            await user.click(thumbnails[0])

            expect(screen.getByText("1 selected")).toBeInTheDocument()

            // Open bulk actions menu and delete
            await user.click(screen.getByTestId("bulk-actions-menu"))
            await user.click(screen.getByTestId("delete-selected"))

            // After action, selection should be cleared
            await waitFor(() => {
                expect(screen.queryByText("1 selected")).not.toBeInTheDocument()
            })
        })

        it("handles bulk delete error gracefully", async () => {
            const user = userEvent.setup()
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { })
            mockBulkDeleteMutateAsync.mockRejectedValueOnce(new Error("Delete failed"))

            render(<PersistentImageGallery />)

            // Enter selection mode and select an item
            await user.click(screen.getByTestId("toggle-selection"))
            const thumbnails = screen.getAllByTestId("gallery-thumbnail")
            await user.click(thumbnails[0])

            // Open bulk actions menu and delete
            await user.click(screen.getByTestId("bulk-actions-menu"))
            await user.click(screen.getByTestId("delete-selected"))

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    "Failed to delete images:",
                    expect.any(Error)
                )
            })

            consoleSpy.mockRestore()
        })

        it("does not call delete when no items are selected", async () => {
            const user = userEvent.setup()

            render(<PersistentImageGallery />)

            // Enter selection mode but don't select anything
            await user.click(screen.getByTestId("toggle-selection"))

            // Bulk actions menu should be disabled
            expect(screen.getByTestId("bulk-actions-menu")).toBeDisabled()

            // Mutation should not have been called
            expect(mockBulkDeleteMutateAsync).not.toHaveBeenCalled()
        })
    })

    describe("image mapping", () => {
        it("maps _id to id for component compatibility", async () => {
            const onSelectImage = vi.fn()

            render(
                <PersistentImageGallery
                    onSelectImage={onSelectImage}
                />
            )

            const thumbnails = screen.getAllByTestId("gallery-thumbnail")
            await userEvent.click(thumbnails[0])

            // The image passed to onSelectImage should have id equal to _id
            expect(onSelectImage).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "conv123",
                    _id: "conv123",
                    contentType: "image/jpeg",
                })
            )
        })
    })

    describe("pagination", () => {
        it("shows infinite scroll sentinel when canLoadMore", () => {
            ; (useImageHistory as Mock).mockReturnValue({
                results: mockConvexImages,
                status: "CanLoadMore",
                loadMore: vi.fn(),
            })

            render(<PersistentImageGallery />)

            expect(screen.getByTestId("load-more-sentinel")).toBeInTheDocument()
        })

        it("hides sentinel when exhausted", () => {
            ; (useImageHistory as Mock).mockReturnValue({
                results: mockConvexImages,
                status: "Exhausted",
                loadMore: vi.fn(),
            })

            render(<PersistentImageGallery />)

            expect(screen.queryByTestId("load-more-sentinel")).not.toBeInTheDocument()
        })

        it("shows loading spinner in sentinel when loading more", () => {
            ; (useImageHistory as Mock).mockReturnValue({
                results: mockConvexImages,
                status: "LoadingMore",
                loadMore: vi.fn(),
            })

            render(<PersistentImageGallery />)
            
            expect(screen.getByTestId("load-more-sentinel")).toBeInTheDocument()
            expect(screen.getByTestId("loading-spinner")).toBeInTheDocument()
        })

        it("automatically calls loadMore when results are empty but more pages exist (greedy fetch)", () => {
            const mockLoadMore = vi.fn()
                ; (useImageHistory as Mock).mockReturnValue({
                    results: [],
                    status: "CanLoadMore",
                    loadMore: mockLoadMore,
                })

            render(<PersistentImageGallery />)

            expect(mockLoadMore).toHaveBeenCalledWith(20)
        })
    })
})
