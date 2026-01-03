"use client"

/**
 * useStudioUI Hook
 * 
 * Manages Studio UI state: panel visibility, fullscreen, lightbox.
 * Completely isolated from generation logic for optimal performance.
 * 
 * Features:
 * - Left sidebar toggle state
 * - Right gallery panel toggle state
 * - Fullscreen/lightbox state
 * - Lightbox image selection
 * - Keyboard shortcuts integration
 * 
 * This hook follows the "Headless UI" pattern - pure logic with stable callbacks.
 */

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import type { GeneratedImage } from "@/types/pollinations"
import * as React from "react"

/**
 * Return type for useStudioUI hook
 */
export interface UseStudioUIReturn {
    // Sidebar state
    showLeftSidebar: boolean
    setShowLeftSidebar: React.Dispatch<React.SetStateAction<boolean>>
    toggleLeftSidebar: () => void

    // Gallery panel state
    showGallery: boolean
    setShowGallery: React.Dispatch<React.SetStateAction<boolean>>
    toggleGallery: () => void

    // Fullscreen/Lightbox state
    isFullscreen: boolean
    setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>
    lightboxImage: GeneratedImage | null
    setLightboxImage: React.Dispatch<React.SetStateAction<GeneratedImage | null>>

    // Open lightbox with specific image
    openLightbox: (image: GeneratedImage | null) => void
    closeLightbox: () => void
}

/**
 * Hook for managing Studio UI state.
 * 
 * @example
 * ```tsx
 * const {
 *     showLeftSidebar,
 *     toggleLeftSidebar,
 *     showGallery,
 *     openLightbox,
 * } = useStudioUI()
 * 
 * // Toggle sidebar
 * <Button onClick={toggleLeftSidebar}>Toggle Sidebar</Button>
 * 
 * // Open lightbox
 * <ImageThumbnail onClick={() => openLightbox(image)} />
 * ```
 */
export function useStudioUI(): UseStudioUIReturn {
    // ========================================
    // Panel Visibility State
    // ========================================
    const [showLeftSidebar, setShowLeftSidebar] = React.useState(true)
    const [showGallery, setShowGallery] = React.useState(true)

    // ========================================
    // Fullscreen/Lightbox State
    // ========================================
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [lightboxImage, setLightboxImage] = React.useState<GeneratedImage | null>(null)

    // ========================================
    // Stable Toggle Callbacks
    // ========================================
    const toggleLeftSidebar = React.useCallback(() => {
        setShowLeftSidebar(prev => !prev)
    }, [])

    const toggleGallery = React.useCallback(() => {
        setShowGallery(prev => !prev)
    }, [])

    // ========================================
    // Lightbox Handlers
    // ========================================
    const openLightbox = React.useCallback((image: GeneratedImage | null) => {
        setLightboxImage(image)
        setIsFullscreen(true)
    }, [])

    const closeLightbox = React.useCallback(() => {
        setIsFullscreen(false)
    }, [])

    // ========================================
    // Keyboard Shortcuts
    // ========================================
    useKeyboardShortcuts({
        onToggleSidebar: toggleLeftSidebar,
        onToggleGallery: toggleGallery,
    })

    return {
        // Sidebar state
        showLeftSidebar,
        setShowLeftSidebar,
        toggleLeftSidebar,

        // Gallery panel state
        showGallery,
        setShowGallery,
        toggleGallery,

        // Fullscreen/Lightbox state
        isFullscreen,
        setIsFullscreen,
        lightboxImage,
        setLightboxImage,
        openLightbox,
        closeLightbox,
    }
}
