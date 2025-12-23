"use client"

/**
 * useImageDisplay Hook
 *
 * Hook for managing image display state and actions.
 * Integrates TanStack Query for download operations.
 */

import { useState, useRef, useCallback } from "react"
import type { GeneratedImage } from "@/types/pollinations"
import { useDownloadImage } from "@/hooks/queries"
import { showErrorToast, showSuccessToast } from "@/lib/errors"

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
    const previousImageId = useRef<string | null>(null)

    // Use TanStack Query for downloads
    const { download, isDownloading } = useDownloadImage({
        onError: (error) => {
            showErrorToast(error)
        },
    })

    // Track image changes and set loading state synchronously during render
    if (currentImage?.id !== previousImageId.current) {
        previousImageId.current = currentImage?.id ?? null
        if (currentImage && !isImageLoading) {
            setIsImageLoading(true)
        }
    }

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
            showSuccessToast("URL copied to clipboard")
            setTimeout(() => setCopiedUrl(null), 2000)
        } catch {
            showErrorToast(new Error("Failed to copy URL to clipboard"))
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
