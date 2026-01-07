"use client"

/**
 * StudioLayout - Core layout component using resizable panels
 * Follows SRP: Only manages the visual layout structure and panel sizing
 */

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import * as React from "react"
// Note: This project uses react-resizable-panels@4.0.13, which is a major update from previous versions.
import { usePanelVisibility } from "@/hooks/use-panel-visibility"
import type { PanelImperativeHandle } from "react-resizable-panels"

export interface StudioLayoutProps {
    /** Content for the left sidebar (generation controls) */
    sidebar: React.ReactNode
    /** Content for the main canvas area */
    canvas: React.ReactNode
    /** Content for the gallery panel (optional) */
    gallery?: React.ReactNode
    /** Default size of sidebar as percentage or pixels (default: "22%") */
    defaultSidebarSize?: number | string
    /** Default size of gallery as percentage or pixels (default: "18%") */
    defaultGallerySize?: number | string
    /** Minimum size of sidebar as percentage or pixels (default: "15%") */
    minSidebarSize?: number | string
    /** Maximum size of sidebar as percentage or pixels (default: "35%") */
    maxSidebarSize?: number | string
    /** Minimum size of gallery as percentage or pixels (default: "12%") */
    minGallerySize?: number | string
    /** Maximum size of gallery as percentage or pixels (default: "30%") */
    maxGallerySize?: number | string
    /** Whether the sidebar panel is visible */
    showSidebar?: boolean
    /** Whether the gallery panel is visible */
    showGallery?: boolean
    /** Initial layout from server (cookies) */
    defaultLayout?: Record<string, number>
    /** Additional class names */
    className?: string
}

export function StudioLayout({
    sidebar,
    canvas,
    gallery,
    defaultSidebarSize = "22%",
    defaultGallerySize = "18%",
    minSidebarSize = "15%",
    maxSidebarSize = "35%",
    minGallerySize = "12%",
    maxGallerySize = 295,
    showSidebar = true,
    showGallery = true,
    defaultLayout,
    className,
}: StudioLayoutProps) {
    const sidebarRef = React.useRef<PanelImperativeHandle | null>(null)
    const galleryRef = React.useRef<PanelImperativeHandle | null>(null)

    // Handle panel visibility via custom hook
    usePanelVisibility(sidebarRef, showSidebar)
    usePanelVisibility(galleryRef, showGallery && !!gallery)

    // Debounced persistence logic for cookies (Next.js compatible)
    // Avoids excessive cookie writes during drag operations
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleLayoutChange = React.useCallback((newLayout: Record<string, number>) => {
        // Clear any pending write
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        // Debounce: only write cookie 300ms after resize stops
        timeoutRef.current = setTimeout(() => {
            document.cookie = `studio-layout-v1=${JSON.stringify(newLayout)}; path=/; max-age=31536000`
        }, 300)
    }, [])

    // Track active drag count to handle multiple handles
    const dragCountRef = React.useRef(0)

    // Handle drag state - sets data attribute on body to disable expensive effects
    const handleDragging = React.useCallback((isDragging: boolean) => {
        if (isDragging) {
            dragCountRef.current++
            document.body.setAttribute("data-resizing", "true")
        } else {
            dragCountRef.current = Math.max(0, dragCountRef.current - 1)
            if (dragCountRef.current === 0) {
                document.body.removeAttribute("data-resizing")
            }
        }
    }, [])

    // Cleanup timeout and data attribute on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            document.body.removeAttribute("data-resizing")
        }
    }, [])

    return (
        <ResizablePanelGroup
            id="studio-main-layout"
            orientation="horizontal"
            className={cn("h-full w-full", className)}
            defaultLayout={defaultLayout}
            onLayoutChange={handleLayoutChange}
            data-testid="studio-layout"
        >
            {/* Left Sidebar - Generation Controls */}
            <ResizablePanel
                id="sidebar"
                panelRef={sidebarRef}
                defaultSize={defaultSidebarSize}
                minSize={minSidebarSize}
                maxSize={maxSidebarSize}
                collapsible
                collapsedSize={0}
                className="bg-card/50"
                data-testid="studio-sidebar-panel"
            >
                <div className="h-full min-w-0 overflow-hidden">{sidebar}</div>
            </ResizablePanel>

            <ResizableHandle
                withHandle
                className="bg-border/50 hover:bg-primary/20 transition-colors"
                data-testid="sidebar-handle"
                onDragging={handleDragging}
            />

            {/* Main Canvas Area */}
            <ResizablePanel
                id="canvas"
                minSize="40%"
                data-testid="studio-canvas-panel"
            >
                <div className="h-full">{canvas}</div>
            </ResizablePanel>

            {/* Right Gallery Panel */}
            {gallery && showGallery && (
                <>
                    <ResizableHandle
                        withHandle
                        className="bg-border/50 hover:bg-primary/20 transition-colors"
                        data-testid="gallery-handle"
                        onDragging={handleDragging}
                    />
                    <ResizablePanel
                        id="gallery"
                        panelRef={galleryRef}
                        defaultSize={defaultGallerySize}
                        minSize={minGallerySize}
                        maxSize={maxGallerySize}
                        collapsible
                        collapsedSize={0}
                        className="bg-card/50"
                        data-testid="studio-gallery-panel"
                    >
                        <div className="h-full overflow-y-auto min-w-0">{gallery}</div>
                    </ResizablePanel>
                </>
            )}
        </ResizablePanelGroup>
    )
}
