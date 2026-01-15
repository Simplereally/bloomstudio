/**
 * @vitest-environment jsdom
 *
 * Tests for FeedClient Component
 * 
 * Tests the feed client component which handles both public and following feeds
 * using server-side caching with server actions for pagination.
 */
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { FeedClient } from "./feed-client"

// Mock server actions
const mockLoadPublicFeedPage = vi.fn()
const mockLoadFollowingFeedPage = vi.fn()

vi.mock("@/app/_server/actions/feed", () => ({
    loadPublicFeedPage: (input: { cursor: string | null }) => mockLoadPublicFeedPage(input),
    loadFollowingFeedPage: (input: { cursor: string | null }) => mockLoadFollowingFeedPage(input),
}))

// Mock Clerk auth
const mockUseAuth = vi.fn()
vi.mock("@clerk/nextjs", () => ({
    useAuth: () => mockUseAuth(),
}))

// Mock next/link
vi.mock("next/link", () => ({
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}))

// Mock analytics
vi.mock("@/lib/analytics", () => ({
    trackFeedView: vi.fn(),
}))

// Mock FeedTabs
vi.mock("@/components/gallery/feed-tabs", () => ({
    FeedTabs: ({ activeType }: { activeType: string }) => (
        <div data-testid="feed-tabs" data-active-type={activeType}>Feed Tabs</div>
    ),
}))

// Mock PaginatedImageGrid
vi.mock("@/components/gallery/paginated-image-grid", () => ({
    PaginatedImageGrid: ({ 
        images, 
        status, 
        loadMore, 
        emptyState 
    }: { 
        images: unknown[]
        status: string
        loadMore: () => void
        emptyState: React.ReactNode
    }) => (
        <div data-testid="paginated-image-grid">
            <div data-testid="grid-status">{status}</div>
            <div data-testid="grid-count">{images.length}</div>
            {images.length === 0 && emptyState}
            <button onClick={loadMore} data-testid="load-more-btn">Load More</button>
        </div>
    ),
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    ImageOffIcon: () => <span data-testid="image-off-icon">📷</span>,
    ScanSearch: () => <span data-testid="scan-search-icon">🔍</span>,
}))

