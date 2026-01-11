/**
 * @vitest-environment jsdom
 * 
 * Tests for PaginatedImageGrid Component
 */
import { useUser } from "@clerk/nextjs"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PaginatedImageGrid } from "./paginated-image-grid"

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
const mockUnobserve = vi.fn()

class MockIntersectionObserver {
    static lastCallback: IntersectionObserverCallback | null = null
    static lastOptions: IntersectionObserverInit | undefined = undefined

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        MockIntersectionObserver.lastCallback = callback
        MockIntersectionObserver.lastOptions = options
    }

    observe = mockObserve
    disconnect = mockDisconnect
    unobserve = mockUnobserve
    root = null
    rootMargin = ""
    thresholds = []
    takeRecords = () => []
}

// Set up the global mock
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)

// Mock components
vi.mock("@/components/ui/image-card", () => ({
    ImageCard: vi.fn(({ image, selectionMode, isSelected, onSelectionChange }) => (
        <div data-testid="image-card" data-id={image._id} data-selected={isSelected}>
            {selectionMode && <span>Selection Mode On</span>}
            <button onClick={() => onSelectionChange?.(image._id, !isSelected)}>Toggle</button>
        </div>
    )),
}))

vi.mock("@/components/images/image-lightbox", () => ({
    ImageLightbox: vi.fn(() => <div data-testid="lightbox" />),
}))

vi.mock("@/components/ui/masonry-grid", () => ({
    MasonryGrid: vi.fn(({ children }) => <div>{children}</div>),
}))

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
    useUser: vi.fn(),
}))

// Mock Convex
vi.mock("convex/react", () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn()),
}))

describe("PaginatedImageGrid", () => {
    const mockImages = [
        { _id: "img1", url: "url1", prompt: "p1", model: "m1" },
        { _id: "img2", url: "url2", prompt: "p2", model: "m2" },
    ]

    const defaultProps = {
        images: mockImages,
        status: "CanLoadMore" as const,
        loadMore: vi.fn(),
        selectionMode: false,
        selectedIds: new Set<string>(),
        onSelectionChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useUser).mockReturnValue({ isSignedIn: true } as any)
    })

    it("renders image cards for each image", () => {
        render(<PaginatedImageGrid {...defaultProps} />)
        expect(screen.getAllByTestId("image-card")).toHaveLength(2)
    })

    it("passes selection props correctly to ImageCard", () => {
        const { rerender } = render(
            <PaginatedImageGrid 
                {...defaultProps} 
                selectionMode={true} 
                selectedIds={new Set(["img1"])} 
            />
        )
        
        const cards = screen.getAllByTestId("image-card")
        
        expect(cards[0]).toHaveAttribute("data-selected", "true")
        expect(cards[0]).toHaveTextContent("Selection Mode On")
        
        expect(cards[1]).toHaveAttribute("data-selected", "false")
        expect(cards[1]).toHaveTextContent("Selection Mode On")

        // Rerender with different selection
        rerender(
            <PaginatedImageGrid 
                {...defaultProps} 
                selectionMode={false} 
                selectedIds={new Set()} 
            />
        )
        expect(screen.queryByText("Selection Mode On")).not.toBeInTheDocument()
    })

    it("calls onSelectionChange when requested by ImageCard", () => {
        const onSelectionChange = vi.fn()
        render(<PaginatedImageGrid {...defaultProps} onSelectionChange={onSelectionChange} />)
        
        const buttons = screen.getAllByRole("button", { name: /toggle/i })
        buttons[0].click()
        
        expect(onSelectionChange).toHaveBeenCalledWith("img1", true)
    })

    describe("Infinite Scroll", () => {
        beforeEach(() => {
            mockObserve.mockClear()
            mockDisconnect.mockClear()
            MockIntersectionObserver.lastCallback = null
            MockIntersectionObserver.lastOptions = undefined
        })

        it("renders sentinel element when CanLoadMore", () => {
            render(<PaginatedImageGrid {...defaultProps} status="CanLoadMore" />)
            expect(screen.getByTestId("infinite-scroll-sentinel")).toBeInTheDocument()
        })

        it("renders sentinel element when LoadingMore", () => {
            render(<PaginatedImageGrid {...defaultProps} status="LoadingMore" />)
            expect(screen.getByTestId("infinite-scroll-sentinel")).toBeInTheDocument()
        })

        it("does not render sentinel when Exhausted", () => {
            render(<PaginatedImageGrid {...defaultProps} status="Exhausted" />)
            expect(screen.queryByTestId("infinite-scroll-sentinel")).not.toBeInTheDocument()
        })

        it("shows loading indicator when LoadingMore", () => {
            render(<PaginatedImageGrid {...defaultProps} status="LoadingMore" />)
            expect(screen.getByText("Discovering more...")).toBeInTheDocument()
        })

        it("does not show loading indicator when CanLoadMore", () => {
            render(<PaginatedImageGrid {...defaultProps} status="CanLoadMore" />)
            expect(screen.queryByText("Discovering more...")).not.toBeInTheDocument()
        })

        it("sets up IntersectionObserver with correct options when CanLoadMore", () => {
            render(<PaginatedImageGrid {...defaultProps} status="CanLoadMore" />)
            expect(MockIntersectionObserver.lastOptions).toEqual({
                root: null,
                rootMargin: "0px 0px 400px 0px",
                threshold: 0,
            })
            expect(mockObserve).toHaveBeenCalled()
        })

        it("does not set up IntersectionObserver when LoadingMore", () => {
            render(<PaginatedImageGrid {...defaultProps} status="LoadingMore" />)
            // Observer is not set up when isLoadingMore is true
            expect(mockObserve).not.toHaveBeenCalled()
        })

        it("cleans up IntersectionObserver on unmount", () => {
            const { unmount } = render(<PaginatedImageGrid {...defaultProps} status="CanLoadMore" />)
            unmount()
            expect(mockDisconnect).toHaveBeenCalled()
        })
    })
})

