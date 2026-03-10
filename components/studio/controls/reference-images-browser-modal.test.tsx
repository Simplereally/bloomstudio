// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReferenceImagesBrowserModal } from "./reference-images-browser-modal";
import type { Id } from "@/convex/_generated/dataModel";

// Mock uploaded reference images (matches the shape returned by useReferenceImages)
const mockReferenceImages = [
  { _id: "img1" as unknown as Id<"referenceImages">, _creationTime: Date.now(), ownerId: "user_1", r2Key: "reference/upload1.jpg", url: "https://example.com/upload1.jpg", filename: "upload1.jpg", contentType: "image/jpeg", sizeBytes: 100, width: 128, height: 128, createdAt: Date.now() },
  { _id: "img2" as unknown as Id<"referenceImages">, _creationTime: Date.now(), ownerId: "user_1", r2Key: "reference/upload2.jpg", url: "https://example.com/upload2.jpg", filename: "upload2.jpg", contentType: "image/jpeg", sizeBytes: 200, width: 128, height: 128, createdAt: Date.now() },
  { _id: "img3" as unknown as Id<"referenceImages">, _creationTime: Date.now(), ownerId: "user_1", r2Key: "reference/test-photo.jpg", url: "https://example.com/test-photo.jpg", filename: "test-photo.jpg", contentType: "image/jpeg", sizeBytes: 300, width: 128, height: 128, createdAt: Date.now() },
  { _id: "img4" as unknown as Id<"referenceImages">, _creationTime: Date.now(), ownerId: "user_1", r2Key: "reference/sunset.jpg", url: "https://example.com/sunset.jpg", filename: "sunset.jpg", contentType: "image/jpeg", sizeBytes: 400, width: 128, height: 128, createdAt: Date.now() },
];

// Mock generated images (history) — returned by useImageHistory hook
const mockHistoryConvexResults = [
  {
    _id: "gen1",
    _creationTime: Date.now(),
    url: "https://example.com/thumb-gen1.jpg",
    contentType: "image/png",
    visibility: "public" as const,
    model: "flux",
  },
  {
    _id: "gen2",
    _creationTime: Date.now(),
    url: "https://example.com/thumb-gen2.jpg",
    contentType: "image/jpeg",
    visibility: "public" as const,
    model: "flux",
  },
  {
    _id: "gen3",
    _creationTime: Date.now(),
    url: "https://example.com/thumb-gen3.mp4",
    contentType: "video/mp4",
    visibility: "public" as const,
    model: "veo",
  },
  {
    _id: "gen4",
    _creationTime: Date.now(),
    url: "https://example.com/thumb-gen4.jpg",
    contentType: "image/webp",
    visibility: "public" as const,
    model: "flux",
  },
];

// Default mock return for useImageHistory — "Exhausted" means all data loaded
const mockLoadMore = vi.fn();
const mockUseImageHistory = vi.fn().mockReturnValue({
  results: mockHistoryConvexResults,
  status: "Exhausted",
  loadMore: mockLoadMore,
});

vi.mock("@/hooks/queries/use-reference-images", () => ({
  useReferenceImages: () => mockReferenceImages,
}));

vi.mock("@/hooks/queries/use-image-history", () => ({
  useImageHistory: (...args: unknown[]) => mockUseImageHistory(...args),
}));

vi.mock("@/app/_server/actions/history", () => ({
  loadMyHistoryPage: vi.fn().mockResolvedValue({ page: [], continueCursor: null, isDone: true }),
}));

vi.mock("@/hooks/mutations/use-delete-image", () => ({
  useDeleteReferenceImage: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ fill, ...props }: React.ComponentProps<"img"> & { fill?: boolean }) => (
    <img {...props} alt={props.alt ?? ""} data-testid="mock-image" data-fill={fill ? "true" : undefined} />
  ),
}));

// Mock DeleteImageDialog
vi.mock("@/components/studio/delete-image-dialog", () => ({
  DeleteImageDialog: ({ onConfirm }: { onConfirm: () => void }) => (
    <button onClick={onConfirm} data-testid="delete-button">
      Delete
    </button>
  ),
}));

