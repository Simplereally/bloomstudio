"use client";

import {
  ActiveFilterBadges,
  HistoryFiltersDropdown,
  type HistoryFilterState,
} from "@/components/gallery/history-filters";
import type { Id } from "@/convex/_generated/dataModel";
import { useBulkDeleteGeneratedImages } from "@/hooks/mutations/use-delete-image";
import { useSetBulkVisibility } from "@/hooks/mutations/use-set-visibility";
import {
  useImageHistory,
  type HistoryFilters,
} from "@/hooks/queries/use-image-history";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { loadMyHistoryPage } from "@/app/_server/actions/history";
import { useUser } from "@clerk/nextjs";
import * as React from "react";
import {
  ImageGallery,
  type ImageGalleryProps,
  type ThumbnailData,
} from "./image-gallery";
import type { PaginatedGalleryResult } from "./types";

const INITIAL_FILTER_STATE: HistoryFilterState = {
  selectedVisibility: [],
  selectedModels: [],
};

const LIGHTBOX_PRELOAD_THRESHOLD = 5;

/**
 * Props for PersistentImageGallery - excludes props that are managed internally
 */
type PersistentImageGalleryProps = Omit<
  ImageGalleryProps,
  | "images"
  | "headerContent"
  | "isLoading"
  | "isExhausted"
  | "onMakeSelectedPublic"
  | "onMakeSelectedPrivate"
  | "onDeleteSelected"
  | "selectionMode"
  | "selectedIds"
  | "onSelectionChange"
  | "onToggleSelectionMode"
> & {
  /** Server-cached initial page (reduces Convex bandwidth on initial load) */
  initialPage?: PaginatedGalleryResult;
  /** Callback fired whenever the stable mapped images array changes */
  onImagesLoaded?: (images: ThumbnailData[]) => void;
};

/**
 * Smart component that fetches persistent image history from Convex
 * and displays it using the ImageGallery presentational component.
 *
 * HYBRID CACHING STRATEGY:
 * - Initial page: Uses server-cached data if provided (reduces Convex bandwidth)
 * - Real-time updates: Convex reactive hooks keep the first page fresh
 * - Load more: Uses server actions for subsequent pages (cached)
 *
 * This gives us the best of both worlds:
 * - Fast initial load from server cache
 * - Instant updates when new images are generated
 * - Reduced Convex bandwidth for pagination
 *
 * Performance: Manages selection state internally to avoid propagating
 * selection changes to parent components. This prevents unnecessary
 * re-renders when checking/unchecking items.
 *
 * Includes filter state management for visibility and model filtering.
 */
