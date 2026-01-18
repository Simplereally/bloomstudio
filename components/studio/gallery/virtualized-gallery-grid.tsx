import { useMobileDrawerVisibility } from "@/components/studio/mobile/mobile-history-drawer";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { ThumbnailItem } from "./thumbnail-item";
import {
  GAP_SIZE,
  GRID_COLUMNS,
  MOBILE_COLUMNS,
  PADDING,
  THUMBNAIL_SIZES,
  ThumbnailData,
  ThumbnailSize,
} from "./types";
import { useVirtualizer } from "@tanstack/react-virtual";

interface VirtualizedGalleryGridProps {
  images: ThumbnailData[];
  activeImageId?: string;
  selectedIds: Set<string>;
  selectionMode: boolean;
  thumbnailSize: ThumbnailSize;
  onSelect: (image: ThumbnailData) => void;
  onCheckedChange: (id: string, checked: boolean) => void;
  /** Callback to load more images when reaching the end */
  onLoadMore?: () => void;
  /** Whether more content can be loaded */
  canLoadMore?: boolean;
  /** Whether content is currently being loaded */
  isLoadingMore?: boolean;
  /** Whether running on mobile device */
  isMobile?: boolean;
  /** Ref to the scroll container (provided by parent) */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const VirtualizedGalleryGrid = React.memo(function VirtualizedGalleryGrid({
  images,
  activeImageId,
  selectedIds,
  selectionMode,
  thumbnailSize,
  onSelect,
  onCheckedChange,
  onLoadMore,
  canLoadMore = false,
  isLoadingMore = false,
  isMobile = false,
  scrollContainerRef,
}: VirtualizedGalleryGridProps) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Mobile always uses 3 columns; desktop respects user preference
  const columns = isMobile ? MOBILE_COLUMNS : GRID_COLUMNS[thumbnailSize];

  // Dynamic row height calculation for mobile
  // On mobile, items are w-full (fluid) with aspect-square
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Use a resize observer to track container width for dynamic height calculation
  React.useEffect(() => {
    if (!scrollContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, [scrollContainerRef]);

  // Calculate row height based on width for mobile, or fixed size for desktop
  let rowHeight: number;

  if (isMobile) {
    // Mobile: fluid width aspect square
    // Width available for items = containerWidth - (padding left + padding right) - ((columns - 1) * gap)
    // Item width = Available width / columns
    // Fix: bunched up images. If container width is very small (e.g. during animation), use a safe fallback.
    // 100px is a safe minimum - if smaller, we're likely in a transition state.
    const effectiveContainerWidth =
      containerWidth > 100
        ? containerWidth
        : typeof window !== "undefined"
        ? window.innerWidth
        : 400;
    const availableWidth =
      effectiveContainerWidth - PADDING * 2 - (columns - 1) * GAP_SIZE;
    const itemWidth = availableWidth / columns;
    rowHeight = itemWidth + GAP_SIZE;
  } else {
    // Desktop: fixed size
    const itemSize = THUMBNAIL_SIZES[thumbnailSize];
    rowHeight = itemSize + GAP_SIZE;
  }

  // Calculate number of rows
  const rowCount = Math.ceil(images.length / columns);

  const getScrollElement = React.useCallback(
    () => scrollContainerRef.current,
    [scrollContainerRef]
  );
  const estimateSize = React.useCallback(() => rowHeight, [rowHeight]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement,
    estimateSize,
    overscan: 5, // Render 5 extra rows above/below viewport
    // Disable flushSync to prevent React warning about flushSync in lifecycle methods during render
    // This is a known issue with TanStack Virtual v3 and React 19
    useFlushSync: true,
  });

  // Force virtualizer to recalculate when row height changes
  // This is critical for mobile where container width changes (e.g. drawer opening)
  // affecting the row height calculation
  React.useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, rowHeight]);

  const virtualRows = virtualizer.getVirtualItems();

  // Track if component has mounted
  const [isMounted, setIsMounted] = React.useState(false);

  // Get mobile drawer visibility state (undefined when not in a drawer)
  const drawerState = useMobileDrawerVisibility();
  const isDrawerVisible = drawerState?.isVisible ?? true; // Default to true for desktop
  const [hasUserScrolled, setHasUserScrolled] = React.useState(false);

