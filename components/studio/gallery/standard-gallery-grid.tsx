import { useMobileDrawerVisibility } from "@/components/studio/mobile/mobile-history-drawer";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { ThumbnailItem } from "./thumbnail-item";
import {
  GalleryDirection,
  ThumbnailData,
  ThumbnailSize,
} from "./types";

interface StandardGalleryGridProps {
  images: ThumbnailData[];
  activeImageId?: string;
  selectedIds: Set<string>;
  selectionMode: boolean;
  thumbnailSize: ThumbnailSize;
  direction: GalleryDirection;
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

export const StandardGalleryGrid = React.memo(function StandardGalleryGrid({
  images,
  activeImageId,
  selectedIds,
  selectionMode,
  thumbnailSize,
  direction,
  onSelect,
  onCheckedChange,
  onLoadMore,
  canLoadMore = false,
  isLoadingMore = false,
  isMobile = false,
  scrollContainerRef,
}: StandardGalleryGridProps) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Track if component has mounted
  const [isMounted, setIsMounted] = React.useState(false);

  // Get mobile drawer visibility state (undefined when not in a drawer)
  const drawerState = useMobileDrawerVisibility();
  const isDrawerVisible = drawerState?.isVisible ?? true; // Default to true for desktop

  // Track when drawer becomes visible to add a small delay for animation
  const prevDrawerVisibleRef = React.useRef(isDrawerVisible);
  const [observerEnabled, setObserverEnabled] = React.useState(
    !isMobile || isDrawerVisible
  );

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Handle drawer visibility changes
  React.useEffect(() => {
    const wasVisible = prevDrawerVisibleRef.current;
    const isNowVisible = isDrawerVisible;

    // Drawer just became visible (opened)
    if (!wasVisible && isNowVisible && isMobile) {
      // Small delay to let drawer animation complete before enabling observer
      // This prevents the sentinel from being detected during the animation
      const timer = setTimeout(() => {
        setObserverEnabled(true);
      }, 350); // Vaul uses ~300ms animation

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

    prevDrawerVisibleRef.current = isNowVisible;
  }, [isDrawerVisible, isMobile]);

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

    // On mobile in a drawer, the actual scroll container is the drawer's container, not our scrollContainerRef
    // The drawer has its own scroll container that wraps the gallery
    // We need to find it by traversing up the DOM
    let actualScrollContainer = scrollContainer;
    if (isMobile && drawerState) {
      // Look for the drawer's scroll container (has overflow-y-auto and is a parent of our container)
      let parent = scrollContainer.parentElement;
      while (parent) {
        const styles = window.getComputedStyle(parent);
        if (styles.overflowY === "auto" || styles.overflowY === "scroll") {
          actualScrollContainer = parent as HTMLDivElement;
          break;
        }
        parent = parent.parentElement;
      }
    }

    // Debounce the loadMore call to prevent rapid-fire requests
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
          if (
            isMobile &&
            actualScrollContainer &&
            actualScrollContainer.scrollTop === 0
          ) {
            return;
          }
          debouncedLoadMore();
        }
      },
      {
        root: actualScrollContainer,
        // Desktop: 200px look-ahead for smooth scrolling
        // Mobile: no look-ahead - only trigger when sentinel is actually visible
        rootMargin: isMobile ? "0px" : "0px 0px 200px 0px",
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
  ]);

  return (
    <>
      <div
        className={cn(
          "p-2",
          direction === "horizontal"
            ? "flex gap-1.5 overflow-x-auto"
            : "grid gap-1.5",
          // Mobile always uses 3 columns; desktop respects user preference
          direction === "vertical" &&
            (isMobile
              ? "grid-cols-3"
              : {
                  "grid-cols-2": thumbnailSize === "lg",
                  "grid-cols-3": thumbnailSize === "md",
                  "grid-cols-4": thumbnailSize === "sm",
                })
        )}
        data-testid="gallery-grid"
      >
        {images.map((image) => (
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
            className={isMobile ? "w-full h-auto aspect-square" : undefined}
          />
        ))}
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
