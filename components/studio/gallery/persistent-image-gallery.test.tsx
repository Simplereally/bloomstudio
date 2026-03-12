import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersistentImageGallery } from "./persistent-image-gallery";
import { useSetBulkVisibility } from "@/hooks/mutations/use-set-visibility";
import { useBulkDeleteGeneratedImages } from "@/hooks/mutations/use-delete-image";
import { useImageHistory } from "@/hooks/queries/use-image-history";
import type { ThumbnailData } from "./types";

// Mock server actions to avoid server-only import error
vi.mock("@/app/_server/actions/history", () => ({
  loadMyHistoryPage: vi.fn(),
  loadMyHistoryWithDisplayPage: vi.fn(),
}));

vi.mock("@/app/_server/actions/invalidation", () => ({
  invalidateUserFavoritesCache: vi.fn(),
  invalidateUserHistoryCache: vi.fn(),
  invalidatePublicFeedCache: vi.fn(),
  invalidateVisibilityChange: vi.fn(),
  invalidateImageDeletion: vi.fn(),
  invalidateFollowChange: vi.fn(),
  invalidateUserFollowingFeedCache: vi.fn(),
}));

// Mock the hooks
vi.mock("@/hooks/mutations/use-set-visibility", () => ({
  useSetBulkVisibility: vi.fn(),
}));

vi.mock("@/hooks/mutations/use-delete-image", () => ({
  useBulkDeleteGeneratedImages: vi.fn(),
}));

vi.mock("@/hooks/queries/use-image-history", () => ({
  useImageHistory: vi.fn(),
}));

vi.mock("@/components/gallery/history-filters", () => ({
  HistoryFiltersDropdown: () => <div data-testid="history-filters-dropdown" />,
  ActiveFilterBadges: () => <div data-testid="active-filter-badges" />,
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "test-user-id" } }),
}));

