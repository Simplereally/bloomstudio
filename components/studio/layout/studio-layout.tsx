"use client"

/**
 * StudioLayout - Core layout component using resizable panels
 * Follows SRP: Only manages the visual layout structure and panel sizing
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable"
// Note: This project uses react-resizable-panels@4.0.13, which is a major update from previous versions.
import type { PanelImperativeHandle } from "react-resizable-panels"
import { usePanelVisibility } from "@/hooks/use-panel-visibility"

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

    // Persistence logic for cookies ( Next.js compatible )
    const handleLayoutChange = (newLayout: Record<string, number>) => {
        document.cookie = `studio-layout-v1=${JSON.stringify(newLayout)}; path=/; max-age=31536000`
    }

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
                <div className="h-full overflow-y-auto">{sidebar}</div>
            </ResizablePanel>

            <ResizableHandle
                withHandle
                className="bg-border/50 hover:bg-primary/20 transition-colors"
                data-testid="sidebar-handle"
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
            {gallery && (
                <>
                    <ResizableHandle
                        withHandle
                        className="bg-border/50 hover:bg-primary/20 transition-colors"
                        data-testid="gallery-handle"
                    />
                    <ResizablePanel
                        id="gallery"
                        panelRef={galleryRef}
                        defaultSize={defaultGallerySize}
                        minSize="12%"
                        maxSize="30%"
                        collapsible
                        collapsedSize={0}
                        className="bg-card/50"
                        data-testid="studio-gallery-panel"
                    >
                        <div className="h-full overflow-y-auto">{gallery}</div>
                    </ResizablePanel>
                </>
            )}
        </ResizablePanelGroup>
    )
}
