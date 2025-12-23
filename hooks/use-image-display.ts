"use client"

/**
 * useImageDisplay Hook
 *
 * Hook for managing image display state and actions.
 * Integrates TanStack Query for download operations.
 */

import { useState, useEffect, useCallback } from "react"
import type { GeneratedImage } from "@/types/pollinations"
import { useDownloadImage } from "@/hooks/queries"

/**
 * Return type for useImageDisplay hook
 */
export interface UseImageDisplayReturn {
    copiedUrl: string | null
    isImageLoading: boolean
    setIsImageLoading: React.Dispatch<React.SetStateAction<boolean>>
    isDownloading: boolean
    handleDownload: (image: GeneratedImage) => void
    handleCopyUrl: (url: string) => Promise<void>
}

/**
 * Hook for managing image display state and interactions.
 *
 * @param currentImage - The currently displayed image
 */
export function useImageDisplay(
    currentImage: GeneratedImage | null
): UseImageDisplayReturn {
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
    const [isImageLoading, setIsImageLoading] = useState(false)

    // Use TanStack Query for downloads
    const { download, isDownloading } = useDownloadImage({
        onError: (error) => {
            console.error("[useImageDisplay] Download error:", error.message)
        },
    })

    // Reset loading state when the image changes
    useEffect(() => {
        if (currentImage) {
            setIsImageLoading(true)
        }
    }, [currentImage?.id])

    const handleDownload = useCallback(
        (image: GeneratedImage) => {
            download({
                url: image.url,
                filename: `pixelstream-${image.id}.jpg`,
            })
        },
        [download]
    )

    const handleCopyUrl = useCallback(async (url: string) => {
        try {
            await navigator.clipboard.writeText(url)
            setCopiedUrl(url)
            setTimeout(() => setCopiedUrl(null), 2000)
        } catch (error) {
            console.error("[useImageDisplay] Copy error:", error)
        }
    }, [])

    return {
        copiedUrl,
        isImageLoading,
        setIsImageLoading,
        isDownloading,
        handleDownload,
        handleCopyUrl,
    }
}
