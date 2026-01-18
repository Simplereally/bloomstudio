import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StandardGalleryGrid } from "./standard-gallery-grid";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ThumbnailItemProps } from "./thumbnail-item";

// Mock hooks
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(),
}));

// Mock ThumbnailItem to isolate grid testing
vi.mock("./thumbnail-item", () => ({
  ThumbnailItem: ({ image, className }: ThumbnailItemProps) => (
    <div data-testid="gallery-thumbnail" className={className}>
      {image.id}
    </div>
  ),
}));

const mockImages = Array.from({ length: 20 }, (_, i) => ({
  id: `img-${i}`,
  url: `https://example.com/img-${i}.jpg`,
  prompt: `Image ${i}`,
  params: { width: 1024, height: 1024 },
  timestamp: Date.now() - i * 1000,
}));

const createDefaultProps = () => ({
  images: mockImages,
  selectedIds: new Set<string>(),
  selectionMode: false,
  thumbnailSize: "md" as const,
  direction: "vertical" as const,
  onSelect: vi.fn(),
  onCheckedChange: vi.fn(),
  scrollContainerRef: { current: document.createElement("div") },
});

describe("StandardGalleryGrid", () => {
  let originalIntersectionObserver: typeof IntersectionObserver;
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
    vi.mocked(useIsMobile).mockReturnValue(false);

    // Mock IntersectionObserver
    originalIntersectionObserver = global.IntersectionObserver;
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
  });

  afterEach(() => {
    global.IntersectionObserver = originalIntersectionObserver;
    vi.clearAllMocks();
  });

  it("renders all images directly (no virtualization)", () => {
    render(<StandardGalleryGrid {...createDefaultProps()} />);
    expect(screen.getAllByTestId("gallery-thumbnail")).toHaveLength(20);
  });

  it("renders sentinel when canLoadMore is true", () => {
    render(
      <StandardGalleryGrid
        {...createDefaultProps()}
        canLoadMore={true}
        isLoadingMore={false}
      />
    );
    expect(screen.getByTestId("load-more-sentinel")).toBeInTheDocument();
  });

  it("uses 200px rootMargin on desktop infinite scroll", async () => {
    vi.useFakeTimers();
    render(
      <StandardGalleryGrid
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
    expect(options?.rootMargin).toBe("0px 0px 200px 0px");
    vi.useRealTimers();
  });

  it("uses 0px rootMargin on mobile infinite scroll", async () => {
    vi.useFakeTimers();
    vi.mocked(useIsMobile).mockReturnValue(true);
    render(
      <StandardGalleryGrid
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
    expect(options?.rootMargin).toBe("0px");
    vi.useRealTimers();
  });
});
