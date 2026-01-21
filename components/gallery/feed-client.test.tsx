/**
 * @vitest-environment jsdom
 *
 * Tests for FeedClient Component
 *
 * Tests the feed client component which handles both public and following feeds
 * using server-side caching with server actions for pagination.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedClient } from "./feed-client";
import type { loadPublicFeedPage } from "@/app/_server/actions/feed";
import type { Id } from "@/convex/_generated/dataModel";

type PaginatedFeedResult = Awaited<ReturnType<typeof loadPublicFeedPage>>;
type FeedImage = PaginatedFeedResult["page"][number];

function createGeneratedImageId(value: string): Id<"generatedImages"> {
  return value as unknown as Id<"generatedImages">;
}

function makeFeedImage(id: string, url: string): FeedImage {
  return {
    _id: createGeneratedImageId(id),
    _creationTime: Date.now(),
    url,
    originalUrl: url,
    visibility: "public",
    createdAt: Date.now(),
    model: "test-model",
    prompt: "test prompt",
    width: 1024,
    height: 1024,
    seed: 123,
    contentType: "image/jpeg",
    ownerName: "Test User",
    ownerPictureUrl: null,
    isSensitive: false,
  };
}

// Mock server actions
const mockLoadPublicFeedPage = vi.fn();
const mockLoadFollowingFeedPage = vi.fn();

vi.mock("@/app/_server/actions/feed", () => ({
  loadPublicFeedPage: (input: { cursor: string | null; filterPreference?: string }) => mockLoadPublicFeedPage(input),
  loadFollowingFeedPage: (input: { cursor: string | null }) => mockLoadFollowingFeedPage(input),
}));

// Mock Convex
const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: (args: unknown) => mockUseQuery(args),
}));

// Mock API
vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      getSensitiveContentPreference: "users:getSensitiveContentPreference",
    },
  },
}));

// Mock Clerk auth
const mockUseAuth = vi.fn();
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock analytics
vi.mock("@/lib/analytics", () => ({
  trackFeedView: vi.fn(),
}));

// Mock FeedTabs
vi.mock("@/components/gallery/feed-tabs", () => ({
  FeedTabs: ({ activeType }: { activeType: string }) => (
    <div data-testid="feed-tabs" data-active-type={activeType}>
      Feed Tabs
    </div>
  ),
}));

// Mock PaginatedImageGrid
vi.mock("@/components/gallery/paginated-image-grid", () => ({
  PaginatedImageGrid: ({
    images,
    status,
    loadMore,
    emptyState,
    userShowsSensitive,
  }: {
    images: unknown[];
    status: string;
    loadMore: () => void;
    emptyState: React.ReactNode;
    userShowsSensitive?: boolean;
  }) => (
    <div data-testid="paginated-image-grid" data-user-shows-sensitive={userShowsSensitive?.toString()}>
      <div data-testid="grid-status">{status}</div>
      <div data-testid="grid-count">{images.length}</div>
      {images.length === 0 && emptyState}
      <button onClick={loadMore} data-testid="load-more-btn">
        Load More
      </button>
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ImageOffIcon: () => <span data-testid="image-off-icon">📷</span>,
  ScanSearch: () => <span data-testid="scan-search-icon">🔍</span>,
}));

describe("FeedClient", () => {
  // Mock initial page data
  const mockInitialPage: PaginatedFeedResult = {
    page: [makeFeedImage("img1", "https://example.com/1.jpg"), makeFeedImage("img2", "https://example.com/2.jpg")],
    continueCursor: "cursor123",
    isDone: false,
  };

  const mockSecondPage: PaginatedFeedResult = {
    page: [makeFeedImage("img3", "https://example.com/3.jpg"), makeFeedImage("img4", "https://example.com/4.jpg")],
    continueCursor: "cursor456",
    isDone: false,
  };

  const mockFinalPage: PaginatedFeedResult = {
    page: [makeFeedImage("img5", "https://example.com/5.jpg")],
    continueCursor: "",
    isDone: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isSignedIn: true, isLoaded: true });
    mockLoadPublicFeedPage.mockResolvedValue(mockSecondPage);
    mockLoadFollowingFeedPage.mockResolvedValue(mockSecondPage);
    mockUseQuery.mockReturnValue("blur"); // Default preference
  });

  describe("rendering", () => {
    it("renders FeedTabs with correct active type for public feed", () => {
      render(<FeedClient feedType="public" initialPage={mockInitialPage} />);

      const tabs = screen.getByTestId("feed-tabs");
      expect(tabs).toHaveAttribute("data-active-type", "public");
    });

    it("renders FeedTabs with correct active type for following feed", () => {
      render(<FeedClient feedType="following" initialPage={mockInitialPage} />);

      const tabs = screen.getByTestId("feed-tabs");
      expect(tabs).toHaveAttribute("data-active-type", "following");
    });

    it("renders PaginatedImageGrid with initial page data", () => {
      render(<FeedClient feedType="public" initialPage={mockInitialPage} />);

      expect(screen.getByTestId("grid-count")).toHaveTextContent("2");
      expect(screen.getByTestId("grid-status")).toHaveTextContent("CanLoadMore");
    });

    it("renders with empty state when no initial page provided", () => {
      render(<FeedClient feedType="public" />);

      expect(screen.getByTestId("grid-count")).toHaveTextContent("0");
    });
  });

  describe("public feed", () => {
    it("shows public empty state when feed is empty", () => {
      const emptyInitialPage: PaginatedFeedResult = { page: [], continueCursor: "", isDone: true };
      render(<FeedClient feedType="public" initialPage={emptyInitialPage} />);

      expect(screen.getByText("Feed is quiet...")).toBeInTheDocument();
      expect(screen.getByText("Go to Studio")).toBeInTheDocument();
    });

    it("calls loadPublicFeedPage when loading more", async () => {
      const user = userEvent.setup();
      render(<FeedClient feedType="public" initialPage={mockInitialPage} />);

      await user.click(screen.getByTestId("load-more-btn"));

      await waitFor(() => {
        expect(mockLoadPublicFeedPage).toHaveBeenCalledWith({
          cursor: "cursor123",
          filterPreference: "blur",
        });
      });
    });

    it("appends new items when load more succeeds", async () => {
      const user = userEvent.setup();
      render(<FeedClient feedType="public" initialPage={mockInitialPage} initialPreference="allow" />);

      expect(screen.getByTestId("grid-count")).toHaveTextContent("2");

      await user.click(screen.getByTestId("load-more-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("grid-count")).toHaveTextContent("4");
      });
    });

    it("sets status to Exhausted when isDone is true", async () => {
      mockLoadPublicFeedPage.mockResolvedValue(mockFinalPage);
      const user = userEvent.setup();
      render(<FeedClient feedType="public" initialPage={mockInitialPage} initialPreference="allow" />);

      await user.click(screen.getByTestId("load-more-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("grid-status")).toHaveTextContent("Exhausted");
      });
    });
    it("calls loadPublicFeedPage with preference when loading more", async () => {
      mockUseQuery.mockReturnValue("allow");
      const user = userEvent.setup();
      render(<FeedClient feedType="public" initialPage={mockInitialPage} initialPreference="allow" />);

      await user.click(screen.getByTestId("load-more-btn"));

      await waitFor(() => {
        expect(mockLoadPublicFeedPage).toHaveBeenCalledWith({
          cursor: "cursor123",
          filterPreference: "allow",
        });
      });
    });

    it("passes userShowsSensitive=true to grid when preference is allow", () => {
      mockUseQuery.mockReturnValue("allow");
      render(<FeedClient feedType="public" initialPage={mockInitialPage} />);

      const grid = screen.getByTestId("paginated-image-grid");
      expect(grid).toHaveAttribute("data-user-shows-sensitive", "true");
    });

    it("passes userShowsSensitive=false to grid when preference is blur", () => {
      mockUseQuery.mockReturnValue("blur");
      render(<FeedClient feedType="public" initialPage={mockInitialPage} />);

      const grid = screen.getByTestId("paginated-image-grid");
      expect(grid).toHaveAttribute("data-user-shows-sensitive", "false");
    });
  });

  describe("following feed", () => {
    it("shows following empty state when feed is empty", () => {
      const emptyInitialPage: PaginatedFeedResult = { page: [], continueCursor: "", isDone: true };
      render(<FeedClient feedType="following" initialPage={emptyInitialPage} />);

      expect(screen.getByText("No posts yet")).toBeInTheDocument();
      expect(screen.getByText("Browse Public Feed")).toBeInTheDocument();
    });

    it("calls loadFollowingFeedPage when loading more", async () => {
      const user = userEvent.setup();
      render(<FeedClient feedType="following" initialPage={mockInitialPage} />);

      await user.click(screen.getByTestId("load-more-btn"));

      await waitFor(() => {
        expect(mockLoadFollowingFeedPage).toHaveBeenCalledWith({ cursor: "cursor123" });
      });
    });

    it("appends new items when load more succeeds", async () => {
      const user = userEvent.setup();
      render(<FeedClient feedType="following" initialPage={mockInitialPage} />);

      expect(screen.getByTestId("grid-count")).toHaveTextContent("2");

      await user.click(screen.getByTestId("load-more-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("grid-count")).toHaveTextContent("4");
      });
    });
  });

  describe("state management", () => {
    it("resets state when feedType changes", () => {
      const { rerender } = render(<FeedClient feedType="public" initialPage={mockInitialPage} />);

      expect(screen.getByTestId("grid-count")).toHaveTextContent("2");

      const newInitialPage: PaginatedFeedResult = {
        page: [makeFeedImage("following1", "https://example.com/following1.jpg")],
        continueCursor: "followCursor",
        isDone: false,
      };

      rerender(<FeedClient feedType="following" initialPage={newInitialPage} />);

      expect(screen.getByTestId("grid-count")).toHaveTextContent("1");
    });

    it("resets state when initialPage changes", () => {
      const { rerender } = render(<FeedClient feedType="public" initialPage={mockInitialPage} />);

      expect(screen.getByTestId("grid-count")).toHaveTextContent("2");

      const newInitialPage: PaginatedFeedResult = {
        page: [
          makeFeedImage("new1", "https://example.com/new1.jpg"),
          makeFeedImage("new2", "https://example.com/new2.jpg"),
          makeFeedImage("new3", "https://example.com/new3.jpg"),
        ],
        continueCursor: "newCursor",
        isDone: false,
      };

      rerender(<FeedClient feedType="public" initialPage={newInitialPage} />);

      expect(screen.getByTestId("grid-count")).toHaveTextContent("3");
    });

    it("does not call load more when already loading", async () => {
      // Make the server action slow
      mockLoadPublicFeedPage.mockImplementation(
        () => new Promise<PaginatedFeedResult>((resolve) => setTimeout(() => resolve(mockSecondPage), 500))
      );

      const user = userEvent.setup();
      render(<FeedClient feedType="public" initialPage={mockInitialPage} />);

      // Click load more twice quickly
      await user.click(screen.getByTestId("load-more-btn"));
      await user.click(screen.getByTestId("load-more-btn"));

      // Should only be called once
      expect(mockLoadPublicFeedPage).toHaveBeenCalledTimes(1);
    });

    it("does not call load more when isDone is true", async () => {
      const doneInitialPage: PaginatedFeedResult = {
        page: mockInitialPage.page,
        continueCursor: "cursor123",
        isDone: true,
      };

      const user = userEvent.setup();
      render(<FeedClient feedType="public" initialPage={doneInitialPage} />);

      await user.click(screen.getByTestId("load-more-btn"));

      expect(mockLoadPublicFeedPage).not.toHaveBeenCalled();
    });

    it("does not call load more when cursor is null and items exist", async () => {
      // When we have items but no cursor (null), it means we're at the end
      // This is different from cursor being null with no items (initial state needing first fetch)
      const noCursorPage: PaginatedFeedResult = {
        page: mockInitialPage.page,
        continueCursor: null as unknown as string,
        isDone: false,
      };

      const user = userEvent.setup();
      render(<FeedClient feedType="public" initialPage={noCursorPage} />);

      await user.click(screen.getByTestId("load-more-btn"));

      expect(mockLoadPublicFeedPage).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("handles load more error gracefully", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      mockLoadPublicFeedPage.mockRejectedValue(new Error("Network error"));

      const user = userEvent.setup();
      render(<FeedClient feedType="public" initialPage={mockInitialPage} />);

      await user.click(screen.getByTestId("load-more-btn"));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith("Failed to load more:", expect.any(Error));
      });

      // Items should remain unchanged
      expect(screen.getByTestId("grid-count")).toHaveTextContent("2");
      // Status should return to CanLoadMore
      expect(screen.getByTestId("grid-status")).toHaveTextContent("CanLoadMore");

      consoleError.mockRestore();
    });
  });

  describe("auto-load behavior", () => {
    it("auto-loads more when initial page is empty but not done", async () => {
      const emptyButNotDone: PaginatedFeedResult = {
        page: [],
        continueCursor: "cursor123",
        isDone: false,
      };

      render(<FeedClient feedType="public" initialPage={emptyButNotDone} />);

      await waitFor(() => {
        expect(mockLoadPublicFeedPage).toHaveBeenCalledWith({
          cursor: "cursor123",
          filterPreference: "blur",
        });
      });
    });

    it("does not auto-load when initial page has items", () => {
      render(<FeedClient feedType="public" initialPage={mockInitialPage} />);

      // Should not auto-load since we have items
      expect(mockLoadPublicFeedPage).not.toHaveBeenCalled();
    });

    it("does not auto-load when isDone is true", () => {
      const emptyAndDone: PaginatedFeedResult = {
        page: [],
        continueCursor: "",
        isDone: true,
      };

      render(<FeedClient feedType="public" initialPage={emptyAndDone} />);

      expect(mockLoadPublicFeedPage).not.toHaveBeenCalled();
    });
  });

  describe("empty states", () => {
    it("public empty state links to studio", () => {
      const emptyInitialPage: PaginatedFeedResult = { page: [], continueCursor: "", isDone: true };
      render(<FeedClient feedType="public" initialPage={emptyInitialPage} />);

      const studioLink = screen.getByText("Go to Studio").closest("a");
      expect(studioLink).toHaveAttribute("href", "/studio");
    });

    it("following empty state links to public feed", () => {
      const emptyInitialPage: PaginatedFeedResult = { page: [], continueCursor: "", isDone: true };
      render(<FeedClient feedType="following" initialPage={emptyInitialPage} />);

      const publicFeedLink = screen.getByText("Browse Public Feed").closest("a");
      expect(publicFeedLink).toHaveAttribute("href", "/feed/public");
    });
  });
});