// Mock @tanstack/react-virtual to avoid layout measurement issues in jsdom
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => {
    // Return all rows as virtual items so they render in tests
    const items = Array.from({ length: count }, (_, i) => ({
      index: i,
      key: i,
      start: i * estimateSize(),
      size: estimateSize(),
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => count * estimateSize(),
      measure: vi.fn(),
    };
  },
}));

describe("ReferenceImagesBrowserModal", () => {
  const mockOnSelect = vi.fn();
  const mockOnOpenChange = vi.fn();

  /** Default props shared by most tests */
  const defaultProps = {
    onOpenChange: mockOnOpenChange,
    onSelect: mockOnSelect,
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to default return value
    mockUseImageHistory.mockReturnValue({
      results: mockHistoryConvexResults,
      status: "Exhausted",
      loadMore: mockLoadMore,
    });
  });

  describe("rendering", () => {
    it("renders modal when open is true", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not render modal when open is false", () => {
      render(<ReferenceImagesBrowserModal open={false} {...defaultProps} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders default title", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      expect(screen.getByText("Browse Reference Images")).toBeInTheDocument();
    });

    it("renders custom title", () => {
      render(
        <ReferenceImagesBrowserModal open={true} {...defaultProps} title="Select First Frame" />
      );
      expect(screen.getByText("Select First Frame")).toBeInTheDocument();
    });

    it("renders description", () => {
      render(
        <ReferenceImagesBrowserModal open={true} {...defaultProps} description="Choose a reference" />
      );
      expect(screen.getByText("Choose a reference")).toBeInTheDocument();
    });

    it("renders search input", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      expect(screen.getByTestId("reference-images-search")).toBeInTheDocument();
    });

    it("renders tabs", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      expect(screen.getByTestId("browser-tabs")).toBeInTheDocument();
      expect(screen.getByTestId("tab-history")).toBeInTheDocument();
      expect(screen.getByTestId("tab-uploads")).toBeInTheDocument();
    });

    it("defaults to the History tab", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      // History content is visible, uploads content is hidden
      const historyPanel = screen.getByTestId("history-tab-content");
      const uploadsPanel = screen.getByTestId("uploads-tab-content");
      expect(historyPanel).not.toHaveClass("hidden");
      expect(uploadsPanel).toHaveClass("hidden");
    });

    it("renders history images grid on default tab", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      const historyPanel = screen.getByTestId("history-tab-content");
      expect(within(historyPanel).getByTestId("reference-images-grid")).toBeInTheDocument();
    });
  });

  describe("tab switching", () => {
    it("switches to uploads tab when clicked", async () => {
      const user = userEvent.setup();
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      const uploadsTab = screen.getByTestId("tab-uploads");
      await user.click(uploadsTab);

      // Verify uploads content is visible and history content is hidden
      const uploadsPanel = screen.getByTestId("uploads-tab-content");
      const historyPanel = screen.getByTestId("history-tab-content");
      expect(uploadsPanel).not.toHaveClass("hidden");
      expect(historyPanel).toHaveClass("hidden");
    });

    it("shows uploaded images when uploads tab is active", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      fireEvent.click(screen.getByTestId("tab-uploads"));

      const uploadsPanel = screen.getByTestId("uploads-tab-content");
      const images = within(uploadsPanel).getAllByTestId("reference-image-item");
      expect(images).toHaveLength(4); // 4 uploaded images
    });

    it("shows history images when history tab is active", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      // History tab is the default; by default, videos are filtered out (allowVideo=false)
      const historyPanel = screen.getByTestId("history-tab-content");
      const images = within(historyPanel).getAllByTestId("reference-image-item");
      // 3 images (gen1, gen2, gen4) since gen3 is video/mp4 and allowVideo defaults to false
      expect(images).toHaveLength(3);
    });
  });

  describe("content type filtering", () => {
    it("queries full history by default and filters image media client-side", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);

      expect(mockUseImageHistory).toHaveBeenCalledWith();
    });

    it("filters out video content by default in history tab", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      // Default tab is history with allowVideo=false
      const historyPanel = screen.getByTestId("history-tab-content");
      const images = within(historyPanel).getAllByTestId("reference-image-item");
      expect(images).toHaveLength(3); // gen3 (video/mp4) is excluded
    });

    it("includes video content when allowVideo is true in history tab", () => {
      render(
        <ReferenceImagesBrowserModal
          open={true}
          {...defaultProps}
          allowVideo={true}
        />
      );
      // History tab with allowVideo=true
      const historyPanel = screen.getByTestId("history-tab-content");
      const images = within(historyPanel).getAllByTestId("reference-image-item");
      expect(images).toHaveLength(4); // All 4 generated images including video
    });

    it("auto-loads more when current history page has only videos", async () => {
      mockUseImageHistory.mockReturnValue({
        results: [mockHistoryConvexResults[2]],
        status: "CanLoadMore",
        loadMore: mockLoadMore,
      });

      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledWith(20);
      });
    });

    it("does not hide images from legacy or unknown models", () => {
      mockUseImageHistory.mockReturnValue({
        results: [
          {
            _id: "legacy-image",
            _creationTime: Date.now(),
            url: "https://example.com/legacy-image.jpg",
            contentType: "image/jpeg",
            visibility: "public" as const,
            model: "flux-pro",
          },
          {
            _id: "recent-video",
            _creationTime: Date.now(),
            url: "https://example.com/recent-video.mp4",
            contentType: "video/mp4",
            visibility: "public" as const,
            model: "grok-video",
          },
        ],
        status: "Exhausted",
        loadMore: mockLoadMore,
      });

      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);

      const historyPanel = screen.getByTestId("history-tab-content");
      const images = within(historyPanel).getAllByTestId("reference-image-item");
      expect(images).toHaveLength(1);
      expect(screen.getByTestId("select-image-legacy-image")).toBeInTheDocument();
    });
  });

  describe("search functionality", () => {
    it("filters images based on search query within active tab", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      const searchInput = screen.getByTestId("reference-images-search");
      fireEvent.change(searchInput, { target: { value: "gen1" } });

      const historyPanel = screen.getByTestId("history-tab-content");
      const images = within(historyPanel).getAllByTestId("reference-image-item");
      expect(images).toHaveLength(1);
    });

    it("shows clear search button when search is active", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      const searchInput = screen.getByTestId("reference-images-search");

      expect(screen.queryByTestId("clear-search-button")).not.toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: "test" } });
      expect(screen.getByTestId("clear-search-button")).toBeInTheDocument();
    });

    it("clears search when clear button is clicked", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      const searchInput = screen.getByTestId("reference-images-search");
      fireEvent.change(searchInput, { target: { value: "gen1" } });

      const clearButton = screen.getByTestId("clear-search-button");
      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue("");
      // Back to showing all history images (minus videos)
      const historyPanel = screen.getByTestId("history-tab-content");
      const images = within(historyPanel).getAllByTestId("reference-image-item");
      expect(images).toHaveLength(3);
    });

    it("shows empty state when no images match search", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      const searchInput = screen.getByTestId("reference-images-search");
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });

      // Both tabs show the empty state when forceMount is used; check within the visible tab
      const historyPanel = screen.getByTestId("history-tab-content");
      expect(within(historyPanel).getByText("No images match your search")).toBeInTheDocument();
    });

    it("search applies to uploads tab too", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      const searchInput = screen.getByTestId("reference-images-search");
      fireEvent.change(searchInput, { target: { value: "test" } });

      // Switch to uploads tab
      fireEvent.click(screen.getByTestId("tab-uploads"));

      const uploadsPanel = screen.getByTestId("uploads-tab-content");
      const images = within(uploadsPanel).getAllByTestId("reference-image-item");
      expect(images).toHaveLength(1); // Only test-photo.jpg matches
    });
  });

  describe("selection", () => {
    it("calls onSelect with url when a history image is clicked (no originalUrl)", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      const selectButton = screen.getByTestId("select-image-gen1");
      fireEvent.click(selectButton);

      // No originalUrl on mock data → falls back to url
      expect(mockOnSelect).toHaveBeenCalledWith("https://example.com/thumb-gen1.jpg");
    });

    it("calls onSelect with originalUrl when a history image has originalUrl", () => {
      // Override mock to include originalUrl
      const resultsWithOriginal = mockHistoryConvexResults.map((img) => ({
        ...img,
        originalUrl: img.url.replace("thumb-", "original-"),
      }));
      mockUseImageHistory.mockReturnValue({
        results: resultsWithOriginal,
        status: "Exhausted",
        loadMore: mockLoadMore,
      });

      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      const selectButton = screen.getByTestId("select-image-gen1");
      fireEvent.click(selectButton);

      // Should use the full-size originalUrl, not the thumbnail url
      expect(mockOnSelect).toHaveBeenCalledWith("https://example.com/original-gen1.jpg");
    });

    it("calls onSelect with url when an uploaded image is clicked", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      // Uploads tab content is force-mounted, so select button is always accessible
      const selectButton = screen.getByTestId("select-image-img1");
      fireEvent.click(selectButton);

      expect(mockOnSelect).toHaveBeenCalledWith("https://example.com/upload1.jpg");
    });

    it("highlights selected images", () => {
      render(
        <ReferenceImagesBrowserModal
          open={true}
          {...defaultProps}
          selectedUrls={["https://example.com/thumb-gen1.jpg"]}
        />
      );
      const historyPanel = screen.getByTestId("history-tab-content");
      const items = within(historyPanel).getAllByTestId("reference-image-item");
      expect(items[0]).toHaveClass("border-primary");
    });
  });

  describe("close behavior", () => {
    it("calls onOpenChange when close button is clicked", () => {
      render(<ReferenceImagesBrowserModal open={true} {...defaultProps} />);
      const closeButtons = screen.getAllByRole("button", { name: /close/i });
      const footerCloseButton = closeButtons.find((btn) => btn.textContent === "Close");
      expect(footerCloseButton).toBeDefined();
      fireEvent.click(footerCloseButton!);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("ReferenceImagesBrowserModal - state reset on reopen", () => {
  const mockOnSelect = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseImageHistory.mockReturnValue({
      results: mockHistoryConvexResults,
      status: "Exhausted",
      loadMore: mockLoadMore,
    });
  });

  it("resets search query when modal is reopened", () => {
    const { rerender } = render(
      <ReferenceImagesBrowserModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
      />
    );

    // Type a search query
    const searchInput = screen.getByTestId("reference-images-search");
    fireEvent.change(searchInput, { target: { value: "gen1" } });
    expect(searchInput).toHaveValue("gen1");

    // Close the modal
    rerender(
      <ReferenceImagesBrowserModal
        open={false}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
      />
    );

    // Reopen the modal
    rerender(
      <ReferenceImagesBrowserModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
      />
    );

    // Search should be cleared
    const searchInputAfter = screen.getByTestId("reference-images-search");
    expect(searchInputAfter).toHaveValue("");
  });

  it("resets to history tab when modal is reopened", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ReferenceImagesBrowserModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
      />
    );

    // Switch to uploads tab
    await user.click(screen.getByTestId("tab-uploads"));
    const uploadsPanel = screen.getByTestId("uploads-tab-content");
    expect(uploadsPanel).not.toHaveClass("hidden");

    // Close the modal
    rerender(
      <ReferenceImagesBrowserModal
        open={false}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
      />
    );

    // Reopen the modal
    rerender(
      <ReferenceImagesBrowserModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSelect={mockOnSelect}
      />
    );

    // Should be back on history tab
    const historyPanel = screen.getByTestId("history-tab-content");
    const uploadsPanelAfter = screen.getByTestId("uploads-tab-content");
    expect(historyPanel).not.toHaveClass("hidden");
    expect(uploadsPanelAfter).toHaveClass("hidden");
  });
});
