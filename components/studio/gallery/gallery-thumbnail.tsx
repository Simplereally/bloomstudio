"use client";

/**
 * GalleryThumbnail - Individual image/video thumbnail for gallery display
 * Follows SRP: Only manages single thumbnail display and interactions
 * 
 * Performance: Wrapped in React.memo() to prevent unnecessary re-renders
 * when parent components re-render but thumbnail props haven't changed.
 * 
 * Selection: When in selection mode (showCheckbox=true), clicking anywhere
 * on the thumbnail toggles selection. Users can also use the bulk actions
 * menu for operations like copy, download, delete, etc.
 */

import { isVideoContent } from "@/components/ui/media-player";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Play } from "lucide-react";
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
  /** MIME type of the content (e.g., "video/mp4", "image/jpeg") */
  contentType?: string;
}

export interface GalleryThumbnailProps {
  /** Image to display */
  image: ThumbnailImageData;
  /** Whether this image is currently selected/active */
  isActive?: boolean;
  /** Whether this image is checked for bulk operations */
  isChecked?: boolean;
  /** Callback when thumbnail is clicked (used for viewing image in canvas) */
  onClick?: () => void;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Whether selection mode is active - clicking toggles selection */
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
  onCheckedChange,
  showCheckbox = false,
  size = "md",
  className,
}: GalleryThumbnailProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);

  // Reset loaded state when image changes to trigger animation again
  React.useEffect(() => {
    setIsLoaded(false);
    setVideoError(false);
  }, [image.url]);

  // Handle click - toggle selection in selection mode, otherwise call onClick
  const handleClick = React.useCallback(() => {
    if (showCheckbox) {
      // In selection mode, clicking anywhere toggles selection
      onCheckedChange?.(!isChecked);
    } else {
      // Normal mode - call the onClick handler (view in canvas)
      onClick?.();
    }
  }, [showCheckbox, onClick, onCheckedChange, isChecked]);

  const isVideo = isVideoContent(image.contentType, image.url);
  // Check if the URL is actually an image (thumbnail) despite being video content
  // This happens when we use a generated thumbnail for a video
  const isVideoThumbnail = isVideo && (/\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(image.url) || image.url.includes("/thumbnails/"));
  // Show video element only if it's a video URL and we haven't had a loading error
  const showAsVideo = isVideo && !isVideoThumbnail && !videoError;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer bg-muted",
        "border-2 transition-all duration-200",
        isActive ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/50",
        // Add selected state styling
        showCheckbox && isChecked && "border-primary ring-2 ring-primary/30",
        sizeClasses[size],
        className
      )}
      onClick={handleClick}
      data-testid="gallery-thumbnail"
    >
      {/* Video player - only if it's a real video URL */}
      {showAsVideo ? (
        <video
          src={`${image.url}#t=0.001`}
          muted
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105 blur-sm"
          )}
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setVideoError(true)}
        />
      ) : isVideo && videoError ? (
        /* Video placeholder when thumbnail is unavailable and video fails to load */
        <div
          className={cn(
            "absolute inset-0 w-full h-full flex items-center justify-center bg-muted transition-all duration-500 ease-out",
            "opacity-100 scale-100"
          )}
        >
          <Play className="h-6 w-6 text-muted-foreground" />
        </div>
      ) : (
        /* Image thumbnail (for images OR video thumbnails) */
        <Image
          src={image.url}
          alt={image.prompt || "Generated image"}
          fill
          className={cn(
            "object-cover transition-all duration-500 ease-out",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105 blur-sm"
          )}
          onLoad={() => setIsLoaded(true)}
          sizes={size === "lg" ? "128px" : size === "md" ? "96px" : "64px"}
          unoptimized
        />
      )}

      {/* Video indicator - show if it's video content (even if showing thumbnail) */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-1.5 backdrop-blur-sm">
            <Play className="h-3 w-3 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Selection Indicator - shown when in selection mode */}
      {showCheckbox && (
        <div
          className={cn(
            "absolute top-1 left-1 z-10 flex items-center justify-center",
            "h-5 w-5 rounded-full border-2 transition-all duration-200",
            isChecked
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-background/80 border-white/50 opacity-0 group-hover:opacity-100",
            isChecked && "opacity-100"
          )}
          data-testid="selection-indicator"
        >
          {isChecked && <Check className="h-3 w-3" />}
        </div>
      )}

      {/* Active Indicator */}
      {isActive && !showCheckbox && (
        <div className="absolute inset-0 ring-2 ring-inset ring-primary/50 pointer-events-none" data-testid="active-indicator" />
      )}
    </Card>
  );
})
