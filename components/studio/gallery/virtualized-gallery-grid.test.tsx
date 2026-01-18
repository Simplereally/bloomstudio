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
  let originalResizeObserver: typeof ResizeObserver;
  let originalGetBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect;
  let originalOffsetHeightDescriptor: PropertyDescriptor | undefined;
  let originalClientHeightDescriptor: PropertyDescriptor | undefined;
  let observeMock: ReturnType<typeof vi.fn<(target: Element) => void>>;
  let unobserveMock: ReturnType<typeof vi.fn<(target: Element) => void>>;
  let disconnectMock: ReturnType<typeof vi.fn<() => void>>;
  let takeRecordsMock: ReturnType<typeof vi.fn<() => IntersectionObserverEntry[]>>;
  let constructorMock: ReturnType<
    typeof vi.fn<
      (
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
      ) => void
    >
  >;

  beforeEach(() => {
    // Capture originals
    originalIntersectionObserver = global.IntersectionObserver;
    originalResizeObserver = global.ResizeObserver;
    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    originalOffsetHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetHeight"
    );
    originalClientHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "clientHeight"
    );

    vi.mocked(useIsMobile).mockReturnValue(false); // Default to desktop

    // Mock IntersectionObserver
    observeMock = vi.fn<(target: Element) => void>();
    unobserveMock = vi.fn<(target: Element) => void>();
    disconnectMock = vi.fn<() => void>();
    takeRecordsMock = vi.fn<() => IntersectionObserverEntry[]>(() => []);
    constructorMock = vi.fn<
      (
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
      ) => void
    >();

    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      observe() { }
      unobserve() { }
      disconnect() { }
    };

    global.IntersectionObserver = class MockIntersectionObserver
      implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = "";
      readonly thresholds: readonly number[] = [];

      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
      ) {
        constructorMock(callback, options);
      }

      observe(target: Element): void {
        observeMock(target);
      }

      unobserve(target: Element): void {
        unobserveMock(target);
      }

      disconnect(): void {
        disconnectMock();
      }

      takeRecords(): IntersectionObserverEntry[] {
        return takeRecordsMock();
      }
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
      toJSON: () => { },
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
    // Restore originals
    global.IntersectionObserver = originalIntersectionObserver;
    global.ResizeObserver = originalResizeObserver;
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;

    if (originalOffsetHeightDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "offsetHeight",
        originalOffsetHeightDescriptor
      );
    } else {
      // @ts-expect-error - cleanup of mocked property
      delete HTMLElement.prototype.offsetHeight;
    }

    if (originalClientHeightDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "clientHeight",
        originalClientHeightDescriptor
      );
    } else {
      // @ts-expect-error - cleanup of mocked property
      delete HTMLElement.prototype.clientHeight;
    }

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
    const props = createDefaultProps();
    render(
      <VirtualizedGalleryGrid
        {...props}
        canLoadMore={true}
        onLoadMore={vi.fn()}
        isMobile={true}
      />
    );
    props.scrollContainerRef.current!.scrollTop = 1;
    props.scrollContainerRef.current!.dispatchEvent(new Event("scroll"));

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
