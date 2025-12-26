"use client";

/**
 * useDownloadImage Hook
 *
 * TanStack Query mutation hook for downloading images.
 * Handles blob creation, optional format conversion, and browser download trigger.
 */

import { useMutation } from "@tanstack/react-query";
import { downloadImage as downloadImageApi, PollinationsApiError, ClientErrorCodeConst } from "@/lib/api";

/** Supported image format types */
export type ImageFormat = "jpg" | "png" | "webp";

/**
 * Parameters for download operation
 */
export interface DownloadImageParams {
  /** URL of the image to download */
  url: string;
  /** Filename for the downloaded image */
  filename: string;
  /** Optional format conversion */
  format?: ImageFormat;
}

/**
 * Options for the useDownloadImage hook
 */
export interface UseDownloadImageOptions {
  /** Callback fired on successful download */
  onSuccess?: (params: DownloadImageParams) => void;
  /** Callback fired on download error */
  onError?: (error: PollinationsApiError, params: DownloadImageParams) => void;
}

/**
 * Return type for useDownloadImage hook
 */
export interface UseDownloadImageReturn {
  /** Trigger image download */
  download: (params: DownloadImageParams) => void;
  /** Trigger image download and return a promise */
  downloadAsync: (params: DownloadImageParams) => Promise<void>;
  /** Whether download is in progress */
  isDownloading: boolean;
  /** Whether the last download was successful */
  isSuccess: boolean;
  /** Whether the last download failed */
  isError: boolean;
  /** Error from the last failed download */
  error: PollinationsApiError | null;
}

/**
 * Get file extension from filename
 */
function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Get MIME type from format
 */
function getMimeType(format: ImageFormat): string {
  const mimeTypes: Record<ImageFormat, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return mimeTypes[format];
}

/**
 * Convert blob to specified format using canvas
 */
async function convertBlobFormat(blob: Blob, format: ImageFormat): Promise<Blob> {
  const img = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }

  ctx.drawImage(img, 0, 0);

  const mimeType = getMimeType(format);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas export failed"));
      },
      mimeType,
      0.92 // Quality for JPEG/WebP
    );
  });
}

/**
 * Trigger browser download for a blob
 */
function triggerDownload(blob: Blob, filename: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(link);
}

/**
 * Hook for downloading images with TanStack Query.
 *
 * @example
 * ```tsx
 * const { download, isDownloading } = useDownloadImage({
 *   onSuccess: () => toast.success('Image downloaded!')
 * })
 *
 * // Basic download
 * download({ url: image.url, filename: 'my-image.jpg' })
 *
 * // Download with format conversion
 * download({ url: image.url, filename: 'my-image.png', format: 'png' })
 * ```
 */
export function useDownloadImage(options: UseDownloadImageOptions = {}): UseDownloadImageReturn {
  const mutation = useMutation<void, PollinationsApiError, DownloadImageParams>({
    mutationFn: async ({ url, filename, format }) => {
      const blob = await downloadImageApi(url);

      // Convert format if needed
      let finalBlob = blob;
      if (format && format !== getExtension(filename)) {
        try {
          finalBlob = await convertBlobFormat(blob, format);
        } catch (e) {
          throw new PollinationsApiError(
            "Format conversion failed. The image server might be restricting access (CORS).",
            ClientErrorCodeConst.GENERATION_FAILED,
            403,
            { originalError: e }
          );
        }
      }

      triggerDownload(finalBlob, filename);
    },

    onSuccess: (_, params) => {
      options.onSuccess?.(params);
    },

    onError: (error, params) => {
      options.onError?.(error, params);
    },
  });

  return {
    download: mutation.mutate,
    downloadAsync: mutation.mutateAsync,
    isDownloading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}
