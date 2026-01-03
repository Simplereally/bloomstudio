"use client"

/**
 * useKeyboardShortcuts Hook
 *
 * Handles keyboard shortcuts for the studio interface.
 * Extracted from use-studio-client-shell to reduce complexity.
 */

import { useEffect } from "react"

export interface KeyboardShortcutHandlers {
    /** Handler for Cmd/Ctrl + B (toggle sidebar) */
    onToggleSidebar?: () => void
    /** Handler for Cmd/Ctrl + G (toggle gallery) */
    onToggleGallery?: () => void
}

/**
 * Hook for registering studio keyboard shortcuts.
 * 
 * @param handlers - Object containing callback functions for each shortcut
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   onToggleSidebar: () => setShowLeftSidebar(prev => !prev),
 *   onToggleGallery: () => setShowGallery(prev => !prev),
 * })
 * ```
 */
export function useKeyboardShortcuts({
    onToggleSidebar,
    onToggleGallery,
}: KeyboardShortcutHandlers): void {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + B to toggle sidebar
            if ((e.metaKey || e.ctrlKey) && e.key === "b") {
                e.preventDefault()
                onToggleSidebar?.()
            }
            // Cmd/Ctrl + G to toggle gallery
            if ((e.metaKey || e.ctrlKey) && e.key === "g") {
                e.preventDefault()
                onToggleGallery?.()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [onToggleSidebar, onToggleGallery])
}
