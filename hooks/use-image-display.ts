"use client";

/**
 * useImageDisplay Hook
 *
 * Hook for managing image display state and actions.
 * Integrates TanStack Query for download operations.
 */

import { useDownloadImage } from "@/hooks/queries";
import { showErrorToast, showSuccessToast } from "@/lib/errors";
import type { GeneratedImage } from "@/types/pollinations";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Return type for useImageDisplay hook
 */
export interface UseImageDisplayReturn {
  copiedUrl: string | null;
  isImageLoading: boolean;
  setIsImageLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isDownloading: boolean;
  handleDownload: (image: GeneratedImage) => void;
  handleCopyUrl: (url: string) => Promise<void>;
}

/**
 * Hook for managing image display state and interactions.
 *
 * @param currentImage - The currently displayed image
 */
export function useImageDisplay(currentImage: GeneratedImage | null): UseImageDisplayReturn {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const previousImageId = useRef<string | null>(null);

  // Use TanStack Query for downloads
  const { download, isDownloading } = useDownloadImage({
    onError: (error) => {
      showErrorToast(error);
    },
  });

  // Track image changes and set loading state when image changes
  // This pattern is intentional: we need to show loading UI when image prop changes.
  // Similar to getDerivedStateFromProps but reactive to prop changes.
  useEffect(() => {
    const previousId = previousImageId.current;
    const currentId = currentImage?.id ?? null;

    // Only trigger loading when we have a NEW image (id changed to a non-null value)
    if (currentId !== null && currentId !== previousId) {
      previousImageId.current = currentId;
      // This setState is intentional - we need to show loading state for the new image
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync loading state with new image
      setIsImageLoading(true);
    } else if (currentId === null && previousId !== null) {
      // Image was removed
      previousImageId.current = null;
    }
  }, [currentImage?.id]);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleDownload = useCallback(
    (image: GeneratedImage) => {
      download({
        url: image.url,
        filename: `pixelstream-${image.id}.jpg`,
      });
    },
    [download]
  );

  const handleCopyUrl = useCallback(async (url: string) => {
    try {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      showSuccessToast("URL copied to clipboard");

      copyTimeoutRef.current = setTimeout(() => {
        setCopiedUrl(null);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch {
      showErrorToast(new Error("Failed to copy URL to clipboard"));
    }
  }, []);

  return {
    copiedUrl,
    isImageLoading,
    setIsImageLoading,
    isDownloading,
    handleDownload,
    handleCopyUrl,
  };
}
