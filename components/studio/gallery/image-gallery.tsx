"use client";

/**
 * ImageGallery - Grid of generated images with scroll and selection
 * Follows SRP: Only manages gallery grid display
 *
 * Performance: Uses virtualization for large galleries (50+ images)
 * to only render visible thumbnails.
 */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Eye,
  EyeOff,
  ImageOff,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { StandardGalleryGrid } from "./standard-gallery-grid";
import { ThumbnailData } from "./types";
import { VirtualizedGalleryGrid } from "./virtualized-gallery-grid";

// Re-export ThumbnailData for external consumers
export type { ThumbnailData };

// HACK: Suppress "flushSync was called from inside a lifecycle method" warning
// This is a known issue with TanStack Virtual v3 and React 19 where disabling flushSync
// causes performance regressions, but keeping it enabled triggers this console error.
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("flushSync was called from inside a lifecycle method")
  ) {
    return;
  }
  originalError.apply(console, args);
};

export interface ImageGalleryProps {
  /** Array of thumbnail data for display */
  images: ThumbnailData[];
  /** Currently active/selected image ID */
  activeImageId?: string;
  /** Callback when an image is selected (clicked to view in canvas) */
  onSelectImage?: (image: ThumbnailData) => void;
  /** Whether bulk selection mode is enabled */
  selectionMode?: boolean;
  /** Set of selected image IDs */
  selectedIds?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /** Callback to toggle selection mode */
  onToggleSelectionMode?: () => void;
  /** Callback to delete selected images */
  onDeleteSelected?: () => void;
  /** Callback to make selected images public */
  onMakeSelectedPublic?: () => void;
  /** Callback to make selected images private */
  onMakeSelectedPrivate?: () => void;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
  /** Thumbnail size */
  thumbnailSize?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
  /** Callback to load more images */
  onLoadMore?: () => void;
  /** Whether more images are being loaded */
  isLoadingMore?: boolean;
  /** Whether initial data is loading */
  isLoading?: boolean;
  /** Whether all data has been loaded */
  isExhausted?: boolean;
  /** Optional content to render when empty and exhausted */
  emptyContent?: React.ReactNode;
  /** Title content (left side of header) */
  title?: React.ReactNode;
  /** Actions content (right side of header, before select button) */
  actions?: React.ReactNode;
  /** Secondary header content (below main header, e.g. filter badges) */
  secondaryHeader?: React.ReactNode;
  /** @deprecated Use title, actions, and secondaryHeader instead */
  headerContent?: React.ReactNode;
}

