"use client";

/**
 * GalleryThumbnail - Individual image thumbnail with hover actions
 * Follows SRP: Only manages single thumbnail display and interactions
 */

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Copy, Download } from "lucide-react";
import type { GeneratedImage } from "@/types/pollinations";

export interface GalleryThumbnailProps {
  /** Image to display */
  image: GeneratedImage;
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

export function GalleryThumbnail({
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
  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer",
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
        alt={image.prompt}
        fill
        className="object-cover transition-transform duration-200 group-hover:scale-105"
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
}
