"use client"

/**
 * StudioHeader - Top navigation bar for the studio
 * Follows SRP: Only manages header UI and navigation
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sparkles,
    Keyboard,
    Settings,
    PanelLeft,
    PanelRight,
    Moon,
    Sun,
    HelpCircle,
} from "lucide-react"

export interface StudioHeaderProps {
    /** User button component (from Clerk or custom) */
    userButton?: React.ReactNode
    /** Whether left sidebar is visible */
    leftSidebarOpen?: boolean
    /** Callback to toggle left sidebar */
    onToggleLeftSidebar?: () => void
    /** Whether right gallery is visible */
    rightPanelOpen?: boolean
    /** Callback to toggle right gallery */
    onToggleRightPanel?: () => void
    /** Callback to show keyboard shortcuts */
    onShowShortcuts?: () => void
    /** Current theme */
    theme?: "light" | "dark"
    /** Callback to toggle theme */
    onToggleTheme?: () => void
    /** Additional class names */
    className?: string
}

export function StudioHeader({
    userButton,
    leftSidebarOpen = true,
    onToggleLeftSidebar,
    rightPanelOpen = true,
    onToggleRightPanel,
    onShowShortcuts,
    theme = "dark",
    onToggleTheme,
    className,
}: StudioHeaderProps) {
    return (
        <header
            className={cn(
                "flex h-14 items-center justify-between border-b border-border/50",
                "bg-card/80 backdrop-blur-md px-4",
                "sticky top-0 z-50",
                className
            )}
            data-testid="studio-header"
        >
            {/* Left Section - Branding */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <div
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            "bg-gradient-to-br from-primary/20 to-accent/20",
                            "ring-1 ring-primary/30"
                        )}
                    >
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-base font-semibold tracking-tight">
                            Pixelstream
                        </h1>
                        <p className="text-[10px] text-muted-foreground leading-none">
                            AI Image Studio
                        </p>
                    </div>
                </div>
            </div>

            {/* Center Section - View Controls */}
            <div className="flex items-center gap-1">
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

            {/* Right Section - Actions & User */}
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={onShowShortcuts}
                            data-testid="show-shortcuts"
                        >
                            <Keyboard className="h-4 w-4" />
                            <span className="sr-only">Keyboard shortcuts</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Shortcuts (?)</TooltipContent>
                </Tooltip>

                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    data-testid="settings-menu"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span className="sr-only">Settings</span>
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Settings</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={onToggleTheme}>
                            {theme === "dark" ? (
                                <>
                                    <Sun className="mr-2 h-4 w-4" />
                                    Light Mode
                                </>
                            ) : (
                                <>
                                    <Moon className="mr-2 h-4 w-4" />
                                    Dark Mode
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <HelpCircle className="mr-2 h-4 w-4" />
                            Help & Support
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {userButton && (
                    <div className="ml-2 border-l border-border/50 pl-3">
                        {userButton}
                    </div>
                )}
            </div>
        </header>
    )
}