// Mock the VirtualizedGalleryGrid to simplify tests and avoid virtualizer issues in JSDOM
vi.mock("./virtualized-gallery-grid", () => ({
  VirtualizedGalleryGrid: ({
    images,
    thumbnailSize,
    isMobile,
    canLoadMore,
    isLoadingMore,
    onSelect,
    onCheckedChange,
    selectionMode,
    selectedIds,
  }: {
    images: ThumbnailData[];
    thumbnailSize: string;
    isMobile: boolean;
    canLoadMore?: boolean;
    isLoadingMore?: boolean;
    onSelect: (img: ThumbnailData) => void;
    onCheckedChange: (id: string, checked: boolean) => void;
    selectionMode: boolean;
    selectedIds: Set<string>;
  }) => (
    <div data-testid="gallery-grid" className="virtual-grid-mock">
      {/* Simulate virtual rows for testing */}
      {images.slice(0, 10).map((img, i) => (
        <div key={i} data-index={i} className="gap-1.5" style={{
            gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : `repeat(${thumbnailSize === "sm" ? 4 : 3}, 1fr)` 
        }}>
            {/* Render a mock thumbnail */}
            <div 
              data-testid="gallery-thumbnail" 
              className={isMobile ? "w-full h-auto aspect-square" : ""}
              onClick={() => onSelect(img)}
            >
              {selectionMode && (
                <input
                  type="checkbox"
                  checked={selectedIds?.has(img.id)}
                  onChange={(e) => onCheckedChange(img.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
        </div>
      ))}
      {(canLoadMore || isLoadingMore) && (
        <div data-testid="load-more-sentinel">
          {isLoadingMore && <div data-testid="loading-spinner" />}
        </div>
      )}
    </div>
  ),
}));

const mockConvexImages = [
  {
    _id: "conv123",
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
    _id: "conv456",
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
];

describe("PersistentImageGallery", () => {
  let mockVisibilityMutateAsync: Mock;
  let mockBulkDeleteMutateAsync: Mock;
  let mockHistoryLoadMore: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });



    // Mock dimensions for virtualizer
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 800,
    });
    HTMLElement.prototype.getBoundingClientRect = () => ({
      width: 800,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    mockVisibilityMutateAsync = vi
      .fn()
      .mockResolvedValue({ success: true, successCount: 1 });
    mockBulkDeleteMutateAsync = vi
      .fn()
      .mockResolvedValue({ success: true, successCount: 2 });
    mockHistoryLoadMore = vi.fn();
    (useSetBulkVisibility as Mock).mockReturnValue({
      mutateAsync: mockVisibilityMutateAsync,
    });
    (useBulkDeleteGeneratedImages as Mock).mockReturnValue({
      mutateAsync: mockBulkDeleteMutateAsync,
    });
    (useImageHistory as Mock).mockReturnValue({
      results: mockConvexImages,
      status: "Exhausted",
      loadMore: mockHistoryLoadMore,
    });
  });

  describe("rendering", () => {
    it("renders the gallery with images from history", () => {
      render(<PersistentImageGallery />);

      expect(screen.getByTestId("image-gallery")).toBeInTheDocument();
      expect(screen.getAllByTestId("gallery-thumbnail")).toHaveLength(2);
    });

    it("renders filter controls", () => {
      render(<PersistentImageGallery />);

      expect(
        screen.getByTestId("history-filters-dropdown"),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("active-filter-badges")).not.toBeInTheDocument();
    });

    it("shows loading state when loading first page", () => {
      (useImageHistory as Mock).mockReturnValue({
        results: [],
        status: "LoadingFirstPage",
        loadMore: vi.fn(),
      });

      render(<PersistentImageGallery />);

      expect(screen.getByTestId("gallery-loading")).toBeInTheDocument();
    });

    it("shows empty state when exhausted with no results", () => {
      (useImageHistory as Mock).mockReturnValue({
        results: [],
        status: "Exhausted",
        loadMore: vi.fn(),
      });

      render(<PersistentImageGallery />);

      expect(screen.getByTestId("gallery-empty")).toBeInTheDocument();
    });

    it("registers a load-more callback for parent-driven prefetching", async () => {
      const extendedImages = Array.from({ length: 10 }, (_, index) => ({
        ...mockConvexImages[0],
        _id: `conv-${index}`,
        url: `https://example.com/image-${index}.jpg`,
      }));
      let registeredLoadMore: (() => Promise<void>) | null = null;

      (useImageHistory as Mock).mockReturnValue({
        results: extendedImages,
        status: "CanLoadMore",
        loadMore: mockHistoryLoadMore,
      });

      render(
        <PersistentImageGallery
          onLoadMoreReady={(loadMore) => {
            registeredLoadMore = loadMore;
          }}
        />,
      );

      expect(registeredLoadMore).toBeTypeOf("function");

      await act(async () => {
        await registeredLoadMore?.();
      });

      expect(mockHistoryLoadMore).toHaveBeenCalledWith(20);
    });
  });

  describe("bulk visibility actions", () => {
    it("calls setBulkVisibility with public when make public clicked", async () => {
      const user = userEvent.setup();

      render(<PersistentImageGallery />);

      // Enter selection mode
      await user.click(screen.getByTestId("toggle-selection"));

      // Select items by clicking thumbnails (whole card toggles selection in selection mode)
      const thumbnails = screen.getAllByTestId("gallery-thumbnail");
      await user.click(thumbnails[0]);
      await user.click(thumbnails[1]);

      // Open bulk actions menu
      await user.click(screen.getByTestId("bulk-actions-menu"));

      // Click make public
      await user.click(screen.getByTestId("make-public"));

      await waitFor(() => {
        expect(mockVisibilityMutateAsync).toHaveBeenCalledWith({
          imageIds: expect.arrayContaining(["conv123", "conv456"]),
          visibility: "public",
        });
      });
    });

    it("calls setBulkVisibility with unlisted when make private clicked", async () => {
      const user = userEvent.setup();

      render(<PersistentImageGallery />);

      // Enter selection mode
      await user.click(screen.getByTestId("toggle-selection"));

      // Select first item by clicking thumbnail
      const thumbnails = screen.getAllByTestId("gallery-thumbnail");
      await user.click(thumbnails[0]);

      // Open bulk actions menu
      await user.click(screen.getByTestId("bulk-actions-menu"));

      // Click make private
      await user.click(screen.getByTestId("make-private"));

      await waitFor(() => {
        expect(mockVisibilityMutateAsync).toHaveBeenCalledWith({
          imageIds: ["conv123"],
          visibility: "unlisted",
        });
      });
    });

    it("clears selection after successful visibility change", async () => {
      const user = userEvent.setup();

      render(<PersistentImageGallery />);

      // Enter selection mode
      await user.click(screen.getByTestId("toggle-selection"));

      // Select first item by clicking thumbnail
      const thumbnails = screen.getAllByTestId("gallery-thumbnail");
      await user.click(thumbnails[0]);

      // Verify item is selected (label shows selection count)
      expect(screen.getByText("1 selected")).toBeInTheDocument();

      // Open bulk actions menu
      await user.click(screen.getByTestId("bulk-actions-menu"));

      // Click make public
      await user.click(screen.getByTestId("make-public"));

      // After action, selection should be cleared and mode exited
      await waitFor(() => {
        expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
      });
    });

    it("disables bulk actions menu when no items selected", async () => {
      const user = userEvent.setup();

      render(<PersistentImageGallery />);

      // Enter selection mode
      await user.click(screen.getByTestId("toggle-selection"));

      // Bulk actions menu should be present but disabled when nothing is selected
      expect(screen.getByTestId("bulk-actions-menu")).toBeInTheDocument();
      expect(screen.getByTestId("bulk-actions-menu")).toBeDisabled();
    });

    it("handles mutation error gracefully", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockVisibilityMutateAsync.mockRejectedValueOnce(
        new Error("Network error"),
      );

      render(<PersistentImageGallery />);

      // Enter selection mode
      await user.click(screen.getByTestId("toggle-selection"));

      // Select first item by clicking thumbnail
      const thumbnails = screen.getAllByTestId("gallery-thumbnail");
      await user.click(thumbnails[0]);

      // Open bulk actions menu
      await user.click(screen.getByTestId("bulk-actions-menu"));

      // Click make public
      await user.click(screen.getByTestId("make-public"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to make images public:",
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("bulk delete actions", () => {
    it("calls bulkDeleteMutation with all selected image IDs", async () => {
      const user = userEvent.setup();

      render(<PersistentImageGallery />);

      // Enter selection mode
      await user.click(screen.getByTestId("toggle-selection"));

      // Select both items
      const thumbnails = screen.getAllByTestId("gallery-thumbnail");
      await user.click(thumbnails[0]);
      await user.click(thumbnails[1]);

      // Verify 2 items are selected
      expect(screen.getByText("2 selected")).toBeInTheDocument();

      // Click delete button (directly available, no need to open menu)
      await user.click(screen.getByTestId("delete-selected"));

      await waitFor(() => {
        // Should call with array of all selected IDs
        expect(mockBulkDeleteMutateAsync).toHaveBeenCalledTimes(1);
        expect(mockBulkDeleteMutateAsync).toHaveBeenCalledWith(
          expect.arrayContaining(["conv123", "conv456"]),
        );
      });
    });

    it("clears selection and exits selection mode after successful delete", async () => {
      const user = userEvent.setup();

      render(<PersistentImageGallery />);

      // Enter selection mode and select an item
      await user.click(screen.getByTestId("toggle-selection"));
      const thumbnails = screen.getAllByTestId("gallery-thumbnail");
      await user.click(thumbnails[0]);

      expect(screen.getByText("1 selected")).toBeInTheDocument();

      // Click delete button
      await user.click(screen.getByTestId("delete-selected"));

      // After action, selection should be cleared
      await waitFor(() => {
        expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
      });
    });

    it("handles bulk delete error gracefully", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockBulkDeleteMutateAsync.mockRejectedValueOnce(
        new Error("Delete failed"),
      );

      render(<PersistentImageGallery />);

      // Enter selection mode and select an item
      await user.click(screen.getByTestId("toggle-selection"));
      await user.click(screen.getAllByTestId("gallery-thumbnail")[0]);

      // Click delete button
      await user.click(screen.getByTestId("delete-selected"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to delete images:",
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });

    it("does not call delete when no items are selected", async () => {
      const user = userEvent.setup();

      render(<PersistentImageGallery />);

      // Enter selection mode but don't select anything
      await user.click(screen.getByTestId("toggle-selection"));

      // Bulk actions menu should be disabled
      expect(screen.getByTestId("bulk-actions-menu")).toBeDisabled();

      // Mutation should not have been called
      expect(mockBulkDeleteMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe("image mapping", () => {
    it("maps _id to id for component compatibility", async () => {
      const onSelectImage = vi.fn();

      render(<PersistentImageGallery onSelectImage={onSelectImage} />);

      const thumbnails = screen.getAllByTestId("gallery-thumbnail");
      await userEvent.click(thumbnails[0]);

      // The image passed to onSelectImage should have id equal to _id
      expect(onSelectImage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "conv123",
          _id: "conv123",
          contentType: "image/jpeg",
        }),
      );
    });
  });

  describe("pagination", () => {
    it("shows infinite scroll sentinel when canLoadMore", () => {
      (useImageHistory as Mock).mockReturnValue({
        results: mockConvexImages,
        status: "CanLoadMore",
        loadMore: vi.fn(),
      });

      render(<PersistentImageGallery />);

      expect(screen.getByTestId("load-more-sentinel")).toBeInTheDocument();
    });

    it("hides sentinel when exhausted", () => {
      (useImageHistory as Mock).mockReturnValue({
        results: mockConvexImages,
        status: "Exhausted",
        loadMore: vi.fn(),
      });

      render(<PersistentImageGallery />);

      expect(
        screen.queryByTestId("load-more-sentinel"),
      ).not.toBeInTheDocument();
    });

    it("shows loading spinner in sentinel when loading more", () => {
      (useImageHistory as Mock).mockReturnValue({
        results: mockConvexImages,
        status: "LoadingMore",
        loadMore: vi.fn(),
      });

      render(<PersistentImageGallery />);

      expect(screen.getByTestId("load-more-sentinel")).toBeInTheDocument();
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    it("automatically calls loadMore when results are empty but more pages exist (greedy fetch)", async () => {
      vi.useFakeTimers();
      const mockLoadMore = vi.fn();
      (useImageHistory as Mock).mockReturnValue({
        results: [],
        status: "CanLoadMore",
        loadMore: mockLoadMore,
      });

      render(<PersistentImageGallery />);

      // Wait for the hydration delay (100ms) before auto-load triggers
      // Must wrap in act to properly trigger state updates
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });

      expect(mockLoadMore).toHaveBeenCalledWith(20);
      vi.useRealTimers();
    });
  });
});
