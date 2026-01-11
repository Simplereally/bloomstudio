"use client"

import { useState, useCallback } from "react"

export interface VideoReferenceImages {
    /** First frame (starting image) - image[0] */
    firstFrame?: string
    /** Last frame (ending image for interpolation) - image[1] */
    lastFrame?: string
}

export type FrameType = "firstFrame" | "lastFrame"

interface UseVideoReferenceImagesOptions {
    /** Initial selected images */
    initialImages?: VideoReferenceImages
    /** Callback when images change */
    onImagesChange?: (images: VideoReferenceImages) => void
}

interface UseVideoReferenceImagesReturn {
    /** Currently selected images */
    selectedImages: VideoReferenceImages
    /** Set the selected images */
    setSelectedImages: (images: VideoReferenceImages) => void
    /** Whether the browser modal is open */
    isBrowserOpen: boolean
    /** Open the browser modal */
    openBrowser: (frameType: FrameType) => void
    /** Close the browser modal */
    closeBrowser: () => void
    /** The frame type being selected in the browser */
    browserFrameType: FrameType | null
    /** Handle selecting an image from the browser */
    handleBrowserSelect: (url: string) => void
    /** Handle clearing a specific frame */
    handleClearFrame: (frameType: FrameType) => void
    /** Handle clearing all frames */
    handleClearAll: () => void
    /** Handle selecting an image for a specific frame */
    handleSelectForFrame: (url: string, frameType: FrameType) => void
    /** Get the count of selected frames */
    frameCount: number
}

/**
 * Custom hook for managing video reference images state and browser modal.
 * Encapsulates the logic for selecting first/last frames and browsing images.
 */
export function useVideoReferenceImages({
    initialImages = { firstFrame: undefined, lastFrame: undefined },
    onImagesChange,
}: UseVideoReferenceImagesOptions = {}): UseVideoReferenceImagesReturn {
    const [selectedImages, setSelectedImagesState] = useState<VideoReferenceImages>(initialImages)
    const [isBrowserOpen, setIsBrowserOpen] = useState(false)
    const [browserFrameType, setBrowserFrameType] = useState<FrameType | null>(null)

    const setSelectedImages = useCallback((images: VideoReferenceImages) => {
        setSelectedImagesState(images)
        onImagesChange?.(images)
    }, [onImagesChange])

    const openBrowser = useCallback((frameType: FrameType) => {
        setBrowserFrameType(frameType)
        setIsBrowserOpen(true)
    }, [])

    const closeBrowser = useCallback(() => {
        setIsBrowserOpen(false)
        setBrowserFrameType(null)
    }, [])

    const handleBrowserSelect = useCallback((url: string) => {
        if (browserFrameType) {
            const newImages = {
                ...selectedImages,
                [browserFrameType]: url,
            }
            setSelectedImages(newImages)
            closeBrowser()
        }
    }, [browserFrameType, selectedImages, setSelectedImages, closeBrowser])

    const handleClearFrame = useCallback((frameType: FrameType) => {
        const newImages = {
            ...selectedImages,
            [frameType]: undefined,
        }
        setSelectedImages(newImages)
    }, [selectedImages, setSelectedImages])

    const handleClearAll = useCallback(() => {
        setSelectedImages({ firstFrame: undefined, lastFrame: undefined })
    }, [setSelectedImages])

    const handleSelectForFrame = useCallback((url: string, frameType: FrameType) => {
        const newImages = {
            ...selectedImages,
            [frameType]: url,
        }
        setSelectedImages(newImages)
    }, [selectedImages, setSelectedImages])

    const frameCount = (selectedImages.firstFrame ? 1 : 0) + (selectedImages.lastFrame ? 1 : 0)

    return {
        selectedImages,
        setSelectedImages,
        isBrowserOpen,
        openBrowser,
        closeBrowser,
        browserFrameType,
        handleBrowserSelect,
        handleClearFrame,
        handleClearAll,
        handleSelectForFrame,
        frameCount,
    }
}
