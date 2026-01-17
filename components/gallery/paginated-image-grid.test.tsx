/**
 * @vitest-environment jsdom
 * 
 * Tests for PaginatedImageGrid Component
 */
import { useUser } from "@clerk/nextjs"
import { render, screen, waitFor } from "@testing-library/react"
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

// Mock ResizeObserver
const mockResizeObserve = vi.fn()
const mockResizeDisconnect = vi.fn()

class MockResizeObserver {
    static lastCallback: ResizeObserverCallback | null = null

    constructor(callback: ResizeObserverCallback) {
        MockResizeObserver.lastCallback = callback
    }

    observe = mockResizeObserve
    disconnect = mockResizeDisconnect
    unobserve = vi.fn()
}

// Set up the global mocks
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)
vi.stubGlobal("ResizeObserver", MockResizeObserver)

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
        vi.mocked(useUser).mockReturnValue({ isSignedIn: true } as unknown as ReturnType<typeof useUser>)
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

    describe("Back to Top Button", () => {
        const exhaustedProps = {
            ...defaultProps,
            status: "Exhausted" as const,
        }

        beforeEach(() => {
            mockResizeObserve.mockClear()
            mockResizeDisconnect.mockClear()
            MockResizeObserver.lastCallback = null
        })

        it("shows 'Take me back up' button when exhausted, has images, and page is scrollable beyond threshold", () => {
            // Simulate scrollable page (scrollHeight > innerHeight + 50)
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 2000,
                configurable: true,
            })
            Object.defineProperty(window, "innerHeight", {
                value: 800,
                configurable: true,
            })

            render(<PaginatedImageGrid {...exhaustedProps} />)
            expect(screen.getByRole("button", { name: /take me back up/i })).toBeInTheDocument()
        })

        it("does NOT show 'Take me back up' button if only barely scrollable (below threshold)", () => {
            // Simulate barely scrollable page (scrollHeight = innerHeight + 10)
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 810,
                configurable: true,
            })
            Object.defineProperty(window, "innerHeight", {
                value: 800,
                configurable: true,
            })

            render(<PaginatedImageGrid {...exhaustedProps} />)
            expect(screen.queryByRole("button", { name: /take me back up/i })).not.toBeInTheDocument()
        })

        it("does NOT show 'Take me back up' button when page is NOT scrollable (content fits in viewport)", () => {
            // Simulate non-scrollable page (scrollHeight <= innerHeight)
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 600,
                configurable: true,
            })
            Object.defineProperty(window, "innerHeight", {
                value: 800,
                configurable: true,
            })

            render(<PaginatedImageGrid {...exhaustedProps} />)
            expect(screen.queryByRole("button", { name: /take me back up/i })).not.toBeInTheDocument()
        })

        it("handles feedback loop: hides button if content ONLY scrolls due to the button itself", async () => {
            // 1. Initial state: Page is tall enough to show button
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 1000,
                configurable: true,
            })
            Object.defineProperty(window, "innerHeight", {
                value: 800,
                configurable: true,
            })

            const { rerender } = render(<PaginatedImageGrid {...exhaustedProps} />)

            // Button should be visible
            const button = screen.getByRole("button", { name: /take me back up/i })
            expect(button).toBeInTheDocument()

            // 2. Simulate resize/check where button is present, increasing height
            // Total height = Content (700) + Footer (300) = 1000.
            // Without footer, 700 < 800. So it should hide.

            // Mock offsetHeight for the footer element
            // We need to access the element via the ref, which in JSDOM is the element
            // We can spy on the component internals or just rely on the effect running.
            // But we need to make sure the offsetHeight is readable.

            // In JSDOM, offsetHeight is always 0 unless mocked.
            // We can spy on the element after render?

            // Let's manually trigger the cleanup/update logic via a simulated resize
            // And ensure we mocked offsetHeight on the footer div

            // Since we can't easily access the internal ref, we can't mock offsetHeight 
            // on the exact element easily unless we assume it's the motion.div wrapper.
            // The wrapper has text "You've seen it all!"

            const footer = screen.getByText("You've seen it all!").closest('div')!.parentElement!
            Object.defineProperty(footer, 'offsetHeight', { value: 300, configurable: true })

            // Trigger resize to re-run check
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 1000, // Still 1000 total
                configurable: true,
            })

            // Trigger the resize event
            window.dispatchEvent(new Event('resize'))

            // We wait for the state update
            // Since checkScrollable subtracts footer (300) from 1000 => 700.
            // 700 < 800 (viewport). So isPageScrollable => false.

            // Expect button to disappear
            // Note: in React testing library, state updates are batched. 
            // We might need to wait.

            // Wait for button to be removed
            // Use findBy... which rejects if found? No, waitFor element to NOT be in doc

            // Since the logic relies on ResizeObserver or window resize, and we triggered window resize:

            // Wait for button to be removed
            await waitFor(() => {
                expect(screen.queryByRole("button", { name: /take me back up/i })).not.toBeInTheDocument()
            })
        })

        it("does NOT show the button when status is not Exhausted", () => {
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 2000,
                configurable: true,
            })
            Object.defineProperty(window, "innerHeight", {
                value: 800,
                configurable: true,
            })

            render(<PaginatedImageGrid {...defaultProps} status="CanLoadMore" />)
            expect(screen.queryByRole("button", { name: /take me back up/i })).not.toBeInTheDocument()
        })

        it("does NOT show the button when there are no images", () => {
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 2000,
                configurable: true,
            })
            Object.defineProperty(window, "innerHeight", {
                value: 800,
                configurable: true,
            })

            render(<PaginatedImageGrid {...exhaustedProps} images={[]} />)
            expect(screen.queryByRole("button", { name: /take me back up/i })).not.toBeInTheDocument()
        })

        it("sets up ResizeObserver to detect content height changes", () => {
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 2000,
                configurable: true,
            })
            Object.defineProperty(window, "innerHeight", {
                value: 800,
                configurable: true,
            })

            render(<PaginatedImageGrid {...exhaustedProps} />)
            expect(mockResizeObserve).toHaveBeenCalledWith(document.body)
        })

        it("cleans up ResizeObserver and resize listener on unmount", () => {
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 2000,
                configurable: true,
            })
            Object.defineProperty(window, "innerHeight", {
                value: 800,
                configurable: true,
            })

            const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

            const { unmount } = render(<PaginatedImageGrid {...exhaustedProps} />)
            unmount()

            expect(mockResizeDisconnect).toHaveBeenCalled()
            expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))

            removeEventListenerSpy.mockRestore()
        })
    })
})

