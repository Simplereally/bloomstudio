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
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    /** Callback when sidebar open state changes (e.g., closed via mobile overlay) */
    onSidebarOpenChange?: (open: boolean) => void
    /** Callback when gallery open state changes (e.g., closed via mobile overlay) */
    onGalleryOpenChange?: (open: boolean) => void
    /** Additional class names */
    className?: string

    // Legacy props - kept for compatibility but unused
    defaultSidebarSize?: number | string
    defaultGallerySize?: number | string
    minSidebarSize?: number | string
    maxSidebarSize?: number | string
    defaultLayout?: Record<string, number>
}

function MobileMenuButton({ side, className }: { side: "left" | "right", className?: string }) {
    const { toggleSidebar } = useSidebar()

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("md:hidden h-10 w-10 shrink-0", className)}
            onClick={toggleSidebar}
        >
            {side === "left" ? <PanelLeft className="h-6 w-6" /> : <PanelRight className="h-6 w-6" />}
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    )
}

export function StudioLayout({
    sidebar,
    canvas,
    gallery,
    showSidebar = true,
    showGallery = true,
    onSidebarOpenChange,
    onGalleryOpenChange,
    className,
}: StudioLayoutProps) {
    return (
        <div className={cn("flex h-full w-full overflow-hidden", className)} data-testid="studio-layout">
            {/* Left Sidebar Provider */}
            <SidebarProvider
                open={showSidebar}
                defaultOpen={showSidebar}
                onOpenChange={onSidebarOpenChange}
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
                    className="!absolute !h-full border-r border-border/50 bg-transparent"
                    data-testid="studio-sidebar-panel"
                >
                    <SidebarContent className="h-full min-h-0 overflow-hidden">
                        {sidebar}
                    </SidebarContent>
                    <SidebarRail className="group/rail !flex">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm border opacity-100 md:opacity-0 md:group-hover/rail:opacity-100 transition-all">
                                <ChevronLeft className="h-3 w-3" />
                            </div>
                        </div>
                    </SidebarRail>
                </Sidebar>

                <SidebarInset className="h-full min-h-0 min-w-0 flex-1 overflow-hidden relative">
                    {/* Left Mobile Trigger - Top Left */}
                    <div className="absolute top-2 left-2 z-50 md:hidden">
                        <MobileMenuButton side="left" className="bg-background/80 backdrop-blur-sm border shadow-sm rounded-md" />
                    </div>

                    {/* Right Sidebar Provider (Nested) */}
                    <SidebarProvider
                        open={showGallery && !!gallery}
                        defaultOpen={showGallery && !!gallery}
                        onOpenChange={onGalleryOpenChange}
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
                            {/* Right Mobile Trigger - Top Right (only if gallery enabled) */}
                            {gallery && (
                                <div className="absolute top-2 right-2 z-50 md:hidden">
                                    <MobileMenuButton side="right" className="bg-background/80 backdrop-blur-sm border shadow-sm rounded-md" />
                                </div>
                            )}

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
                                <SidebarRail className="group/rail !flex">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm border opacity-100 md:opacity-0 md:group-hover/rail:opacity-100 transition-all">
                                            <ChevronRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </SidebarRail>
                            </Sidebar>
                        )}
                    </SidebarProvider>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}
