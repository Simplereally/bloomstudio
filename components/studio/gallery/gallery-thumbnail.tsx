"use client";

/**
 * GalleryThumbnail - Individual image thumbnail with hover actions
 * Follows SRP: Only manages single thumbnail display and interactions
 * 
 * Performance: Wrapped in React.memo() to prevent unnecessary re-renders
 * when parent components re-render but thumbnail props haven't changed.
 */

import { VisibilityToggle } from "@/components/gallery/visibility-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Copy, Download, Trash2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";

/**
 * Lightweight data structure for gallery thumbnails.
 * Contains only the fields needed for rendering thumbnails.
 */
export interface ThumbnailImageData {
  id: string;
  _id?: string;
  url: string;
  prompt?: string;
  visibility?: "public" | "unlisted";
}

export interface GalleryThumbnailProps {
  /** Image to display */
  image: ThumbnailImageData;
  /** Whether this image is currently selected/active */
  isActive?: boolean;
  /** Whether this image is checked for bulk operations */
  isChecked?: boolean;
  /** Callback when thumbnail is clicked */
  onClick?: () => void;
  /** Callback to remove image */
  onRemove?: () => void;
  /** Callback to copy image URL */
  onCopy?: () => void;
  /** Callback to download image */
  onDownload?: () => void;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Whether to show selection checkbox */
  showCheckbox?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

/**
 * Memoized thumbnail component - only re-renders when props actually change.
 * This is critical for performance when rendering 100+ thumbnails.
 */
export const GalleryThumbnail = React.memo(function GalleryThumbnail({
  image,
  isActive = false,
  isChecked = false,
  onClick,
  onRemove,
  onCopy,
  onDownload,
  onCheckedChange,
  showCheckbox = false,
  size = "md",
  className,
}: GalleryThumbnailProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Reset loaded state when image changes to trigger animation again
  React.useEffect(() => {
    setIsLoaded(false);
  }, [image.url]);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer bg-muted",
        "border-2 transition-all duration-200",
        isActive ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/50",
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      data-testid="gallery-thumbnail"
    >
      {/* Image */}
      <Image
        src={image.url}
        alt={image.prompt || "Generated image"}
        fill
        className={cn(
          "object-cover transition-all duration-500 ease-out group-hover:scale-110",
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105 blur-sm"
        )}
        onLoad={() => setIsLoaded(true)}
        sizes={size === "lg" ? "128px" : size === "md" ? "96px" : "64px"}
        unoptimized
      />

      {/* Hover Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "flex flex-col justify-end p-1.5"
        )}
        data-testid="thumbnail-overlay"
      >
        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-1">
          {onCopy && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 bg-white/10 hover:bg-white/20 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                  data-testid="copy-action"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Copy URL</TooltipContent>
            </Tooltip>
          )}

          {onDownload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 bg-white/10 hover:bg-white/20 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  data-testid="download-action"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Download</TooltipContent>
            </Tooltip>
          )}

          {onRemove && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 bg-destructive/50 hover:bg-destructive/80 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  data-testid="remove-action"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Remove</TooltipContent>
            </Tooltip>
          )}

          {image._id && image.visibility && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div onClick={(e) => e.stopPropagation()}>
                  <VisibilityToggle
                    imageId={image._id as Id<"generatedImages">}
                    currentVisibility={image.visibility as "public" | "unlisted"}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {image.visibility === "public" ? "Visible to public" : "Private image"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Selection Checkbox */}
      {showCheckbox && (
        <div
          className={cn("absolute top-1 left-1 z-10", "opacity-0 group-hover:opacity-100 transition-opacity", isChecked && "opacity-100")}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => {
              onCheckedChange?.(checked as boolean);
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background/80 border-white/50"
            data-testid="thumbnail-checkbox"
          />
        </div>
      )}

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute inset-0 ring-2 ring-inset ring-primary/50 pointer-events-none" data-testid="active-indicator" />
      )}
    </Card>
  );
})
