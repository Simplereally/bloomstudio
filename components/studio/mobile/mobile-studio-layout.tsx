"use client"

/**
 * MobileStudioLayout - Main layout orchestrator for mobile Studio experience
 *
 * This component acts as the "traffic controller" for the mobile experience:
 * - Full-width canvas as the primary view
 * - Bottom navigation bar with Generate FAB
 * - Editor bottom drawer (slides up)
 * - History right sheet (slides from right)
 *
 * Features:
 * - "Thumb Zone" optimized layout
 * - Dynamic viewport height (dvh) for iOS address bar handling
 * - Glass effect UI elements
 * - Selection mode for bulk gallery actions
 * - Seamless state integration with studioUI hook
 */

import { cn } from "@/lib/utils"
import * as React from "react"
import { MobileStudioNavigation } from "./mobile-studio-navigation"
import { MobileEditorDrawer } from "./mobile-editor-drawer"
import { MobileHistoryDrawer } from "./mobile-history-drawer"

export interface MobileStudioLayoutProps {
    /** Content for the main canvas area */
    canvas: React.ReactNode
    /** Content for the editor drawer (PromptFeature + ControlsFeature) */
    editorContent: React.ReactNode
    /** Content for the history drawer (GalleryFeature) */
    historyContent: React.ReactNode
    /** Whether the editor drawer is open */
    isEditorOpen: boolean
    /** Callback when editor drawer open state changes */
    onEditorOpenChange: (open: boolean) => void
    /** Whether the history drawer is open */
    isHistoryOpen: boolean
    /** Callback when history drawer open state changes */
    onHistoryOpenChange: (open: boolean) => void
    /** Handler for triggering generation */
    onGenerate: () => void
    /** Whether generation is in progress */
    isGenerating?: boolean
    /** Whether generation is disabled (e.g., no prompt) */
    isGenerateDisabled?: boolean
    /** Batch mode settings (mobile only) */
    batchSettings?: {
        enabled: boolean
        count: number
    }
    /** Whether batch is active (mobile only) */
    isBatchActive?: boolean

    /** Selection mode state for gallery bulk actions */
    selectionMode?: {
        enabled: boolean
        count: number
        onDelete: () => void
        onMakePublic: () => void
        onCancel: () => void
    }
    /** Additional class names */
    className?: string
}

/**
 * MobileStudioLayout - The main mobile layout component
 *
 * Layout structure:
 * ┌─────────────────────────────┐
 * │                             │
 * │         Canvas              │
 * │      (Full viewport)        │
 * │                             │
 * │                             │
 * ├─────────────────────────────┤
 * │  Editor │  Generate │ History │  ← Bottom Navigation (z-40)
 * └─────────────────────────────┘
 *
 * Overlays:
 * - Editor Drawer: slides up from bottom (z-50)
 * - History Drawer: slides up from bottom (z-50)
 */
export function MobileStudioLayout({
    canvas,
    editorContent,
    historyContent,
    isEditorOpen,
    onEditorOpenChange,
    isHistoryOpen,
    onHistoryOpenChange,
    onGenerate,
    isGenerating = false,
    isGenerateDisabled = false,

    selectionMode,
    className,
}: MobileStudioLayoutProps) {
    // Handle opening the editor drawer
    const handleOpenEditor = React.useCallback(() => {
        onEditorOpenChange(true)
    }, [onEditorOpenChange])

    // Handle opening the history drawer
    const handleOpenHistory = React.useCallback(() => {
        onHistoryOpenChange(true)
    }, [onHistoryOpenChange])

    // Handle generate action
    // Close editor drawer before generating for better UX
    const handleGenerate = React.useCallback(() => {
        // Optionally close the editor when generating
        // to let user see the canvas
        onEditorOpenChange(false)
        onGenerate()
    }, [onGenerate, onEditorOpenChange])

    return (
        <div
            className={cn(
                // Use dynamic viewport height for iOS address bar handling
                "h-[100dvh] w-full",
                // Flex column layout
                "flex flex-col",
                // Background
                "bg-background",
                // Prevent any overflow
                "overflow-hidden",
                className
            )}
            data-testid="mobile-studio-layout"
        >
            {/* Canvas Area - takes all available space minus bottom nav */}
            <main
                className={cn(
                    // Fill remaining space
                    "flex-1",
                    // Allow canvas to handle its own overflow
                    "min-h-0 overflow-hidden",
                    // Account for bottom navigation bar height (64px = h-16)
                    "pb-16"
                )}
                data-testid="mobile-canvas-container"
            >
                {canvas}
            </main>

            {/* Bottom Navigation Bar */}
            <MobileStudioNavigation
                onOpenEditor={handleOpenEditor}
                onOpenHistory={handleOpenHistory}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                isGenerateDisabled={isGenerateDisabled}
                isEditorOpen={isEditorOpen}
                isHistoryOpen={isHistoryOpen}
                selectionMode={selectionMode}
            />

            {/* Editor Bottom Drawer */}
            <MobileEditorDrawer
                open={isEditorOpen}
                onOpenChange={onEditorOpenChange}
            >
                {editorContent}
            </MobileEditorDrawer>

            {/* History Bottom Drawer */}
            <MobileHistoryDrawer
                open={isHistoryOpen}
                onOpenChange={onHistoryOpenChange}
            >
                {historyContent}
            </MobileHistoryDrawer>
        </div>
    )
}
