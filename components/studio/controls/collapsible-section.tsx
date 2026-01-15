"use client"

/**
 * CollapsibleSection - Generic collapsible wrapper for studio panel sections
 * Allows users to collapse sections to save space in the sidebar
 */

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import * as React from "react"

export interface CollapsibleSectionProps {
    /** Section title */
    title: string
    /** Icon to display next to the title */
    icon?: React.ReactNode
    /** Content to render inside the collapsible */
    children: React.ReactNode
    /** Whether to start expanded */
    defaultExpanded?: boolean
    /** Additional class names for the outer container */
    className?: string
    /** Test id for the trigger */
    testId?: string
    /** Content to display on the right side of the header (e.g., controls, badges) - shown when expanded */
    rightContent?: React.ReactNode
    /** Content to display on the right side of the header when collapsed (e.g., selected value summary) */
    collapsedContent?: React.ReactNode
    /** Whether the section is disabled (non-interactive and visually dimmed) */
    disabled?: boolean
    /** Controlled expanded state */
    open?: boolean
    /** Callback when expanded state changes */
    onOpenChange?: (open: boolean) => void
    /** Keep children mounted when collapsed to preserve internal state */
    forceMount?: boolean
}

export const CollapsibleSection = React.memo(function CollapsibleSection({
    title,
    icon,
    children,
    defaultExpanded = true,
    className,
    testId,
    rightContent,
    collapsedContent,
    disabled = false,
    open: controlledOpen,
    onOpenChange,
    forceMount = false,
}: CollapsibleSectionProps) {
    const [internalOpen, setInternalOpen] = React.useState(defaultExpanded)

    const isControlled = controlledOpen !== undefined
    const isExpanded = isControlled ? controlledOpen : internalOpen

    const handleOpenChange = React.useCallback((open: boolean) => {
        if (!isControlled) {
            setInternalOpen(open)
        }
        onOpenChange?.(open)
    }, [isControlled, onOpenChange])

    return (
        <div
            className={cn(
                "w-full min-w-0 overflow-x-hidden border border-border/40 transition-all duration-200",
                disabled ? "opacity-50 pointer-events-none" : "",
                className
            )}
            data-testid={testId ? `${testId}-container` : undefined}
            aria-disabled={disabled}
        >
            <Collapsible open={isExpanded} onOpenChange={disabled ? undefined : handleOpenChange}>
                {/* Header row: using bg-black/20 for darker header */}
                {/* Fixed: Moved 'group' here so it only triggers when hovering header, not content */}
                <div className={cn(
                    "group/header flex items-center gap-1 p-0 transition-colors cursor-pointer bg-black/20",
                    isExpanded && "border-b border-border/40"
                )}>
                    <CollapsibleTrigger
                        className={cn(
                            "flex items-center gap-3 flex-1 min-w-0 py-2 px-3 rounded-none transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring select-none !cursor-pointer",
                            disabled ? "cursor-not-allowed" : ""
                        )}
                        data-testid={testId ? `${testId}-trigger` : undefined}
                        disabled={disabled}
                    >
                        {icon && <span className="text-muted-foreground group-hover/header:text-foreground transition-colors shrink-0">{icon}</span>}
                        <span className="text-[13px] uppercase tracking-wider font-semibold text-muted-foreground group-hover/header:text-foreground transition-colors truncate">
                            {title}
                        </span>

                        {/* Spacer to push collapsed chevron to the right when no rightContent */}
                        {!isExpanded && !collapsedContent && !rightContent && (
                            <div className="flex-1" />
                        )}

                        {!isExpanded && (
                            <ChevronRight
                                data-testid={testId ? `${testId}-chevron` : undefined}
                                className={cn(
                                    "h-4 w-4 text-muted-foreground/50 transition-transform shrink-0",
                                    !collapsedContent && !rightContent ? "" : "ml-2"
                                )}
                            />
                        )}
                    </CollapsibleTrigger>

                    {/* rightContent/collapsedContent OUTSIDE the trigger to prevent nested buttons */}
                    {!isExpanded && (collapsedContent || rightContent) && (
                        <div className="shrink-0 pr-1 opacity-90 ml-auto leading-none flex items-center">
                            {collapsedContent ?? rightContent}
                        </div>
                    )}

                    {/* Interactive rightContent OUTSIDE the main trigger */}
                    {isExpanded && rightContent && (
                        <div className="shrink-0 pr-1 animate-in fade-in slide-in-from-left-1 duration-200 ml-auto leading-none flex items-center">
                            {rightContent}
                        </div>
                    )}

                    {isExpanded && (
                        <CollapsibleTrigger
                            className={cn(
                                "flex items-center justify-center p-2 rounded-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring select-none !cursor-pointer",
                                disabled ? "cursor-not-allowed" : ""
                            )}
                            disabled={disabled}
                        >
                            <ChevronRight
                                data-testid={testId ? `${testId}-chevron` : undefined}
                                className={cn(
                                    "h-4 w-4 text-muted-foreground/50 transition-transform shrink-0",
                                    isExpanded ? "rotate-90" : ""
                                )}
                            />
                        </CollapsibleTrigger>
                    )}
                </div>

                <CollapsibleContent
                    className={cn(
                        "w-full min-w-0 overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up",
                        forceMount && !isExpanded && "hidden"
                    )}
                    data-testid={testId ? `${testId}-content` : undefined}
                    forceMount={forceMount || undefined}
                >
                    {/* Content area: using lighter background */}
                    <div className="px-1.5 pb-1.5 pt-1.5 bg-card/10">
                        {children}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
})
