"use client";

/**
 * Sub-components for ImageGallery
 * Extracted to reduce main file complexity and line count
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
import { Separator } from "@/components/ui/separator";
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
import type { ThumbnailData } from "./types";
import { VirtualizedGalleryGrid } from "./virtualized-gallery-grid";

// ─────────────────────────────────────────────────────────────────────────────
// GalleryEmptyState
// ─────────────────────────────────────────────────────────────────────────────

interface GalleryEmptyStateProps {
  emptyContent?: React.ReactNode;
}

export function GalleryEmptyState({ emptyContent }: Readonly<GalleryEmptyStateProps>) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground min-h-[200px]"
      data-testid="gallery-empty"
    >
      {emptyContent ?? (
        <>
          <ImageOff className="h-12 w-12 mb-4 opacity-20" />
          <p>No images found</p>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GalleryGridRenderer
// ─────────────────────────────────────────────────────────────────────────────

interface GalleryGridRendererProps {
  images: ThumbnailData[];
  activeImageId?: string;
  selectedIds: Set<string>;
  selectionMode: boolean;
  thumbnailSize: "sm" | "md" | "lg";
  direction: "horizontal" | "vertical";
  onSelect: (image: ThumbnailData) => void;
  onCheckedChange: (id: string, checked: boolean) => void;
  onLoadMore?: () => void;
  canLoadMore: boolean;
  isLoadingMore: boolean;
  isMobile: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function GalleryGridRenderer({
  images,
  activeImageId,
  selectedIds,
  selectionMode,
  thumbnailSize,
  direction,
  onSelect,
  onCheckedChange,
  onLoadMore,
  canLoadMore,
  isLoadingMore,
  isMobile,
  scrollContainerRef,
}: Readonly<GalleryGridRendererProps>) {
  if (direction === "vertical") {
    return (
      <VirtualizedGalleryGrid
        images={images}
        activeImageId={activeImageId}
        selectedIds={selectedIds}
        selectionMode={selectionMode}
        thumbnailSize={thumbnailSize}
        onSelect={onSelect}
        onCheckedChange={onCheckedChange}
        onLoadMore={onLoadMore}
        canLoadMore={canLoadMore}
        isLoadingMore={isLoadingMore}
        isMobile={isMobile}
        scrollContainerRef={scrollContainerRef}
      />
    );
  }
  return (
    <StandardGalleryGrid
      images={images}
      activeImageId={activeImageId}
      selectedIds={selectedIds}
      selectionMode={selectionMode}
      thumbnailSize={thumbnailSize}
      direction={direction}
      onSelect={onSelect}
      onCheckedChange={onCheckedChange}
      onLoadMore={onLoadMore}
      canLoadMore={canLoadMore}
      isLoadingMore={isLoadingMore}
      isMobile={isMobile}
      scrollContainerRef={scrollContainerRef}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectAllControl
// ─────────────────────────────────────────────────────────────────────────────

interface SelectAllControlProps {
  images: ThumbnailData[];
  selectedIds: Set<string>;
  isMobile: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function SelectAllControl({
  images,
  selectedIds,
  isMobile,
  onSelectAll,
  onDeselectAll,
}: Readonly<SelectAllControlProps>) {
  const allSelected = images.length > 0 && images.every((img) => selectedIds.has(img.id));
  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
      <Checkbox
        id="gallery-select-all"
        checked={allSelected}
        onCheckedChange={(checked) => {
          if (checked) {
            onSelectAll();
          } else {
            onDeselectAll();
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BulkActionsMenu
// ─────────────────────────────────────────────────────────────────────────────

interface BulkActionsMenuProps {
  selectedIds: Set<string>;
  isMobile: boolean;
  onDeleteSelected?: () => void;
  onMakeSelectedPublic?: () => void;
  onMakeSelectedPrivate?: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function BulkActionsMenu({
  selectedIds,
  isMobile,
  onDeleteSelected,
  onMakeSelectedPublic,
  onMakeSelectedPrivate,
  onSelectAll,
  onDeselectAll,
}: Readonly<BulkActionsMenuProps>) {
  const iconSize = isMobile ? "h-5 w-5" : "h-4 w-4";
  const buttonSize = isMobile ? "h-10 w-10" : "h-8 w-8";
  const menuItemClass = isMobile ? "py-3 text-base" : undefined;
  const disabled = selectedIds.size === 0;

  return (
    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
      {onDeleteSelected && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-destructive hover:text-destructive hover:bg-destructive/10",
            buttonSize
          )}
          onClick={onDeleteSelected}
          disabled={disabled}
          data-testid="delete-selected"
          title="Delete selected"
        >
          <Trash2 className={iconSize} />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={buttonSize}
            disabled={disabled}
            data-testid="bulk-actions-menu"
            title="More actions"
          >
            <MoreHorizontal className={iconSize} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onSelectAll} className={menuItemClass}>
            Select All
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDeselectAll} className={menuItemClass}>
            Deselect All
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {onMakeSelectedPublic && (
            <DropdownMenuItem
              onClick={onMakeSelectedPublic}
              data-testid="make-public"
              className={menuItemClass}
            >
              <Eye className="mr-2 h-4 w-4" />
              Make Public
            </DropdownMenuItem>
          )}
          {onMakeSelectedPrivate && (
            <DropdownMenuItem
              onClick={onMakeSelectedPrivate}
              data-testid="make-private"
              className={menuItemClass}
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Make Private
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectionToggleButton
// ─────────────────────────────────────────────────────────────────────────────

interface SelectionToggleButtonProps {
  selectionMode: boolean;
  isMobile: boolean;
  imagesEmpty: boolean;
  onToggle: () => void;
}

export function SelectionToggleButton({
  selectionMode,
  isMobile,
  imagesEmpty,
  onToggle,
}: Readonly<SelectionToggleButtonProps>) {
  return (
    <>
      {isMobile && (
        <Separator orientation="vertical" className="mx-1 bg-white w-px h-6" />
      )}
      <Button
        variant={selectionMode ? "default" : "outline"}
        size={isMobile ? "default" : "sm"}
        onClick={onToggle}
        className={cn(
          "font-medium transition-all min-w-[70px]",
          isMobile ? "h-10 text-sm" : "h-8 text-xs",
          !selectionMode && "text-muted-foreground hover:text-foreground"
        )}
        data-testid="toggle-selection"
        disabled={imagesEmpty && !selectionMode}
      >
        {selectionMode ? "Done" : "Select"}
      </Button>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GalleryLoadingSpinner
// ─────────────────────────────────────────────────────────────────────────────

export function GalleryLoadingSpinner() {
  return (
    <div
      className="flex items-center justify-center h-full min-h-[200px]"
      data-testid="gallery-loading"
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GalleryHeaderLeft
// ─────────────────────────────────────────────────────────────────────────────

interface GalleryHeaderLeftProps {
  selectionMode: boolean;
  images: ThumbnailData[];
  selectedIds: Set<string>;
  isMobile: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function GalleryHeaderLeft({
  selectionMode,
  images,
  selectedIds,
  isMobile,
  onSelectAll,
  onDeselectAll,
  title,
  actions,
  headerContent,
}: Readonly<GalleryHeaderLeftProps>) {
  if (selectionMode) {
    return (
      <SelectAllControl
        images={images}
        selectedIds={selectedIds}
        isMobile={isMobile}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
      />
    );
  }
  return (
    <div className="flex items-center gap-3 animate-in fade-in duration-200">
      {title ? (
        <div className={cn("font-semibold", isMobile && "text-base")}>{title}</div>
      ) : (
        !actions && headerContent
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GalleryHeaderRight
// ─────────────────────────────────────────────────────────────────────────────

interface GalleryHeaderRightProps {
  selectionMode: boolean;
  selectedIds: Set<string>;
  isMobile: boolean;
  images: ThumbnailData[];
  onDeleteSelected?: () => void;
  onMakeSelectedPublic?: () => void;
  onMakeSelectedPrivate?: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleSelectionMode?: () => void;
  actions?: React.ReactNode;
}

export function GalleryHeaderRight({
  selectionMode,
  selectedIds,
  isMobile,
  images,
  onDeleteSelected,
  onMakeSelectedPublic,
  onMakeSelectedPrivate,
  onSelectAll,
  onDeselectAll,
  onToggleSelectionMode,
  actions,
}: Readonly<GalleryHeaderRightProps>) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex items-center gap-1">
        {selectionMode ? (
          <BulkActionsMenu
            selectedIds={selectedIds}
            isMobile={isMobile}
            onDeleteSelected={onDeleteSelected}
            onMakeSelectedPublic={onMakeSelectedPublic}
            onMakeSelectedPrivate={onMakeSelectedPrivate}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
          />
        ) : (
          <div className="animate-in fade-in duration-200">{actions}</div>
        )}
      </div>
      {onToggleSelectionMode && (
        <SelectionToggleButton
          selectionMode={selectionMode}
          isMobile={isMobile}
          imagesEmpty={images.length === 0}
          onToggle={onToggleSelectionMode}
        />
      )}
    </div>
  );
}