export function PersistentImageGallery(props: PersistentImageGalleryProps) {
  const { activeImageId, initialPage, onImagesLoaded, ...restProps } = props;

  const { user, isLoaded: isUserLoaded } = useUser();

  // ========================================
  // Internal Selection State (isolated from parent)
  // ========================================
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Ref for stable callbacks
  const selectedIdsRef = React.useRef(selectedIds);

  React.useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // Determine storage key based on user ID for account-specific preferences
  // IMPORTANT: Wait for user state to be loaded before using user-specific key
  // This prevents the key from changing from "anon" to user-specific after initial render,
  // which would cause useLocalStorage to re-read and trigger unnecessary re-renders/flicker
  const storageKey = React.useMemo(() => {
    if (!isUserLoaded) return "bloom:studio-filters:anon";
    return user?.id
      ? `bloom:studio-filters:${user.id}`
      : "bloom:studio-filters:anon";
  }, [user?.id, isUserLoaded]);

  // Filter state persisted to localStorage
  const [filterState, setFilterState] = useLocalStorage<HistoryFilterState>(
    storageKey,
    INITIAL_FILTER_STATE,
  );

  // Track mount count to skip cache reset during initial hydration
  // We need to skip at least 2 effect runs: initial mount + localStorage hydration
  const effectRunCountRef = React.useRef(0);

  // Track if component has completed initial hydration (prevents auto-load on mount)
  const [isHydrated, setIsHydrated] = React.useState(false);
  React.useEffect(() => {
    // Small delay to let all effects settle before enabling auto-load
    const timer = setTimeout(() => setIsHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Track if filters have been changed from default (affects caching strategy)
  const hasActiveFilters =
    filterState.selectedVisibility.length > 0 ||
    filterState.selectedModels.length > 0;

  // Mutations
  const setBulkVisibilityMutation = useSetBulkVisibility();
  const bulkDeleteMutation = useBulkDeleteGeneratedImages();

  // Convert filter state to query parameters
  const queryFilters: HistoryFilters = React.useMemo(
    () => ({
      visibility:
        filterState.selectedVisibility.length === 1
          ? filterState.selectedVisibility[0]
          : undefined,
      models:
        filterState.selectedModels.length > 0
          ? filterState.selectedModels
          : undefined,
    }),
    [filterState],
  );

  const modelsKey = queryFilters.models?.join(",") ?? "";

  // ========================================
  // Hybrid Data Strategy
  // ========================================
  // Use Convex reactive hook for real-time updates (new generations appear instantly)
  const convexQuery = useImageHistory(queryFilters);

  // Server-cached pages for "load more" (reduces Convex bandwidth)
  const [cachedPages, setCachedPages] = React.useState<ThumbnailData[]>([]);
  const [cachedCursor, setCachedCursor] = React.useState<string | null>(null);
  const [cachedIsDone, setCachedIsDone] = React.useState(false);
  const [isLoadingCached, setIsLoadingCached] = React.useState(false);

  // Initialize cached state from server-provided initial page (only if no filters)
  const initializedRef = React.useRef(false);
  React.useEffect(() => {
    if (initialPage && !initializedRef.current && !hasActiveFilters) {
      initializedRef.current = true;
      // We don't use the initial page data directly since Convex hook provides
      // the same data with reactivity. But we capture the cursor for "load more".
      setCachedCursor(initialPage.continueCursor || null);
      setCachedIsDone(initialPage.isDone);
    }
  }, [initialPage, hasActiveFilters]);

  // Reset cached state when filters change (but skip during initial hydration)
  // This prevents scroll position reset when localStorage filter values are loaded
  const prevVisibilityRef = React.useRef<string | undefined>(undefined);
  const prevModelsKeyRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    effectRunCountRef.current++;

    // Skip the first 2 effect runs to allow localStorage hydration to settle:
    // 1. Initial mount with default filter state
    // 2. Re-render after localStorage values are loaded
    // After that, any filter changes are user-initiated and should reset the cache
    if (effectRunCountRef.current <= 2) {
      prevVisibilityRef.current = queryFilters.visibility;
      prevModelsKeyRef.current = modelsKey;
      return;
    }

    // Check if filters actually changed
    const visibilityChanged =
      prevVisibilityRef.current !== queryFilters.visibility;
    const modelsChanged = prevModelsKeyRef.current !== modelsKey;

    if (visibilityChanged || modelsChanged) {
      setCachedPages([]);
      setCachedCursor(null);
      setCachedIsDone(false);
      initializedRef.current = false;

      prevVisibilityRef.current = queryFilters.visibility;
      prevModelsKeyRef.current = modelsKey;
    }
  }, [queryFilters.visibility, modelsKey]);

  // Combine Convex results with cached pages
  const convexResults = convexQuery.results;
  const convexStatus = convexQuery.status;
  const convexLoadMore = convexQuery.loadMore;

  // Determine overall status
  const isLoading = convexStatus === "LoadingFirstPage";
  const isLoadingMore = convexStatus === "LoadingMore" || isLoadingCached;

  // For exhausted state: check both Convex and cached
  // If there's no cachedCursor (no initialPage provided), consider cached as done
  const convexExhausted = convexStatus === "Exhausted";
  const effectivelyCachedDone = cachedIsDone || !cachedCursor;
  const isExhausted = convexExhausted && effectivelyCachedDone;
  const canLoadMore =
    convexStatus === "CanLoadMore" || (!cachedIsDone && cachedCursor);

  // Combined results: Convex reactive data + cached pages
  const results = React.useMemo(() => {
    // If we have cached pages, append them after Convex results
    // But avoid duplicates by checking IDs (cast to string for comparison)
    const convexIds = new Set(convexResults.map((r) => String(r._id)));
    const uniqueCachedPages = cachedPages.filter((p) => !convexIds.has(p.id));
    return [...convexResults, ...uniqueCachedPages];
  }, [convexResults, cachedPages]);

  // Load more handler - uses server action for cached pages
  const handleLoadMore = React.useCallback(async () => {
    // First, exhaust Convex pagination
    if (convexStatus === "CanLoadMore") {
      convexLoadMore(20);
      return;
    }

    // Then, load from server cache
    if (!cachedIsDone && cachedCursor && !isLoadingCached) {
      setIsLoadingCached(true);
      try {
        const result = await loadMyHistoryPage({
          cursor: cachedCursor,
          numItems: 20,
          filters: queryFilters,
        });

        // Map to ThumbnailData format
        const newImages: ThumbnailData[] = result.page.map((img) => ({
          id: img._id,
          _id: img._id,
          _creationTime: img._creationTime,
          url: img.url,
          originalUrl: img.originalUrl,
          visibility: img.visibility,
          model: img.model,
          contentType: img.contentType,
          prompt: "",
        }));

        setCachedPages((prev) => [...prev, ...newImages]);
        setCachedCursor(result.continueCursor || null);
        setCachedIsDone(result.isDone);
      } catch (error) {
        console.error("Failed to load more from cache:", error);
      } finally {
        setIsLoadingCached(false);
      }
    }
  }, [
    convexStatus,
    convexLoadMore,
    cachedCursor,
    cachedIsDone,
    isLoadingCached,
    queryFilters,
  ]);

  // Ref for stable handleLoadMore access (avoids effect re-runs when callback recreates)
  const handleLoadMoreRef = React.useRef(handleLoadMore);
  React.useEffect(() => {
    handleLoadMoreRef.current = handleLoadMore;
  }, [handleLoadMore]);

  // Auto-load more if we got an empty page but aren't done
  // Uses ref to avoid retriggering when handleLoadMore is recreated
  // Waits for hydration to complete to prevent auto-loading on mount
  React.useEffect(() => {
    if (
      isHydrated &&
      canLoadMore &&
      results.length === 0 &&
      !isLoading &&
      !isLoadingMore
    ) {
      handleLoadMoreRef.current();
    }
  }, [isHydrated, canLoadMore, results.length, isLoading, isLoadingMore]);

  // ========================================
  // Stable Image References (prevents full gallery re-render)
  // ========================================
  // When Convex pushes updates, the entire `results` array is replaced with new object references.
  // Without stabilization, every ThumbnailItem would re-render even if its data hasn't changed.
  // We use a cache map to preserve object references for unchanged images.
  const imageCache = React.useRef<Map<string, ThumbnailData>>(new Map());

  const mappedImages = React.useMemo(() => {
    const newCache = new Map<string, ThumbnailData>();

    const stableImages = results.map((img) => {
      // Handle both Convex results and cached ThumbnailData
      // Convex results have _id, cached ThumbnailData has id
      const id = "_id" in img ? String(img._id) : (img as ThumbnailData).id;

      const cached = imageCache.current.get(id);

      // Get values from either format
      const url = img.url;
      const originalUrl = (img as ThumbnailData).originalUrl;
      const visibility = img.visibility;
      const model = img.model;
      const contentType = img.contentType;
      const creationTime =
        "_creationTime" in img
          ? img._creationTime
          : (img as ThumbnailData)._creationTime;

      // Check if cached version is still valid (same data)
      // Only compare fields that would affect rendering
      if (
        cached &&
        cached.url === url &&
        cached.originalUrl === originalUrl &&
        cached.visibility === visibility &&
        cached.model === model &&
        cached.contentType === contentType
      ) {
        // Reuse cached object reference - prevents child re-render
        newCache.set(id, cached);
        return cached;
      }

      // Create new object for new/changed images
      const newImage: ThumbnailData = {
        id,
        _id: id,
        _creationTime: creationTime,
        url,
        originalUrl,
        visibility,
        model,
        contentType,
        prompt: "", // Placeholder - full data loaded on click via getById
      };

      newCache.set(id, newImage);
      return newImage;
    });

    // Update cache for next render

    imageCache.current = newCache;

    return stableImages;
  }, [results]);

  // Notify parent when mapped images change.
  // Store callback in a ref so that an unstable onImagesLoaded reference
  // from a parent doesn't re-trigger the effect (which would cause a render loop
  // if the parent sets state inside the callback and doesn't memoize it).
  const onImagesLoadedRef = React.useRef(onImagesLoaded);
  React.useEffect(() => {
    onImagesLoadedRef.current = onImagesLoaded;
  }, [onImagesLoaded]);

  React.useEffect(() => {
    onImagesLoadedRef.current?.(mappedImages);
  }, [mappedImages]);

  React.useEffect(() => {
    if (!activeImageId || !canLoadMore || isLoadingMore) {
      return;
    }

    const activeImageIndex = mappedImages.findIndex(
      (image) => image.id === activeImageId,
    );

    if (activeImageIndex < 0) {
      return;
    }

    const remainingImages = mappedImages.length - activeImageIndex - 1;

    if (remainingImages <= LIGHTBOX_PRELOAD_THRESHOLD) {
      handleLoadMore();
    }
  }, [activeImageId, canLoadMore, handleLoadMore, isLoadingMore, mappedImages]);

  // ========================================
  // Selection Handlers (stable callbacks)
  // ========================================
  const handleToggleSelectionMode = React.useCallback(() => {
    setSelectionMode((prev) => {
      // Clear selection when exiting selection mode
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  const handleSelectionChange = React.useCallback(
    (newSelection: Set<string>) => {
      setSelectedIds(newSelection);
    },
    [],
  );

  // ========================================
  // Bulk Action Handlers (stable callbacks using refs)
  // ========================================
  const handleMakeSelectedPublic = React.useCallback(async () => {
    const currentSelectedIds = selectedIdsRef.current;
    if (currentSelectedIds.size === 0) return;

    const imageIds = Array.from(currentSelectedIds) as Id<"generatedImages">[];
    try {
      await setBulkVisibilityMutation.mutateAsync({
        imageIds,
        visibility: "public",
      });
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Failed to make images public:", error);
      // The mutation hook already shows toasts
    }
  }, [setBulkVisibilityMutation]);

  const handleMakeSelectedPrivate = React.useCallback(async () => {
    const currentSelectedIds = selectedIdsRef.current;
    if (currentSelectedIds.size === 0) return;

    const imageIds = Array.from(currentSelectedIds) as Id<"generatedImages">[];
    try {
      await setBulkVisibilityMutation.mutateAsync({
        imageIds,
        visibility: "unlisted",
      });
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Failed to make images private:", error);
      // The mutation hook already shows toasts
    }
  }, [setBulkVisibilityMutation]);

  const handleDeleteSelected = React.useCallback(async () => {
    const currentSelectedIds = selectedIdsRef.current;
    if (currentSelectedIds.size === 0) return;

    const imageIds = Array.from(currentSelectedIds) as Id<"generatedImages">[];
    try {
      // Use bulk delete mutation - single Convex call, single toast
      await bulkDeleteMutation.mutateAsync(imageIds);
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Failed to delete images:", error);
      // The mutation hook already shows error toast
    }
  }, [bulkDeleteMutation]);

  // Header Parts
  const title = (
    <div className="font-semibold text-sm sm:text-xs flex items-center gap-2">
      History
      <span className="text-muted-foreground font-normal text-xs sm:text-[10px] bg-muted/50 px-2 sm:px-1.5 py-0.5 rounded-full border border-border/50 tabular-nums">
        {mappedImages.length}
      </span>
    </div>
  );

  const actions = (
    <HistoryFiltersDropdown
      filters={filterState}
      onFiltersChange={setFilterState}
    />
  );

  const secondaryHeader = hasActiveFilters ? (
    <ActiveFilterBadges
      filters={filterState}
      onFiltersChange={setFilterState}
    />
  ) : undefined;

  return (
    <ImageGallery
      {...restProps}
      selectionMode={selectionMode}
      selectedIds={selectedIds}
      onSelectionChange={handleSelectionChange}
      onToggleSelectionMode={handleToggleSelectionMode}
      images={mappedImages}
      title={title}
      actions={actions}
      secondaryHeader={secondaryHeader}
      isLoading={isLoading}
      isExhausted={isExhausted}
      onLoadMore={canLoadMore || isLoadingMore ? handleLoadMore : undefined}
      isLoadingMore={isLoadingMore}
      onMakeSelectedPublic={handleMakeSelectedPublic}
      onMakeSelectedPrivate={handleMakeSelectedPrivate}
      onDeleteSelected={handleDeleteSelected}
    />
  );
}