describe("FeedClient", () => {
    // Mock initial page data
    const mockInitialPage = {
        page: [
            { _id: "img1", url: "https://example.com/1.jpg" },
            { _id: "img2", url: "https://example.com/2.jpg" },
        ],
        continueCursor: "cursor123",
        isDone: false,
    }

    const mockSecondPage = {
        page: [
            { _id: "img3", url: "https://example.com/3.jpg" },
            { _id: "img4", url: "https://example.com/4.jpg" },
        ],
        continueCursor: "cursor456",
        isDone: false,
    }

    const mockFinalPage = {
        page: [
            { _id: "img5", url: "https://example.com/5.jpg" },
        ],
        continueCursor: null,
        isDone: true,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.mockReturnValue({ isSignedIn: true, isLoaded: true })
        mockLoadPublicFeedPage.mockResolvedValue(mockSecondPage)
        mockLoadFollowingFeedPage.mockResolvedValue(mockSecondPage)
    })

    describe("rendering", () => {
        it("renders FeedTabs with correct active type for public feed", () => {
            render(<FeedClient feedType="public" initialPage={mockInitialPage} />)
            
            const tabs = screen.getByTestId("feed-tabs")
            expect(tabs).toHaveAttribute("data-active-type", "public")
        })

        it("renders FeedTabs with correct active type for following feed", () => {
            render(<FeedClient feedType="following" initialPage={mockInitialPage} />)
            
            const tabs = screen.getByTestId("feed-tabs")
            expect(tabs).toHaveAttribute("data-active-type", "following")
        })

        it("renders PaginatedImageGrid with initial page data", () => {
            render(<FeedClient feedType="public" initialPage={mockInitialPage} />)
            
            expect(screen.getByTestId("grid-count")).toHaveTextContent("2")
            expect(screen.getByTestId("grid-status")).toHaveTextContent("CanLoadMore")
        })

        it("renders with empty state when no initial page provided", () => {
            render(<FeedClient feedType="public" />)
            
            expect(screen.getByTestId("grid-count")).toHaveTextContent("0")
        })
    })

    describe("public feed", () => {
        it("shows public empty state when feed is empty", () => {
            render(<FeedClient feedType="public" initialPage={{ page: [], continueCursor: null, isDone: true }} />)
            
            expect(screen.getByText("Feed is quiet...")).toBeInTheDocument()
            expect(screen.getByText("Go to Studio")).toBeInTheDocument()
        })

        it("calls loadPublicFeedPage when loading more", async () => {
            const user = userEvent.setup()
            render(<FeedClient feedType="public" initialPage={mockInitialPage} />)
            
            await user.click(screen.getByTestId("load-more-btn"))
            
            await waitFor(() => {
                expect(mockLoadPublicFeedPage).toHaveBeenCalledWith({ cursor: "cursor123" })
            })
        })

        it("appends new items when load more succeeds", async () => {
            const user = userEvent.setup()
            render(<FeedClient feedType="public" initialPage={mockInitialPage} />)
            
            expect(screen.getByTestId("grid-count")).toHaveTextContent("2")
            
            await user.click(screen.getByTestId("load-more-btn"))
            
            await waitFor(() => {
                expect(screen.getByTestId("grid-count")).toHaveTextContent("4")
            })
        })

        it("sets status to Exhausted when isDone is true", async () => {
            mockLoadPublicFeedPage.mockResolvedValue(mockFinalPage)
            const user = userEvent.setup()
            render(<FeedClient feedType="public" initialPage={mockInitialPage} />)
            
            await user.click(screen.getByTestId("load-more-btn"))
            
            await waitFor(() => {
                expect(screen.getByTestId("grid-status")).toHaveTextContent("Exhausted")
            })
        })
    })

    describe("following feed", () => {
        it("shows following empty state when feed is empty", () => {
            render(<FeedClient feedType="following" initialPage={{ page: [], continueCursor: null, isDone: true }} />)
            
            expect(screen.getByText("No posts yet")).toBeInTheDocument()
            expect(screen.getByText("Browse Public Feed")).toBeInTheDocument()
        })

        it("calls loadFollowingFeedPage when loading more", async () => {
            const user = userEvent.setup()
            render(<FeedClient feedType="following" initialPage={mockInitialPage} />)
            
            await user.click(screen.getByTestId("load-more-btn"))
            
            await waitFor(() => {
                expect(mockLoadFollowingFeedPage).toHaveBeenCalledWith({ cursor: "cursor123" })
            })
        })

        it("appends new items when load more succeeds", async () => {
            const user = userEvent.setup()
            render(<FeedClient feedType="following" initialPage={mockInitialPage} />)
            
            expect(screen.getByTestId("grid-count")).toHaveTextContent("2")
            
            await user.click(screen.getByTestId("load-more-btn"))
            
            await waitFor(() => {
                expect(screen.getByTestId("grid-count")).toHaveTextContent("4")
            })
        })
    })

    describe("state management", () => {
        it("resets state when feedType changes", () => {
            const { rerender } = render(
                <FeedClient feedType="public" initialPage={mockInitialPage} />
            )
            
            expect(screen.getByTestId("grid-count")).toHaveTextContent("2")
            
            const newInitialPage = {
                page: [{ _id: "following1" }],
                continueCursor: "followCursor",
                isDone: false,
            }
            
            rerender(<FeedClient feedType="following" initialPage={newInitialPage} />)
            
            expect(screen.getByTestId("grid-count")).toHaveTextContent("1")
        })

        it("resets state when initialPage changes", () => {
            const { rerender } = render(
                <FeedClient feedType="public" initialPage={mockInitialPage} />
            )
            
            expect(screen.getByTestId("grid-count")).toHaveTextContent("2")
            
            const newInitialPage = {
                page: [{ _id: "new1" }, { _id: "new2" }, { _id: "new3" }],
                continueCursor: "newCursor",
                isDone: false,
            }
            
            rerender(<FeedClient feedType="public" initialPage={newInitialPage} />)
            
            expect(screen.getByTestId("grid-count")).toHaveTextContent("3")
        })

        it("does not call load more when already loading", async () => {
            // Make the server action slow
            mockLoadPublicFeedPage.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve(mockSecondPage), 100))
            )
            
            const user = userEvent.setup()
            render(<FeedClient feedType="public" initialPage={mockInitialPage} />)
            
            // Click load more twice quickly
            await user.click(screen.getByTestId("load-more-btn"))
            await user.click(screen.getByTestId("load-more-btn"))
            
            // Should only be called once
            expect(mockLoadPublicFeedPage).toHaveBeenCalledTimes(1)
        })

        it("does not call load more when isDone is true", async () => {
            const doneInitialPage = {
                page: mockInitialPage.page,
                continueCursor: null,
                isDone: true,
            }
            
            const user = userEvent.setup()
            render(<FeedClient feedType="public" initialPage={doneInitialPage} />)
            
            await user.click(screen.getByTestId("load-more-btn"))
            
            expect(mockLoadPublicFeedPage).not.toHaveBeenCalled()
        })

        it("does not call load more when cursor is null", async () => {
            const noCursorPage = {
                page: mockInitialPage.page,
                continueCursor: null,
                isDone: false,
            }
            
            const user = userEvent.setup()
            render(<FeedClient feedType="public" initialPage={noCursorPage} />)
            
            await user.click(screen.getByTestId("load-more-btn"))
            
            expect(mockLoadPublicFeedPage).not.toHaveBeenCalled()
        })
    })

    describe("error handling", () => {
        it("handles load more error gracefully", async () => {
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
            mockLoadPublicFeedPage.mockRejectedValue(new Error("Network error"))
            
            const user = userEvent.setup()
            render(<FeedClient feedType="public" initialPage={mockInitialPage} />)
            
            await user.click(screen.getByTestId("load-more-btn"))
            
            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith("Failed to load more:", expect.any(Error))
            })
            
            // Items should remain unchanged
            expect(screen.getByTestId("grid-count")).toHaveTextContent("2")
            // Status should return to CanLoadMore
            expect(screen.getByTestId("grid-status")).toHaveTextContent("CanLoadMore")
            
            consoleError.mockRestore()
        })
    })

    describe("auto-load behavior", () => {
        it("auto-loads more when initial page is empty but not done", async () => {
            const emptyButNotDone = {
                page: [],
                continueCursor: "cursor123",
                isDone: false,
            }
            
            render(<FeedClient feedType="public" initialPage={emptyButNotDone} />)
            
            await waitFor(() => {
                expect(mockLoadPublicFeedPage).toHaveBeenCalledWith({ cursor: "cursor123" })
            })
        })

        it("does not auto-load when initial page has items", () => {
            render(<FeedClient feedType="public" initialPage={mockInitialPage} />)
            
            // Should not auto-load since we have items
            expect(mockLoadPublicFeedPage).not.toHaveBeenCalled()
        })

        it("does not auto-load when isDone is true", () => {
            const emptyAndDone = {
                page: [],
                continueCursor: null,
                isDone: true,
            }
            
            render(<FeedClient feedType="public" initialPage={emptyAndDone} />)
            
            expect(mockLoadPublicFeedPage).not.toHaveBeenCalled()
        })
    })

    describe("empty states", () => {
        it("public empty state links to studio", () => {
            render(<FeedClient feedType="public" initialPage={{ page: [], continueCursor: null, isDone: true }} />)
            
            const studioLink = screen.getByText("Go to Studio").closest("a")
            expect(studioLink).toHaveAttribute("href", "/studio")
        })

        it("following empty state links to public feed", () => {
            render(<FeedClient feedType="following" initialPage={{ page: [], continueCursor: null, isDone: true }} />)
            
            const publicFeedLink = screen.getByText("Browse Public Feed").closest("a")
            expect(publicFeedLink).toHaveAttribute("href", "/feed/public")
        })
    })
})