export const ImageGallery = React.memo(function ImageGallery({
  images,
  activeImageId,
  onSelectImage,
  selectionMode = false,
  selectedIds = new Set(),
  onSelectionChange,
  onToggleSelectionMode,
  onDeleteSelected,
  onMakeSelectedPublic,
  onMakeSelectedPrivate,
  direction = "vertical",
  thumbnailSize = "md",
  className,
  onLoadMore,
  isLoadingMore = false,
  isLoading = false,
  isExhausted = false,
  emptyContent,
  title,
  actions,
  secondaryHeader,
  headerContent,
}: ImageGalleryProps) {
  const isMobile = useIsMobile();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Expose scroll container ref to window for global access/debugging if needed
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      interface GalleryWindow extends Window {
        __galleryScrollRef?: React.RefObject<HTMLDivElement | null>;
      }
      (window as GalleryWindow).__galleryScrollRef = scrollContainerRef;
    }
  }, []);

  const handleSelect = React.useCallback(
    (image: ThumbnailData) => {
      if (selectionMode) {
        // Toggle selection
        const newSelectedIds = new Set(selectedIds);
        if (newSelectedIds.has(image.id)) {
          newSelectedIds.delete(image.id);
        } else {
          newSelectedIds.add(image.id);
        }
        onSelectionChange?.(newSelectedIds);
      } else {
        // Normal selection
        onSelectImage?.(image);
      }
    },
    [selectionMode, selectedIds, onSelectionChange, onSelectImage],
  );

  const handleCheckedChange = React.useCallback(
    (id: string, checked: boolean) => {
      const newSelectedIds = new Set(selectedIds);
      if (checked) {
        newSelectedIds.add(id);
      } else {
        newSelectedIds.delete(id);
      }
      onSelectionChange?.(newSelectedIds);
    },
    [selectedIds, onSelectionChange],
  );

  const handleSelectAll = React.useCallback(() => {
    const allIds = new Set(images.map((img) => img.id));
    onSelectionChange?.(allIds);
  }, [images, onSelectionChange]);

  const handleDeselectAll = React.useCallback(() => {
    onSelectionChange?.(new Set());
  }, [onSelectionChange]);

  const canLoadMore = !isExhausted && !isLoading;

  const renderGalleryContent = () => {
    return (
      <>
        {images.length === 0 && !isLoading && isExhausted ? (
          <div
            className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground min-h-[200px]"
            data-testid="gallery-empty"
          >
            {emptyContent || (
              <>
                <ImageOff className="h-12 w-12 mb-4 opacity-20" />
                <p>No images found</p>
              </>
            )}
          </div>
        ) : (
          <>
            {direction === "vertical" ? (
              // Virtualized grid for large datasets with infinite scroll
              // Always use virtualization for vertical lists to prevent component swapping/re-mounting
              <VirtualizedGalleryGrid
                images={images}
                activeImageId={activeImageId}
                selectedIds={selectedIds}
                selectionMode={selectionMode}
                thumbnailSize={thumbnailSize}
                onSelect={handleSelect}
                onCheckedChange={handleCheckedChange}
                onLoadMore={onLoadMore}
                canLoadMore={canLoadMore}
                isLoadingMore={isLoadingMore}
                isMobile={isMobile}
                scrollContainerRef={scrollContainerRef}
              />
            ) : (
              // Standard grid for horizontal layout with infinite scroll
              <StandardGalleryGrid
                images={images}
                activeImageId={activeImageId}
                selectedIds={selectedIds}
                selectionMode={selectionMode}
                thumbnailSize={thumbnailSize}
                direction={direction}
                onSelect={handleSelect}
                onCheckedChange={handleCheckedChange}
                onLoadMore={onLoadMore}
                canLoadMore={canLoadMore}
                isLoadingMore={isLoadingMore}
                isMobile={isMobile}
                scrollContainerRef={scrollContainerRef}
              />
            )}
            {/* Loading state for initial load (images might be empty but loading is true) */}
            {isLoading && images.length === 0 && (
              <div
                className="flex items-center justify-center h-full min-h-[200px]"
                data-testid="gallery-loading"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}
            {/* Loading state for bottom of list is handled inside the Grid components via LoadMore sentinel */}
          </>
        )}
      </>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        isMobile ? "min-h-0 w-full" : "h-full overflow-hidden",
        className,
      )}
      data-testid="image-gallery"
    >
      <div
        className={cn(
          "flex flex-col bg-background shrink-0 border-b z-20 transition-all duration-200",
          isMobile && "sticky top-0"
        )}
      >
        <div className={cn("flex items-center justify-between px-3", isMobile ? "h-14" : "h-12")}>
          {/* Left Side: Title OR Select All Controls */}
          <div className="flex items-center gap-3 min-w-0">
            {selectionMode ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <Checkbox
                  id="gallery-select-all"
                  checked={
                    images.length > 0 &&
                    images.every((img) => selectedIds.has(img.id))
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleSelectAll();
                    } else {
                      handleDeselectAll();
                    }
                  }}
                  className={isMobile ? "h-5 w-5" : undefined}
                  data-testid="select-all"
                />
                <label
                  htmlFor="gallery-select-all"
                  className={cn(
                    "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none",
                    isMobile ? "text-sm" : "text-xs"
                  )}
                >
                  Select All
                </label>
                {selectedIds.size > 0 && (
                  <span className={cn(
                    "text-muted-foreground ml-1 tabular-nums animate-in fade-in zoom-in-50 duration-200",
                    isMobile ? "text-xs" : "text-[10px]"
                  )}>
                    {selectedIds.size} selected
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 animate-in fade-in duration-200">
                {title ? (
                  <div className={cn("font-semibold", isMobile && "text-base")}>{title}</div>
                ) : (
                  !actions && headerContent
                )}
              </div>
            )}
          </div>

          {/* Right Side: Actions | Separator | Select Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Contextual Actions Zone: Filters (Normal) or Bulk Actions (Selection) */}
            <div className="flex items-center gap-1">
              {selectionMode ? (
                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                  {onDeleteSelected && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "text-destructive hover:text-destructive hover:bg-destructive/10",
                        isMobile ? "h-10 w-10" : "h-8 w-8"
                      )}
                      onClick={onDeleteSelected}
                      disabled={selectedIds.size === 0}
                      data-testid="delete-selected"
                      title="Delete selected"
                    >
                      <Trash2 className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(isMobile ? "h-10 w-10" : "h-8 w-8")}
                        disabled={selectedIds.size === 0}
                        data-testid="bulk-actions-menu"
                        title="More actions"
                      >
                        <MoreHorizontal className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleSelectAll} className={cn(isMobile && "py-3 text-base")}>
                        Select All
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeselectAll} className={cn(isMobile && "py-3 text-base")}>
                        Deselect All
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {onMakeSelectedPublic && (
                        <DropdownMenuItem
                          onClick={onMakeSelectedPublic}
                          data-testid="make-public"
                          className={cn(isMobile && "py-3 text-base")}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Make Public
                        </DropdownMenuItem>
                      )}
                      {onMakeSelectedPrivate && (
                        <DropdownMenuItem
                          onClick={onMakeSelectedPrivate}
                          data-testid="make-private"
                          className={cn(isMobile && "py-3 text-base")}
                        >
                          <EyeOff className="mr-2 h-4 w-4" />
                          Make Private
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="animate-in fade-in duration-200">
                  {actions}
                </div>
              )}
            </div>

            {/* Anchored Navigation Zone */}
            {onToggleSelectionMode && (
              <>
                <Separator orientation="vertical" className={cn("mx-1", isMobile ? "h-8" : "h-6")} />

                <Button
                  variant={selectionMode ? "default" : "outline"}
                  size={isMobile ? "default" : "sm"}
                  onClick={onToggleSelectionMode}
                  className={cn(
                    "font-medium transition-all min-w-[70px]",
                    isMobile ? "h-10 text-sm" : "h-8 text-xs",
                    !selectionMode && "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid="toggle-selection"
                  disabled={images.length === 0 && !selectionMode}
                >
                  {selectionMode ? "Done" : "Select"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Secondary Header (Active Filter Badges) - Only show in normal mode to save space/reduce noise in selection mode? 
            actually, user might want to see what they are selecting from. keeping it. */}
        {secondaryHeader && (
          <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1 fade-in duration-200">
            {secondaryHeader}
          </div>
        )}
      </div>

      {isMobile ? (
        // Mobile: Render direct div to allow parent (Drawer) to handle scrolling
        <div
          className="flex-1 min-h-0"
          ref={scrollContainerRef}
          data-testid="gallery-scroll-container-mobile"
        >
          {renderGalleryContent()}
        </div>
      ) : (
        // Desktop: Use ScrollArea for internal scrolling
        <ScrollArea
          className="flex-1 overflow-hidden"
          viewportRef={scrollContainerRef}
          data-testid="gallery-scroll"
        >
          {renderGalleryContent()}
        </ScrollArea>
      )}
    </div>
  );
});
