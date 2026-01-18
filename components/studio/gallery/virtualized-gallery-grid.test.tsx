import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { VirtualizedGalleryGrid } from "./virtualized-gallery-grid";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ThumbnailItemProps } from "./thumbnail-item";

// Mock hooks
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(),
}));

// Mock ThumbnailItem to isolate grid testing
vi.mock("./thumbnail-item", () => ({
  ThumbnailItem: ({ image, className }: ThumbnailItemProps) => (
    <div
      data-testid="gallery-thumbnail"
      className={className}
    >
      {image.id}
    </div>
  ),
}));

const mockImages = Array.from({ length: 100 }, (_, i) => ({
  id: `img-${i}`,
  url: `https://example.com/img-${i}.jpg`,
  prompt: `Image ${i}`,
  params: {
    width: 1024,
    height: 1024,
  },
  timestamp: Date.now() - i * 1000,
}));

const createDefaultProps = () => ({
  images: mockImages,
  selectedIds: new Set<string>(),
  selectionMode: false,
  thumbnailSize: "md" as const,
  onSelect: vi.fn(),
  onCheckedChange: vi.fn(),
  scrollContainerRef: { current: document.createElement("div") }, // Mock ref
});

describe("VirtualizedGalleryGrid", () => {
  let originalIntersectionObserver: typeof IntersectionObserver;
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;
  let constructorMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false); // Default to desktop

    // Mock IntersectionObserver
    originalIntersectionObserver = global.IntersectionObserver;
    observeMock = vi.fn();
    disconnectMock = vi.fn();
    constructorMock = vi.fn();

    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    global.IntersectionObserver = class MockIntersectionObserver
      implements IntersectionObserver
    {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = "";
      readonly thresholds: readonly number[] = [];

      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
      ) {
        constructorMock(callback, options);
      }

      observe = observeMock;
      unobserve = vi.fn();
      disconnect = disconnectMock;
      takeRecords = vi.fn(() => []);
    } as unknown as typeof IntersectionObserver;

    // Mock dimensions for virtualizer
    HTMLElement.prototype.getBoundingClientRect = () => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 600,
    });
  });

  afterEach(() => {
    global.IntersectionObserver = originalIntersectionObserver;
    vi.clearAllMocks();
  });

  it("renders with virtualized rows", () => {
    render(
      <VirtualizedGalleryGrid
        {...createDefaultProps()}
        isMobile={false}
      />
    );

    // Should verify that not all images are rendered (virtualization)
    // But TanStack Virtual in JSDOM renders some initial items.
    // We check that we have some thumbnails.
    const thumbnails = screen.getAllByTestId("gallery-thumbnail");
    expect(thumbnails.length).toBeGreaterThan(0);
    expect(thumbnails.length).toBeLessThan(100);
  });

  it("uses 800px rootMargin on desktop for infinite scroll", async () => {
    vi.useFakeTimers();
    render(
      <VirtualizedGalleryGrid
        {...createDefaultProps()}
        canLoadMore={true}
        onLoadMore={vi.fn()}
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(constructorMock).toHaveBeenCalled();
    const options = constructorMock.mock.lastCall?.[1];
    expect(options?.rootMargin).toBe("0px 0px 800px 0px");
    vi.useRealTimers();
  });

  it("uses 800px rootMargin on mobile for infinite scroll", async () => {
    vi.useFakeTimers();
    vi.mocked(useIsMobile).mockReturnValue(true);
    render(
      <VirtualizedGalleryGrid
        {...createDefaultProps()}
        canLoadMore={true}
        onLoadMore={vi.fn()}
        isMobile={true}
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(constructorMock).toHaveBeenCalled();
    const options = constructorMock.mock.lastCall?.[1];
                         // "0px 0px 800px 0px" is expected now as we unified/increased margin
    expect(options?.rootMargin).toBe("0px 0px 800px 0px");
    vi.useRealTimers();
  });

  it("renders sentinel when canLoadMore is true", () => {
     render(
       <VirtualizedGalleryGrid
        {...createDefaultProps()}
        canLoadMore={true}
        isLoadingMore={false}
       />
    );
    expect(screen.getByTestId("load-more-sentinel")).toBeInTheDocument();
  });

  it("shows loading spinner in sentinel when isLoadingMore is true", () => {
     render(
       <VirtualizedGalleryGrid
        {...createDefaultProps()}
        canLoadMore={true}
        isLoadingMore={true}
       />
    );
    const sentinel = screen.getByTestId("load-more-sentinel");
    // Check for spinner - typically by class or svg
    expect(sentinel.querySelector("svg.animate-spin")).toBeInTheDocument();
  });
});
