"use client"

/**
 * useDownloadImage Hook
 *
 * TanStack Query mutation hook for downloading images.
 * Handles blob creation and browser download trigger.
 */

import { useMutation } from "@tanstack/react-query"
import { downloadImage as downloadImageApi, type ApiError } from "@/lib/api"

/**
 * Parameters for download operation
 */
export interface DownloadImageParams {
    /**
     * URL of the image to download
     */
    url: string

    /**
     * Filename for the downloaded image
     */
    filename: string
}

/**
 * Options for the useDownloadImage hook
 */
export interface UseDownloadImageOptions {
    /**
     * Callback fired on successful download
     */
    onSuccess?: (params: DownloadImageParams) => void

    /**
     * Callback fired on download error
     */
    onError?: (error: ApiError, params: DownloadImageParams) => void
}

/**
 * Return type for useDownloadImage hook
 */
export interface UseDownloadImageReturn {
    /**
     * Trigger image download
     */
    download: (params: DownloadImageParams) => void

    /**
     * Trigger image download and return a promise
     */
    downloadAsync: (params: DownloadImageParams) => Promise<void>

    /**
     * Whether download is in progress
     */
    isDownloading: boolean

    /**
     * Whether the last download was successful
     */
    isSuccess: boolean

    /**
     * Whether the last download failed
     */
    isError: boolean

    /**
     * Error from the last failed download
     */
    error: ApiError | null
}

/**
 * Hook for downloading images with TanStack Query.
 *
 * @example
 * ```tsx
 * const { download, isDownloading } = useDownloadImage({
 *   onSuccess: () => {
 *     toast.success('Image downloaded!')
 *   }
 * })
 *
 * // Trigger download
 * download({ url: image.url, filename: 'my-image.jpg' })
 * ```
 */
export function useDownloadImage(
    options: UseDownloadImageOptions = {}
): UseDownloadImageReturn {
    const mutation = useMutation<void, ApiError, DownloadImageParams>({
        mutationFn: async ({ url, filename }) => {
            const blob = await downloadImageApi(url)

            // Create download link and trigger browser download
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = blobUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()

            // Cleanup
            window.URL.revokeObjectURL(blobUrl)
            document.body.removeChild(link)
        },

        onSuccess: (_, params) => {
            options.onSuccess?.(params)
        },

        onError: (error, params) => {
            options.onError?.(error, params)
        },
    })

    return {
        download: mutation.mutate,
        downloadAsync: mutation.mutateAsync,
        isDownloading: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        error: mutation.error,
    }
}