  // Track when drawer becomes visible to add a small delay for animation
  const prevDrawerVisibleRef = React.useRef(isDrawerVisible);
  const [observerEnabled, setObserverEnabled] = React.useState(
    !isMobile || (isDrawerVisible && hasUserScrolled)
  );

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!hasUserScrolled && el.scrollTop > 0) {
        setHasUserScrolled(true);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef, hasUserScrolled]);

  // Handle drawer visibility changes
  React.useEffect(() => {
    const wasVisible = prevDrawerVisibleRef.current;
    const isNowVisible = isDrawerVisible;

    // Drawer just became visible (opened)
    if (!wasVisible && isNowVisible && isMobile) {
      // Small delay to let drawer animation complete before enabling observer
      // This prevents the sentinel from being detected during the animation
      const timer = setTimeout(() => {
        setObserverEnabled(hasUserScrolled);
      }, 250); // Animation reduced to 200ms + 50ms buffer

      return () => clearTimeout(timer);
    }

    // Drawer just became hidden (closed)
    if (wasVisible && !isNowVisible && isMobile) {
      setObserverEnabled(false);
    }

    // Desktop or drawer already in correct state
    if (!isMobile) {
      setObserverEnabled(true);
    }

    if (isMobile && isNowVisible && hasUserScrolled) {
      setObserverEnabled(true);
    }

    prevDrawerVisibleRef.current = isNowVisible;
  }, [isDrawerVisible, isMobile, hasUserScrolled]);

  // Infinite scroll: trigger loadMore when sentinel becomes visible
  React.useEffect(() => {
    // Wait for mount and observer to be enabled
    if (!isMounted || !observerEnabled) return;

    const sentinel = sentinelRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (
      !sentinel ||
      !scrollContainer ||
      !onLoadMore ||
      !canLoadMore ||
      isLoadingMore
    ) {
      return;
    }

    // Debounce to prevent rapid-fire requests
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedLoadMore = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (canLoadMore && !isLoadingMore) {
          onLoadMore();
        }
      }, 100);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && canLoadMore && !isLoadingMore) {
          // On mobile, only trigger loadMore if user has actually scrolled
          // This prevents automatic fetching when drawer opens (scrollTop is 0)
          // The IntersectionObserver fires immediately on observe() if target is visible,
          // which can happen during drawer animation before layout stabilizes
          if (isMobile && drawerState && !hasUserScrolled) {
            return;
          }
          debouncedLoadMore();
        }
      },
      {
        root: scrollContainer,
        // Desktop & Mobile: 800px look-ahead for aggressive pre-fetching
        // This triggers loading well before the user reaches the bottom
        rootMargin: "0px 0px 800px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [
    isMounted,
    observerEnabled,
    onLoadMore,
    canLoadMore,
    isLoadingMore,
    isMobile,
    drawerState,
    scrollContainerRef,
    hasUserScrolled,
  ]);

  // Failsafe: Check if we need to load more immediately after a load finishes
  // This handles cases where the observer might not re-fire (e.g. if we are already intersecting)
  React.useEffect(() => {
    if (!isLoadingMore && canLoadMore && isMounted && onLoadMore) {
      if (isMobile && drawerState && !hasUserScrolled) {
        return;
      }
      // Small delay to allow layout to settle
      const timer = setTimeout(() => {
        const sentinel = sentinelRef.current;
        const scrollContainer = scrollContainerRef.current;

        if (sentinel && scrollContainer) {
          const sentinelRect = sentinel.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const rootMargin = 800; // Match the 800px margin in IntersectionObserver

          // If sentinel top is above (container bottom + margin)
          // It implies sentinel is inside the "look ahead" zone
          // Also check if sentinel is below container top (to ensure it's not way above viewport)
          if (
            sentinelRect.top <= containerRect.bottom + rootMargin &&
            sentinelRect.bottom >= containerRect.top
          ) {
            // On mobile, also check scrollTop to respect the "don't load on open" rule
            if (isMobile && drawerState && scrollContainer.scrollTop === 0) {
              return;
            }
            onLoadMore();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    isLoadingMore,
    canLoadMore,
    isMounted,
    onLoadMore,
    isMobile,
    drawerState,
    scrollContainerRef,
    hasUserScrolled,
  ]);

  return (
    <>
      <div
        className="relative w-full"
        style={{
          height: `${virtualizer.getTotalSize() + PADDING * 2}px`,
        }}
        data-testid="gallery-grid"
      >
        {virtualRows.map((virtualRow) => {
          const rowStartIndex = virtualRow.index * columns;
          const rowImages = images.slice(
            rowStartIndex,
            rowStartIndex + columns
          );

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full grid gap-1.5"
              style={{
                height: `${rowHeight}px`,
                transform: `translateY(${virtualRow.start + PADDING}px)`,
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                paddingLeft: `${PADDING}px`,
                paddingRight: `${PADDING}px`,
              }}
              data-index={virtualRow.index}
            >
              {rowImages.map((image) => (
                <ThumbnailItem
                  key={image.id}
                  image={image}
                  isActive={activeImageId === image.id}
                  isChecked={selectedIds.has(image.id)}
                  onSelect={onSelect}
                  onCheckedChange={onCheckedChange}
                  showCheckbox={selectionMode}
                  size={thumbnailSize}
                  // On mobile, force fluid width and aspect ratio
                  // On desktop, rely on the size prop (handled by GalleryThumbnail internally)
                  className={
                    isMobile ? "w-full h-auto aspect-square" : undefined
                  }
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Infinite scroll sentinel - triggers load more when visible */}
      {(canLoadMore || isLoadingMore) && (
        <div
          ref={sentinelRef}
          className="flex justify-center items-center py-4"
          data-testid="load-more-sentinel"
        >
          {isLoadingMore && (
            <Loader2
              className="h-4 w-4 animate-spin text-muted-foreground"
              data-testid="loading-spinner"
            />
          )}
        </div>
      )}
    </>
  );
});
