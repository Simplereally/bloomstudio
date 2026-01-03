import type { GeneratedImage } from "@/types/pollinations"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ImageGallery } from "./image-gallery"

// Optimize: Mock the heavy GalleryThumbnail component
// This saves ~3s per run by avoiding rendering complex child components (Image, Tooltips, etc.)
vi.mock("./gallery-thumbnail", () => ({
    GalleryThumbnail: ({ isActive, onClick }: any) => (
        <div data-testid="gallery-thumbnail" onClick={onClick}>
            {isActive && <div data-testid="active-indicator" />}
        </div>
    ),
}))

const mockImages: GeneratedImage[] = [
    {
        id: "1",
        url: "https://example.com/image1.jpg",
        prompt: "First image",
        params: {
            prompt: "First image",
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
    },
    {
        id: "2",
        url: "https://example.com/image2.jpg",
        prompt: "Second image",
        params: {
            prompt: "Second image",
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
        timestamp: Date.now() - 1000,
    },
    {
        id: "3",
        url: "https://example.com/image3.jpg",
        prompt: "Third image",
        params: {
            prompt: "Third image",
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
        timestamp: Date.now() - 2000,
    },
]

describe("ImageGallery", () => {
    describe("rendering", () => {
        it("renders the gallery when images exist", () => {
            render(<ImageGallery images={mockImages} />)

            expect(screen.getByTestId("image-gallery")).toBeInTheDocument()
            expect(screen.getByTestId("gallery-grid")).toBeInTheDocument()
        })

        it("shows empty state when no images and isExhausted", () => {
            render(<ImageGallery images={[]} isExhausted={true} />)

            expect(screen.getByTestId("gallery-empty")).toBeInTheDocument()
            expect(screen.getByText("No images found")).toBeInTheDocument()
        })

        it("does not show empty state when images array is empty but not exhausted", () => {
            render(<ImageGallery images={[]} isExhausted={false} />)

            expect(screen.queryByTestId("gallery-empty")).not.toBeInTheDocument()
        })

        it("shows loading state when isLoading is true", () => {
            render(<ImageGallery images={[]} isLoading={true} />)

            expect(screen.getByTestId("gallery-loading")).toBeInTheDocument()
        })

        it("displays image count in header", () => {
            render(<ImageGallery images={mockImages} />)

            expect(screen.getByText("History (3)")).toBeInTheDocument()
        })

        it("renders thumbnails for all images", () => {
            render(<ImageGallery images={mockImages} />)

            expect(screen.getAllByTestId("gallery-thumbnail")).toHaveLength(3)
        })

        it("applies custom className", () => {
            render(<ImageGallery images={mockImages} className="custom-class" />)

            expect(screen.getByTestId("image-gallery")).toHaveClass("custom-class")
        })
    })

    describe("image selection", () => {
        it("calls onSelectImage when thumbnail is clicked", async () => {
            const onSelectImage = vi.fn()
            render(<ImageGallery images={mockImages} onSelectImage={onSelectImage} />)

            const thumbnails = screen.getAllByTestId("gallery-thumbnail")
            await userEvent.click(thumbnails[0])
            expect(onSelectImage).toHaveBeenCalledWith(mockImages[0])
        })

        it("marks active image", () => {
            render(<ImageGallery images={mockImages} activeImageId="2" />)

            // The active thumbnail should have the active indicator
            expect(screen.getByTestId("active-indicator")).toBeInTheDocument()
        })
    })

    describe("selection mode", () => {
        it("shows selection toggle button when handler provided", () => {
            render(
                <ImageGallery images={mockImages} onToggleSelectionMode={vi.fn()} />
            )

            expect(screen.getByTestId("toggle-selection")).toBeInTheDocument()
        })

        it("calls onToggleSelectionMode when toggle button clicked", async () => {
            const onToggleSelectionMode = vi.fn()
            render(
                <ImageGallery
                    images={mockImages}
                    onToggleSelectionMode={onToggleSelectionMode}
                />
            )

            await userEvent.click(screen.getByTestId("toggle-selection"))
            expect(onToggleSelectionMode).toHaveBeenCalledTimes(1)
        })

        it("shows select all button in selection mode", () => {
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    onToggleSelectionMode={vi.fn()}
                />
            )

            expect(screen.getByTestId("select-all")).toBeInTheDocument()
        })

        it("calls onSelectionChange with all image IDs when select all clicked", async () => {
            const onSelectionChange = vi.fn()
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    selectedIds={new Set()}
                    onSelectionChange={onSelectionChange}
                    onToggleSelectionMode={vi.fn()}
                />
            )

            await userEvent.click(screen.getByTestId("select-all"))
            expect(onSelectionChange).toHaveBeenCalledWith(new Set(["1", "2", "3"]))
        })

        it("calls onSelectionChange with empty set when deselect all clicked", async () => {
            const onSelectionChange = vi.fn()
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    selectedIds={new Set(["1", "2", "3"])}
                    onSelectionChange={onSelectionChange}
                    onToggleSelectionMode={vi.fn()}
                />
            )

            // When all are selected, clicking select-all should deselect all
            await userEvent.click(screen.getByTestId("select-all"))
            expect(onSelectionChange).toHaveBeenCalledWith(new Set())
        })

        it("disables selection toggle when no images", () => {
            render(
                <ImageGallery
                    images={[]}
                    isExhausted={true}
                    selectionMode={false}
                    onToggleSelectionMode={vi.fn()}
                />
            )

            expect(screen.getByTestId("toggle-selection")).toBeDisabled()
        })
    })

    describe("bulk actions dropdown", () => {
        it("shows bulk actions dropdown when items are selected", async () => {
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    selectedIds={new Set(["1", "2"])}
                    onDeleteSelected={vi.fn()}
                    onToggleSelectionMode={vi.fn()}
                />
            )

            expect(screen.getByTestId("bulk-actions-menu")).toBeInTheDocument()
            expect(screen.getByText("Actions (2)")).toBeInTheDocument()
        })

        it("does not show bulk actions dropdown when no items selected", () => {
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    selectedIds={new Set()}
                    onDeleteSelected={vi.fn()}
                    onToggleSelectionMode={vi.fn()}
                />
            )

            expect(screen.queryByTestId("bulk-actions-menu")).not.toBeInTheDocument()
        })

        it("calls onDeleteSelected when delete option clicked", async () => {
            const user = userEvent.setup()
            const onDeleteSelected = vi.fn()
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    selectedIds={new Set(["1"])}
                    onDeleteSelected={onDeleteSelected}
                    onToggleSelectionMode={vi.fn()}
                />
            )

            // Open dropdown
            await user.click(screen.getByTestId("bulk-actions-menu"))
            
            // Click delete option
            await user.click(screen.getByTestId("delete-selected"))
            expect(onDeleteSelected).toHaveBeenCalledTimes(1)
        })

        it("calls onMakeSelectedPublic when make public option clicked", async () => {
            const user = userEvent.setup()
            const onMakeSelectedPublic = vi.fn()
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    selectedIds={new Set(["1", "2"])}
                    onMakeSelectedPublic={onMakeSelectedPublic}
                    onToggleSelectionMode={vi.fn()}
                />
            )

            // Open dropdown
            await user.click(screen.getByTestId("bulk-actions-menu"))
            
            // Click make public option
            await user.click(screen.getByTestId("make-public"))
            expect(onMakeSelectedPublic).toHaveBeenCalledTimes(1)
        })

        it("calls onMakeSelectedPrivate when make private option clicked", async () => {
            const user = userEvent.setup()
            const onMakeSelectedPrivate = vi.fn()
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    selectedIds={new Set(["1", "2"])}
                    onMakeSelectedPrivate={onMakeSelectedPrivate}
                    onToggleSelectionMode={vi.fn()}
                />
            )

            // Open dropdown
            await user.click(screen.getByTestId("bulk-actions-menu"))
            
            // Click make private option
            await user.click(screen.getByTestId("make-private"))
            expect(onMakeSelectedPrivate).toHaveBeenCalledTimes(1)
        })

        it("shows make public option only when handler is provided", async () => {
            const user = userEvent.setup()
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    selectedIds={new Set(["1"])}
                    onDeleteSelected={vi.fn()}
                    onToggleSelectionMode={vi.fn()}
                    // No onMakeSelectedPublic provided
                />
            )

            await user.click(screen.getByTestId("bulk-actions-menu"))
            expect(screen.queryByTestId("make-public")).not.toBeInTheDocument()
        })

        it("shows make private option only when handler is provided", async () => {
            const user = userEvent.setup()
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    selectedIds={new Set(["1"])}
                    onDeleteSelected={vi.fn()}
                    onToggleSelectionMode={vi.fn()}
                    // No onMakeSelectedPrivate provided
                />
            )

            await user.click(screen.getByTestId("bulk-actions-menu"))
            expect(screen.queryByTestId("make-private")).not.toBeInTheDocument()
        })

        it("shows all bulk actions when all handlers provided", async () => {
            const user = userEvent.setup()
            render(
                <ImageGallery
                    images={mockImages}
                    selectionMode={true}
                    selectedIds={new Set(["1"])}
                    onDeleteSelected={vi.fn()}
                    onMakeSelectedPublic={vi.fn()}
                    onMakeSelectedPrivate={vi.fn()}
                    onToggleSelectionMode={vi.fn()}
                />
            )

            await user.click(screen.getByTestId("bulk-actions-menu"))
            expect(screen.getByTestId("make-public")).toBeInTheDocument()
            expect(screen.getByTestId("make-private")).toBeInTheDocument()
            expect(screen.getByTestId("delete-selected")).toBeInTheDocument()
        })
    })

    describe("load more", () => {
        it("shows load more button when onLoadMore is provided", () => {
            render(
                <ImageGallery
                    images={mockImages}
                    onLoadMore={vi.fn()}
                />
            )

            expect(screen.getByText("Load More")).toBeInTheDocument()
        })

        it("calls onLoadMore when load more button clicked", async () => {
            const onLoadMore = vi.fn()
            render(
                <ImageGallery
                    images={mockImages}
                    onLoadMore={onLoadMore}
                />
            )

            await userEvent.click(screen.getByText("Load More"))
            expect(onLoadMore).toHaveBeenCalledTimes(1)
        })

        it("disables load more button when isLoadingMore is true", () => {
            render(
                <ImageGallery
                    images={mockImages}
                    onLoadMore={vi.fn()}
                    isLoadingMore={true}
                />
            )

            expect(screen.getByText("Load More")).toBeDisabled()
        })
    })
})
