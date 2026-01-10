"use client"

/**
 * StudioLayout - Core layout component using static sidebars
 * Uses shadcn Sidebar for collapsible, fixed-width panels.
 */

import {
    Sidebar,
    SidebarContent,
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import * as React from "react"

export interface StudioLayoutProps {
    /** Content for the left sidebar (generation controls) */
    sidebar: React.ReactNode
    /** Content for the main canvas area */
    canvas: React.ReactNode
    /** Content for the gallery panel (optional) */
    gallery?: React.ReactNode
    /** Whether the sidebar panel is visible */
    showSidebar?: boolean
    /** Whether the gallery panel is visible */
    showGallery?: boolean
    /** Additional class names */
    className?: string
    
    // Legacy props - kept for compatibility but unused
    defaultSidebarSize?: number | string
    defaultGallerySize?: number | string
    minSidebarSize?: number | string
    maxSidebarSize?: number | string
    defaultLayout?: Record<string, number>
}

export function StudioLayout({
    sidebar,
    canvas,
    gallery,
    showSidebar = true,
    showGallery = true,
    className,
}: StudioLayoutProps) {
    return (
        <div className={cn("flex h-full w-full overflow-hidden", className)} data-testid="studio-layout">
            {/* Left Sidebar Provider */}
            <SidebarProvider
                open={showSidebar}
                defaultOpen={showSidebar}
                cookieName="studio-sidebar-state"
                className="!h-full !min-h-0 w-full relative"
                style={
                    {
                        "--sidebar-width": "360px",
                        "--sidebar-width-icon": "0px",
                    } as React.CSSProperties
                }
            >
                <Sidebar
                    side="left"
                    collapsible="offcanvas"
                    className="!absolute !h-full border-r border-border/50 bg-card/50"
                    data-testid="studio-sidebar-panel"
                >
                    <SidebarContent className="h-full min-h-0 overflow-hidden">
                        {sidebar}
                    </SidebarContent>
                </Sidebar>

                <SidebarInset className="h-full min-h-0 min-w-0 flex-1 overflow-hidden relative">
                    {/* Right Sidebar Provider (Nested) */}
                    <SidebarProvider
                        open={showGallery && !!gallery}
                        defaultOpen={showGallery && !!gallery}
                        cookieName="studio-gallery-state"
                        className="!h-full !min-h-0 w-full relative"
                        style={
                            {
                                "--sidebar-width": "320px",
                                "--sidebar-width-icon": "0px",
                            } as React.CSSProperties
                        }
                    >
                         <SidebarInset className="h-full min-h-0 min-w-0 flex-1 overflow-hidden relative">
                             <div className="h-full w-full" data-testid="studio-canvas-panel">
                                 {canvas}
                             </div>
                         </SidebarInset>

                         {gallery && (
                            <Sidebar
                                side="right"
                                collapsible="offcanvas"
                                className="!absolute !h-full border-l border-border/50 bg-card/50"
                                data-testid="studio-gallery-panel"
                            >
                                <SidebarContent className="h-full min-h-0 overflow-hidden">
                                    {gallery}
                                </SidebarContent>
                            </Sidebar>
                        )}
                    </SidebarProvider>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}
