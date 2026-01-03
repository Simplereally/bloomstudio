"use client"

/**
 * StudioHeader - Panel toggle controls for the studio
 * Shows toggle buttons for left sidebar (controls) and right panel (gallery)
 * Branding, settings, and user button are handled by the app-level Header
 */

import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { PanelLeft, PanelRight } from "lucide-react"

export interface StudioHeaderProps {
    /** Whether left sidebar is visible */
    leftSidebarOpen?: boolean
    /** Callback to toggle left sidebar */
    onToggleLeftSidebar?: () => void
    /** Whether right gallery is visible */
    rightPanelOpen?: boolean
    /** Callback to toggle right gallery */
    onToggleRightPanel?: () => void
    /** Additional class names */
    className?: string
}

export function StudioHeader({
    leftSidebarOpen = true,
    onToggleLeftSidebar,
    rightPanelOpen = true,
    onToggleRightPanel,
    className,
}: StudioHeaderProps) {
    return (
        <div
            className={cn(
                "flex h-10 items-center justify-center gap-1 border-b border-border/50",
                "bg-card/50 backdrop-blur-sm px-4",
                className
            )}
            data-testid="studio-header"
        >
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={leftSidebarOpen ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={onToggleLeftSidebar}
                        data-testid="toggle-left-sidebar"
                    >
                        <PanelLeft className="h-4 w-4" />
                        <span className="sr-only">Toggle controls panel</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {leftSidebarOpen ? "Hide Controls" : "Show Controls"} (⌘B)
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={rightPanelOpen ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={onToggleRightPanel}
                        data-testid="toggle-right-panel"
                    >
                        <PanelRight className="h-4 w-4" />
                        <span className="sr-only">Toggle gallery panel</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {rightPanelOpen ? "Hide Gallery" : "Show Gallery"} (⌘G)
                </TooltipContent>
            </Tooltip>
        </div>
    )
}
